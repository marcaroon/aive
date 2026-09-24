"use client";

import { useEffect, useRef, useState } from "react";
import { AppLogo } from "@/components/ui/app-logo";

export default function OpenPrivateLinkPage() {
  const [message, setMessage] = useState("Opening your space…");
  const opening = useRef(false);
  useEffect(() => {
    if (opening.current) return;
    opening.current = true;
    // Fragment keys never enter server logs, referrers, or analytics URLs.
    const key = new URLSearchParams(window.location.hash.slice(1)).get("key");
    window.history.replaceState(null, "", "/open");
    if (!key) {
      setMessage("Open your personal Aivé link to get started.");
      return;
    }
    void fetch("/api/private/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const result = await response.json();
        window.location.replace(result.home);
      })
      .catch(() =>
        setMessage(
          "This link couldn't be opened. Check your connection and open the original link again.",
        ),
      );
  }, []);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
      <AppLogo showTagline />
      <p role="status" className="text-sm text-[var(--color-muted)]">
        {message}
      </p>
    </main>
  );
}
