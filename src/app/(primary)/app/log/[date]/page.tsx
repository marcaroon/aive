import type { Metadata } from "next";
import { LogScreen } from "@/components/daily-log/log-screen";

export const metadata: Metadata = { title: "Daily log" };

export default async function DatedLogPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  return <LogScreen date={date} />;
}
