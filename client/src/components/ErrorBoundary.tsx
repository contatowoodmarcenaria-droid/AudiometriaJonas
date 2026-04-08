import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, LogOut } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isSessionRelatedError(error: Error | null): boolean {
  if (!error) return false;
  const msg = error.message + (error.stack ?? "");
  return (
    msg.includes("insertBefore") ||
    msg.includes("removeChild") ||
    msg.includes("NotFoundError") ||
    msg.includes("Refresh Token") ||
    msg.includes("Invalid Refresh Token") ||
    msg.includes("JWT expired")
  );
}

function clearSupabaseSession() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith("sb-") ||
        key.startsWith("supabase") ||
        key.includes("fono-ocupacional-auth"))
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  sessionStorage.clear();
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReload = () => {
    clearSupabaseSession();
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      const isSessionError = isSessionRelatedError(this.state.error);

      return (
        <div
          className="flex items-center justify-center min-h-screen p-8"
          style={{ background: "#0B1E3C" }}
        >
          <div
            className="flex flex-col items-center w-full max-w-lg p-8 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <AlertTriangle size={48} className="text-amber-400 mb-4 flex-shrink-0" />
            <h2 className="text-xl font-semibold text-white mb-2">Ocorreu um erro inesperado.</h2>

            {isSessionError ? (
              <p className="text-sm text-center mb-6" style={{ color: "rgba(199,210,254,0.8)" }}>
                Sua sessão pode estar desatualizada. Clique em{" "}
                <strong>"Limpar sessão e entrar"</strong> para resolver o problema.
              </p>
            ) : (
              <p className="text-sm text-center mb-6" style={{ color: "rgba(199,210,254,0.8)" }}>
                Tente recarregar a página. Se o problema persistir, limpe a sessão e faça login novamente.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={this.handleClearAndReload}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm",
                  "bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                )}
              >
                <LogOut size={16} />
                Limpar sessão e entrar
              </button>
              <button
                onClick={this.handleReload}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors",
                )}
                style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
              >
                <RotateCcw size={16} />
                Recarregar página
              </button>
            </div>

            <details className="mt-6 w-full">
              <summary className="text-xs cursor-pointer transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
                Detalhes técnicos
              </summary>
              <div className="mt-2 p-3 rounded-lg overflow-auto max-h-40" style={{ background: "rgba(0,0,0,0.3)" }}>
                <pre className="text-xs whitespace-pre-wrap break-all" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {this.state.error?.message}
                </pre>
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
