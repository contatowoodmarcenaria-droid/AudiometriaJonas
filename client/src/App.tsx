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
// Handles both email confirmation and password-reset links.
// With flowType:'implicit', Supabase puts tokens directly in the URL hash —
// no code exchange needed; the SDK processes them via detectSessionInUrl:true.

function AuthCallback() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("Processando link...");

  useEffect(() => {
    let cancelled = false;

    // Parse the hash fragment that Supabase appends to the redirect URL
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const type = params.get("type");
    const accessToken = params.get("access_token");

    // Password-reset link: type=recovery
    if (type === "recovery" && accessToken) {
      navigate("/reset-password", { replace: true });
      return;
    }

    // Email confirmation (type=signup / email_change) or any other event:
    // SDK fires onAuthStateChange automatically; we listen and redirect to login.
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session) return;
      if (type === "recovery") {
        navigate("/reset-password", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    });

    const timeout = setTimeout(() => {
      if (!cancelled) setError("Erro ao processar link. Tente fazer login.");
    }, 8000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
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
