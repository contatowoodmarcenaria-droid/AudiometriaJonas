import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** JWT / refresh-token corruption — should clear storage and redirect to login. */
function isAuthTokenError(error: Error | null): boolean {
  if (!error) return false;
  const msg = error.message + (error.stack ?? "");
  return (
    msg.includes("Refresh Token") ||
    msg.includes("Invalid Refresh Token") ||
    msg.includes("JWT expired") ||
    msg.includes("JWT")
  );
}

/**
 * React DOM reconciliation errors caused by rapid navigation / race conditions.
 * These are transient — a page reload is enough.
 */
function isDomReconciliationError(error: Error | null): boolean {
  if (!error) return false;
  const msg = error.message + (error.stack ?? "");
  return (
    msg.includes("insertBefore") ||
    msg.includes("removeChild") ||
    msg.includes("NotFoundError")
  );
}

function clearSupabaseStorage() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("sb-") || k.includes("fono-ocupacional-auth"))
    .forEach((k) => localStorage.removeItem(k));
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

  componentDidCatch(error: Error) {
    if (isAuthTokenError(error)) {
      // Corrupted auth token — wipe storage and send to login silently.
      clearSupabaseStorage();
      window.location.replace("/login");
    } else if (isDomReconciliationError(error)) {
      // Transient DOM race — a reload is sufficient.
      window.location.reload();
    }
    // Other errors: fall through to the error UI below.
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isSilent =
      isAuthTokenError(this.state.error) || isDomReconciliationError(this.state.error);

    if (isSilent) {
      // Redirect / reload is already in progress — show a spinner while it happens.
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B1E3C]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      );
    }

    // Genuine application error — show a minimal error UI.
    return (
      <div
        className="flex items-center justify-center min-h-screen p-8"
        style={{ background: "#0B1E3C" }}
      >
        <div
          className="flex flex-col items-center w-full max-w-lg p-8 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <AlertTriangle size={48} className="text-amber-400 mb-4 flex-shrink-0" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Ocorreu um erro inesperado.
          </h2>
          <p
            className="text-sm text-center mb-6"
            style={{ color: "rgba(199,210,254,0.8)" }}
          >
            Tente recarregar a página. Se o problema persistir, entre em contato com o suporte.
          </p>

          <button
            onClick={() => window.location.reload()}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm",
              "bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            )}
          >
            <RotateCcw size={16} />
            Recarregar página
          </button>

          <details className="mt-6 w-full">
            <summary
              className="text-xs cursor-pointer transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Detalhes técnicos
            </summary>
            <div
              className="mt-2 p-3 rounded-lg overflow-auto max-h-40"
              style={{ background: "rgba(0,0,0,0.3)" }}
            >
              <pre
                className="text-xs whitespace-pre-wrap break-all"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {this.state.error?.message}
              </pre>
            </div>
          </details>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
