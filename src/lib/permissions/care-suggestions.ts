import type { SharedSummary } from "@/types/permission";
import { PARTNER } from "@/lib/copy";

export interface CareSuggestion {
  id: string;
  text: string;
}

/**
 * Saran ini cuma dibangun dari data yang Aivel pilih untuk dibagikan.
 *
 * Aturan bahasanya, sesuai spesifikasi produk: selalu menggantung ("kayanya",
 * "mungkin", "coba"), jangan pernah memastikan dia lagi ngerasa apa, jangan
 * memberi diagnosis, dan jangan pakai stereotip soal mens atau mood.
 */
export function buildCareSuggestions(summary: SharedSummary | null): CareSuggestion[] {
  if (!summary) return [];

  const suggestions: CareSuggestion[] = [];

  if (typeof summary.painLevel === "number" && summary.painLevel >= 7) {
    suggestions.push({
      id: "pain-high",
      text: "She may be having a rough day. Offer a warm drink, some rest, or a gentle check-in.",
    });
  } else if (typeof summary.painLevel === "number" && summary.painLevel >= 4) {
    suggestions.push({
      id: "pain-moderate",
      text: "She logged some pain today. Ask what would help.",
    });
  }

  if (summary.mood === "tired" || summary.mood === "overwhelmed") {
    suggestions.push({
      id: "mood-low-energy",
      text: "Her energy may be low today. Keeping plans easy could help.",
    });
  }

  if (summary.mood === "sensitive" || summary.mood === "anxious") {
    suggestions.push({
      id: "mood-gentle",
      text: "A calm chat with no rush might feel good today.",
    });
  }

  if (summary.predictedPeriodRange) {
    const daysAway = Math.ceil(
      (new Date(summary.predictedPeriodRange.start).getTime() - Date.now()) / 86_400_000,
    );
    if (daysAway >= 0 && daysAway <= 4) {
      suggestions.push({
        id: "period-approaching",
        text: "Her period may be coming up. Ask if there's anything she'd like you to get ready.",
      });
    }
  }

  if (summary.flowStatus && summary.flowStatus !== "none") {
    suggestions.push({
      id: "on-period",
      text: "Aivel is on her period. A little warmth and patience can go a long way.",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "default",
      text: "Nothing specific stands out today. A simple check-in is still nice.",
    });
  }

  return suggestions;
}

/** Dipakai di mana pun izinnya mati, biar ga muncul kolom kosong atau error. */
export const PRIVATE_PLACEHOLDER = PARTNER.privatePlaceholder;
