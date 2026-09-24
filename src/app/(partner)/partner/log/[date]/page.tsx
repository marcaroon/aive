import { notFound } from "next/navigation";
import { isValid, parseISO, format } from "date-fns";
import { PartnerLogScreen } from "@/components/partner/partner-log-screen";
export const metadata = { title: "Aivel's check-in" };
export default async function Page({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const parsed = parseISO(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isValid(parsed) || format(parsed, "yyyy-MM-dd") !== date) notFound();
  return <PartnerLogScreen date={date} />;
}
