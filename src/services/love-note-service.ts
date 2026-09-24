import { AUTH_ENABLED } from "@/lib/config";
import { privateCall } from "@/lib/private/client";
import {
  addDoc,
  arrayUnion,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { loveNotesCollection, paths } from "@/lib/firebase/collections";
import { sanitizeText } from "@/lib/validation/schemas";
import { LOVE_NOTE_MAX_LENGTH, type LoveNote } from "@/types/relationship";

export async function listLoveNotes(
  relationshipId: string,
  userId: string,
  count = 30,
): Promise<LoveNote[]> {
  if (!AUTH_ENABLED) return privateCall("listLoveNotes", [relationshipId, userId, count]);
  const snapshot = await getDocs(
    query(loveNotesCollection(relationshipId), orderBy("createdAt", "desc"), limit(count)),
  );
  return snapshot.docs
    .map((entry) => entry.data())
    .filter((note) => !note.hiddenForUserIds?.includes(userId));
}

export async function sendLoveNote(
  relationshipId: string,
  authorId: string,
  message: string,
  emoji?: string,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("sendLoveNote", [relationshipId, authorId, message, emoji]);
  const clean = sanitizeText(message).slice(0, LOVE_NOTE_MAX_LENGTH);
  if (!clean) return;

  await addDoc(loveNotesCollection(relationshipId), {
    authorId,
    message: clean,
    ...(emoji ? { emoji } : {}),
    createdAt: serverTimestamp(),
  } as never);
}

export async function markNoteRead(relationshipId: string, noteId: string): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("markNoteRead", [relationshipId, noteId]);
  await updateDoc(doc(getDb(), paths.loveNotes(relationshipId), noteId), {
    readAt: serverTimestamp(),
  });
}

export async function reactToNote(
  relationshipId: string,
  noteId: string,
  reaction: string,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("reactToNote", [relationshipId, noteId, reaction]);
  await updateDoc(doc(getDb(), paths.loveNotes(relationshipId), noteId), { reaction });
}

/**
 * Hides a note from one person's list without destroying the other's copy —
 * "delete from my view", not "delete for everyone".
 */
export async function hideNoteForUser(
  relationshipId: string,
  noteId: string,
  userId: string,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("hideNoteForUser", [relationshipId, noteId, userId]);
  await updateDoc(doc(getDb(), paths.loveNotes(relationshipId), noteId), {
    hiddenForUserIds: arrayUnion(userId),
  });
}

export const NOTE_REACTIONS = ["🌻", "💛", "🤗", "😊", "🥺"] as const;
