import { beforeEach, describe, expect, it, vi } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
vi.mock("server-only", () => ({}));
const { store } = vi.hoisted(() => ({
  store: new Map<string, Record<string, unknown>>(),
}));
vi.mock("@/lib/firebase/admin", () => {
  const doc = (path: string) => ({
    id: path.split("/").at(-1),
    path,
    get: async () => ({
      exists: store.has(path),
      data: () => store.get(path),
      id: path.split("/").at(-1),
    }),
    set: async (
      data: Record<string, unknown>,
      options?: { merge: boolean },
    ) => {
      store.set(path, options?.merge ? { ...store.get(path), ...data } : data);
    },
    update: async (data: Record<string, unknown>) => {
      if (!store.has(path)) throw new Error("missing");
      store.set(path, { ...store.get(path), ...data });
    },
    delete: async () => {
      store.delete(path);
    },
  });
  const collection = (path: string, filters: Array<[string, unknown]> = []) => {
    const query = {
      where: (field: string, _op: string, value: unknown) =>
        collection(path, [...filters, [field, value]]),
      orderBy: () => query,
      limit: () => query,
      get: async () => {
        const docs = [...store.entries()]
          .filter(
            ([key, data]) =>
              key.startsWith(path + "/") &&
              key.split("/").length === path.split("/").length + 1 &&
              filters.every(([field, value]) => data[field] === value),
          )
          .map(([key, data]) => ({
            id: key.split("/").at(-1),
            data: () => data,
            ref: doc(key),
          }));
        return { docs, size: docs.length, empty: docs.length === 0 };
      },
    };
    return query;
  };
  return { getAdminDb: () => ({ doc, collection }) };
});
import { privateOperations, resolveUserId } from "./operations";
import { DEFAULT_PARTNER_PERMISSIONS } from "@/types/permission";

