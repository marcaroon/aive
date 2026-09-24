import { AUTH_ENABLED } from "@/lib/config";
import { privateCall } from "@/lib/private/client";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseAuth, getDb } from "@/lib/firebase/client";
import { paths, userDoc } from "@/lib/firebase/collections";
import { getBrowserTimezone } from "@/lib/utils/date";
import type { UserDocument, UserRole } from "@/types/user";

export const DEFAULT_PREFERRED_NAME = "Aivel";

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

/** Maps Firebase's error codes to language that does not blame the user. */
export function friendlyAuthError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "That email doesn't look right.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "The email or password doesn't match. Try again.";
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in.";
    case "auth/weak-password":
      return "Use at least 8 characters for your password.";
    case "auth/too-many-requests":
      return "Too many tries. Give it a moment and try again.";
    case "auth/network-request-failed":
      return "Couldn't reach the server. Check your connection.";
    default:
      return "Something went wrong. Try again.";
  }
}

export async function registerUser({
  email,
  password,
  fullName,
  role,
}: RegisterInput): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: fullName });

  const preferredName =
    role === "primary" ? DEFAULT_PREFERRED_NAME : fullName.split(" ")[0] || fullName;

  await setDoc(doc(getDb(), paths.users, credential.user.uid), {
    id: credential.user.uid,
    email,
    fullName,
    preferredName,
    role,
    timezone: getBrowserTimezone(),
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return credential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

export async function fetchUserDocument(userId: string): Promise<UserDocument | null> {
  if (!AUTH_ENABLED) return privateCall("fetchUserDocument", [userId]);
  const snapshot = await getDoc(userDoc(userId));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function updateUserDocument(
  userId: string,
  data: Partial<Pick<UserDocument, "fullName" | "preferredName" | "timezone" | "photoURL">>,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("updateUserDocument", [userId, data]);
  await updateDoc(doc(getDb(), paths.users, userId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function markOnboardingCompleted(userId: string): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("markOnboardingCompleted", [userId]);
  await updateDoc(doc(getDb(), paths.users, userId), {
    onboardingCompleted: true,
    updatedAt: serverTimestamp(),
  });
}
