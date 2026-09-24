import { deserialize } from "./serialization";

export async function privateCall<T>(
  operation: string,
  args: unknown[] = [],
): Promise<T> {
  const response = await fetch("/api/private/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ operation, args }),
  });
  if (!response.ok) throw new Error("Couldn't sync right now. Try again.");
  const result = await response.json();
  if (
    [
      "updateUserDocument",
      "savePrivacySettings",
      "savePreferences",
      "markOnboardingCompleted",
    ].includes(operation)
  ) {
    window.dispatchEvent(new Event("aive:profile-updated"));
  }
  return deserialize<T>(result.data);
}
