import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on auth errors — avoids cascade of UNAUTHORIZED retries
      retry: (failureCount, error) => {
        if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") {
          return false;
        }
        return failureCount < 2;
      },
      // Keep data fresh but don't refetch aggressively on window focus
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        // Attach Supabase access token as Bearer token for backend auth
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            return { Authorization: `Bearer ${session.access_token}` };
          }
        } catch (e) {
          console.warn("[tRPC] Failed to get session for headers:", e);
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
