import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { todayKey } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Log" };

/** /app/log always means "today" — the dated route does the real work. */
export default function LogIndexPage() {
  redirect(`/app/log/${todayKey()}`);
}
