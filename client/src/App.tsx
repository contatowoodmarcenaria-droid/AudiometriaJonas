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
import { supabase } from "@/lib/supabase";
import { createContext, useContext, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

// ─── Global Session Context ───────────────────────────────────────────────────
// Single source of truth for auth state. Initialized once at app root.
// All components read from this context instead of calling getSession() again.

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

function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for all auth changes (login, logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Only flip loading on the very first event if still loading
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

// ─── Auth Callback ────────────────────────────────────────────────────────────

function AuthCallback() {
  const [, navigate] = useLocation();
  const { session, loading } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (session) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // If session not ready yet, wait for onAuthStateChange to fire
    const timeout = setTimeout(() => {
      if (!session) {
        setError("Erro ao confirmar email. Tente fazer login.");
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [session, loading, navigate]);

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
        <p className="text-sm text-indigo-200">Confirmando email...</p>
      </div>
    </div>
  );
}

// ─── Route Guards ─────────────────────────────────────────────────────────────

function RootRedirect() {
  const { session, loading } = useSession();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    navigate(session ? "/dashboard" : "/login", { replace: true });
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1E3C]">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/login", { replace: true });
    }
  }, [session, loading, navigate]);

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

  if (!session) return null;

  return <AppLayout>{children}</AppLayout>;
}

// ─── Router ───────────────────────────────────────────────────────────────────

function Router() {
  return (
    <Switch>
      {/* Rotas públicas */}
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/auth/callback" component={AuthCallback} />

      {/* Rotas protegidas */}
      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/empresas">
        <ProtectedRoute><Empresas /></ProtectedRoute>
      </Route>
      <Route path="/colaboradores">
        <ProtectedRoute><Colaboradores /></ProtectedRoute>
      </Route>
      <Route path="/exames/novo">
        <ProtectedRoute><ExameAudiometrico /></ProtectedRoute>
      </Route>
      <Route path="/exames/:id">
        <ProtectedRoute><ExameAudiometrico /></ProtectedRoute>
      </Route>
      <Route path="/exames">
        <ProtectedRoute><Exames /></ProtectedRoute>
      </Route>
      <Route path="/comparativo">
        <ProtectedRoute><Comparativo /></ProtectedRoute>
      </Route>
      <Route path="/relatorios">
        <ProtectedRoute><Relatorios /></ProtectedRoute>
      </Route>
      <Route path="/configuracoes">
        <ProtectedRoute><Configuracoes /></ProtectedRoute>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
            <Router />
          </TooltipProvider>
        </SessionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
