import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppLayout } from "./components/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Empresas from "./pages/Empresas";
import Colaboradores from "./pages/Colaboradores";
import Exames from "./pages/Exames";
import Comparativo from "./pages/Comparativo";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import ExameAudiometrico from "./pages/ExameAudiometrico";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SessionProvider, useSession } from "@/lib/sessionContext";
import { supabase } from "@/lib/supabase";
import ResetPassword from "./pages/ResetPassword";

// ─── Auth Callback ────────────────────────────────────────────────────────────
// Handles email confirmation and password-reset links in two formats:
//
//  1. Query params (new Supabase email templates):
//     /auth/callback?token_hash=xxx&type=recovery
//     → calls verifyOtp({ token_hash, type }) to exchange for a session
//
//  2. Hash fragment (implicit flow, legacy templates):
//     /auth/callback#access_token=xxx&type=signup
//     → SDK processes automatically via detectSessionInUrl:true

function AuthCallback() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("Processando link...");

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      // ── Format 1: query params (?token_hash=xxx&type=yyy) ──────────────────
      const searchParams = new URLSearchParams(window.location.search);
      const tokenHash = searchParams.get("token_hash");
      const typeParam = searchParams.get("type") as
        | "signup"
        | "recovery"
        | "email_change"
        | "invite"
        | null;

      if (tokenHash && typeParam) {
        setMessage(
          typeParam === "recovery" ? "Verificando link de senha..." : "Confirmando email..."
        );

        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: typeParam,
        });

        if (cancelled) return;

        if (otpError) {
          setError(`Erro ao verificar link: ${otpError.message}`);
          return;
        }

        // Token valid — session is now established by the SDK.
        // Clean up the token_hash from the URL before redirecting.
        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, "", cleanUrl);

        if (typeParam === "recovery") {
          navigate("/reset-password", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
        return;
      }

      // ── Format 2: hash fragment (#access_token=xxx&type=yyy) ───────────────
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const hashType = hashParams.get("type");
      const accessToken = hashParams.get("access_token");

      if (hashType === "recovery" && accessToken) {
        navigate("/reset-password", { replace: true });
        return;
      }

      // Email confirmation or other — SDK fires onAuthStateChange automatically.
      setMessage("Confirmando email...");

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (cancelled) return;
        if (event === "SIGNED_IN") {
          navigate("/login", { replace: true });
        } else if (event === "PASSWORD_RECOVERY") {
          navigate("/reset-password", { replace: true });
        }
      });

      // In case the event already fired before our listener attached
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && session) {
        subscription.unsubscribe();
        if (hashType === "recovery") {
          navigate("/reset-password", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
        return;
      }

      // Fallback timeout if no event fires
      const timeout = setTimeout(() => {
        if (!cancelled) setError("Erro ao processar link. Tente fazer login.");
      }, 8000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1E3C]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <a href="/login" className="text-indigo-400 underline">Ir para o login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1E3C]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm text-indigo-200">{message}</p>
      </div>
    </div>
  );
}

// ─── Root redirect ────────────────────────────────────────────────────────────

function RootRedirect() {
  const { session, loading } = useSession();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (location !== "/") return;
    if (!session) {
      navigate("/login", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [session, loading, location, navigate]);

  return null;
}

// ─── Protected pages ──────────────────────────────────────────────────────────
// AppLayout stays mounted — only inner page content changes on navigation.

function ProtectedPages() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/empresas" component={Empresas} />
      <Route path="/colaboradores" component={Colaboradores} />
      <Route path="/exames/novo" component={ExameAudiometrico} />
      <Route path="/exames/:id" component={ExameAudiometrico} />
      <Route path="/exames" component={Exames} />
      <Route path="/comparativo" component={Comparativo} />
      <Route path="/relatorios" component={Relatorios} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ─── Main Router ──────────────────────────────────────────────────────────────

function RedirectToLogin() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/login", { replace: true });
  }, [navigate]);
  return null;
}

function AppRouter() {
  const { session, loading } = useSession();
  const [location] = useLocation();

  // Still loading session — show spinner, no redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  // Public routes — always accessible
  if (location === "/") return <RootRedirect />;
  if (location === "/login") return <Login />;
  if (location === "/signup") return <Signup />;
  if (location === "/auth/callback") return <AuthCallback />;
  if (location === "/reset-password") return <ResetPassword />;

  // Protected routes — need session
  if (!session) return <RedirectToLogin />;

  // Authenticated — persistent AppLayout with page content switching inside
  return (
    <AppLayout>
      <ProtectedPages />
    </AppLayout>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <SessionProvider>
          <TooltipProvider>
            <Toaster />
            <AppRouter />
          </TooltipProvider>
        </SessionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
