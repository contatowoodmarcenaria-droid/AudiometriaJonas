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
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

// Hook to get Supabase session
function useSupabaseSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading: session === undefined };
}

// Redireciona / para /login (não autenticado) ou /dashboard (autenticado)
function RootRedirect() {
  const { session, loading } = useSupabaseSession();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (session) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1E3C]">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );
}

// Protected route wrapper: redirects to /login if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSupabaseSession();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/login");
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

function Router() {
  return (
    <Switch>
      {/* Rotas públicas */}
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
