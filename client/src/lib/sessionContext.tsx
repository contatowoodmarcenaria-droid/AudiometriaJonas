import { supabase } from "@/lib/supabase";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

type SessionContextType = {
  session: Session | null;
  loading: boolean;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
});

export function useSession() {
  return useContext(SessionContext);
}

/**
 * Silently wipes all Supabase tokens from storage and redirects to /login.
 * Called when a corrupted/expired/incompatible session is detected —
 * the user never sees an error screen.
 */
async function purgeCorruptedSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore — we're cleaning up regardless
  }
  Object.keys(localStorage)
    .filter((k) => k.startsWith("sb-") || k.includes("fono-ocupacional-auth"))
    .forEach((k) => localStorage.removeItem(k));
  sessionStorage.clear();
  // replace() avoids a back-button entry for the broken state
  window.location.replace("/login");
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── Initial session load ──────────────────────────────────────────────────
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.warn("[SessionProvider] getSession error — purging session:", error.message);
          purgeCorruptedSession();
          return;
        }
        setSession(session);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.warn("[SessionProvider] getSession threw — purging session:", err);
        purgeCorruptedSession();
      });

    // ── Auth state listener ───────────────────────────────────────────────────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED with a null session means the refresh token is invalid
      // (expired, revoked, or from an incompatible flow like old PKCE tokens).
      // Purge silently so the user lands on /login cleanly.
      if (event === "TOKEN_REFRESHED" && !session) {
        console.warn("[SessionProvider] TOKEN_REFRESHED returned null — purging session.");
        purgeCorruptedSession();
        return;
      }
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ session, loading }), [session, loading]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