beforeEach(() => {
  store.clear();
  vi.stubEnv("AIVE_PRIMARY_USER_ID", "aivel");
  vi.stubEnv("AIVE_PARTNER_USER_ID", "ammar");
  store.set("users/aivel", { role: "primary", timezone: "Asia/Jakarta" });
  store.set("users/ammar", { role: "partner" });
  store.set("relationships/pair", {
    primaryUserId: "aivel",
    partnerUserId: "ammar",
    status: "active",
  });
  store.set("relationships/pair/permissions/current", {
    ...DEFAULT_PARTNER_PERMISSIONS,
  });
});
describe("server-enforced private operations", () => {
  it("allows the configured partner to read all health data but never modify it", async () => {
    const ops = await privateOperations("partner");
    expect(await ops.getDailyLog(["aivel", "2026-09-24"])).toBeNull();
    await expect(ops.getDailyLog(["ammar", "2026-09-24"])).rejects.toThrow();
    expect(await ops.listPeriodDays(["aivel"])).toEqual([]);
    expect(await ops.getPrimaryProfile(["aivel"])).toBeNull();
    await expect(ops.deleteHealthData(["aivel"])).rejects.toThrow();
    await expect(
      ops.saveDailyLog([
        "aivel",
        { date: "2026-09-24", moods: [], symptoms: [] },
      ]),
    ).rejects.toThrow();
    expect(ops).not.toHaveProperty("savePermissions");
  });
  it("returns the same complete check-in to both people despite old sharing flags", async () => {
    const log = {
      date: "2026-09-24",
      moods: ["happy", "tired"],
      symptoms: ["cramps"],
      painLevel: 0,
      flowLevel: "light",
      energyLevel: "low",
      sleepHours: 7.5,
      sleepQuality: "good",
      sleepNotes: "Woke up once",
      waterGlasses: 0,
      activities: ["walking"],
      privateNotes: "A full note",
      createdAt: Timestamp.fromMillis(1000),
    };
    store.set("users/aivel/dailyLogs/2026-09-24", log);
    const partner = await privateOperations("partner");
    const primary = await privateOperations("primary");
    expect(await partner.getDailyLog(["aivel", "2026-09-24"])).toEqual(
      await primary.getDailyLog(["aivel", "2026-09-24"]),
    );
    expect(await partner.getDailyLog(["aivel", "2026-09-24"])).toMatchObject(
      log,
    );
    expect(await partner.listRecentLogs(["aivel", 90])).toEqual([
      expect.objectContaining(log),
    ]);
    await expect(
      partner.getDailyLog(["other-primary", "2026-09-24"]),
    ).rejects.toThrow();
    await expect(
      partner.savePrimaryProfile([
        "aivel",
        { averageCycleLength: 28, averagePeriodDuration: 5 },
      ]),
    ).rejects.toThrow();
    await expect(
      partner.deleteReminder(["aivel", "reminder"]),
    ).rejects.toThrow();
  });
  it("blocks unrelated relationships and impersonated note authors", async () => {
    const ops = await privateOperations("partner");
    store.set("relationships/other", {
      primaryUserId: "someone",
      partnerUserId: "else",
      status: "active",
    });
    await expect(ops.listLoveNotes(["other", "ammar", 30])).rejects.toThrow();
    await expect(
      ops.sendLoveNote(["pair", "aivel", "forged", null]),
    ).rejects.toThrow();
    await expect(
      ops.updateUserDocument(["aivel", { preferredName: "changed" }]),
    ).rejects.toThrow();
  });
  it("does not let profile updates change a role or accept invalid dates", async () => {
    const ops = await privateOperations("partner");
    await ops.updateUserDocument([
      "ammar",
      { role: "primary", preferredName: "Ammar" },
    ]);
    expect(store.get("users/ammar")?.role).toBe("partner");
    const primary = await privateOperations("primary");
    await expect(
      primary.getDailyLog(["aivel", "2026-02-31"]),
    ).rejects.toThrow();
    await expect(
      primary.getDailyLog(["../another", "2026-09-24"]),
    ).rejects.toThrow();
  });
  it("rebuilds current summary fields instead of returning stale historical fields", async () => {
    const ops = await privateOperations("partner");
    store.set("sharedSummaries/pair", {
      dailyNote: "stale private note",
      mood: "sad",
    });
    const result = (await ops.getSharedSummary(["pair"])) as Record<
      string,
      unknown
    >;
    expect(result).not.toHaveProperty("dailyNote");
    expect(result).not.toHaveProperty("mood");
  });
  it("revoked relationships cannot read notes or summaries and do not auto-reconnect", async () => {
    store.set("relationships/pair", {
      primaryUserId: "aivel",
      partnerUserId: "ammar",
      status: "revoked",
    });
    const ops = await privateOperations("partner");
    await expect(ops.getSharedSummary(["pair"])).rejects.toThrow();
    await expect(ops.listLoveNotes(["pair", "ammar", 30])).rejects.toThrow();
    expect(await ops.getRelationshipForUser(["ammar", "partner"])).toBeNull();
  });
  it("removes cleared optional log fields and keeps creation time", async () => {
    store.delete("relationships/pair");
    const createdAt = Timestamp.fromMillis(1000);
    store.set("users/aivel/dailyLogs/2026-09-24", {
      privateNotes: "old text",
      painLevel: 4,
      createdAt,
    });
    const ops = await privateOperations("primary");
    await ops.saveDailyLog([
      "aivel",
      { date: "2026-09-24", moods: ["calm"], symptoms: [] },
    ]);
    const log = store.get("users/aivel/dailyLogs/2026-09-24");
    expect(log).not.toHaveProperty("privateNotes");
    expect(log).not.toHaveProperty("painLevel");
    expect(log?.createdAt).toBe(createdAt);
  });
  it("refuses ambiguous profiles instead of selecting someone else's history", async () => {
    vi.stubEnv("AIVE_PRIMARY_USER_ID", "");
    store.set("users/other", { role: "primary" });
    await expect(resolveUserId("primary")).rejects.toThrow(
      "select the intended profiles",
    );
  });
  it("ignores obsolete per-field switches in the shared personal space", async () => {
    store.set("relationships/pair/permissions/current", {
      ...DEFAULT_PARTNER_PERMISSIONS,
      shareSupportRequest: false,
    });
    const ops = await privateOperations("partner");
    expect(await ops.listSupportRequests(["pair", 20])).toEqual([]);
    expect(await ops.getPermissions(["pair"])).toEqual({
      ...DEFAULT_PARTNER_PERMISSIONS,
      shareCyclePhase: true,
      sharePredictedPeriod: true,
      shareMood: true,
      sharePainLevel: true,
      shareFlowStatus: true,
      shareSymptoms: true,
      shareDailyNotes: true,
      shareSupportRequest: true,
    });
  });
});
