"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { AUTH_ENABLED } from "@/lib/config";
import { deserialize } from "@/lib/private/serialization";
import { AppLogo } from "@/components/ui/app-logo";
import { Button } from "@/components/ui/button";
import { userDoc } from "@/lib/firebase/collections";
import { signOut as authSignOut } from "@/services/auth-service";
import type { UserDocument } from "@/types/user";

interface AuthContextValue {
  user: Pick<User, "uid"> | null;
  profile: UserDocument | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Navigation-only cookie. It carries no health data and is never trusted for
 * authorization — Firestore Security Rules are the real gate. It exists so the
 * middleware can redirect without a flash of the wrong screen.
 */
const NAV_COOKIE = "aive_nav";

function writeNavCookie(profile: UserDocument | null) {
  if (typeof document === "undefined") return;
  if (!profile) {
    document.cookie = `${NAV_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }
  const value = `${profile.role}:${profile.onboardingCompleted ? "1" : "0"}`;
  document.cookie = `${NAV_COOKIE}=${value}; Path=/; Max-Age=2592000; SameSite=Lax`;
}

function AccountAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(getFirebaseAuth(), (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        writeNavCookie(null);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    // Live profile so a role or onboarding change reflects immediately.
    const unsubscribe = onSnapshot(
      userDoc(firebaseUser.uid),
      (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : null;
        setProfile(data);
        writeNavCookie(data);
        setLoading(false);
      },
      () => {
        setProfile(null);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [firebaseUser]);

  const signOut = useCallback(async () => {
    writeNavCookie(null);
    await authSignOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: firebaseUser,
      profile,
      loading,
      configured: isFirebaseConfigured,
      signOut,
    }),
    [firebaseUser, profile, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return context;
}

/** The old account provider stays intact and is mounted only when enabled. */
export function AuthProvider({ children }: { children: ReactNode }) {
  return AUTH_ENABLED ? (
    <AccountAuthProvider>{children}</AccountAuthProvider>
  ) : (
    <PrivateLinkProvider>{children}</PrivateLinkProvider>
  );
}

function PrivateLinkProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/private/session", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const next = deserialize<UserDocument>(result.profile);
      setProfile((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
      setError(null);
    } catch (failure) {
      setProfile(null);
      setError(
        failure instanceof Error
          ? failure.message
          : "Couldn't open your space. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("aive:profile-updated", refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("aive:profile-updated", refresh);
    };
  }, [load]);
  const user = useMemo(() => (profile ? { uid: profile.id } : null), [profile]);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      configured: true,
      signOut: async () => {},
    }),
    [user, profile, loading],
  );
  // The access-link and public information pages work without a session.
  const isPublic = ["/open", "/privacy", "/terms"].includes(pathname);
  if (error && !isPublic)
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
        <AppLogo showTagline />
        <p role="status" className="text-sm text-[var(--color-muted)]">
          {error}
        </p>
        <Button
          onClick={() => {
            setLoading(true);
            void load();
          }}
        >
          Try again
        </Button>
      </main>
    );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
