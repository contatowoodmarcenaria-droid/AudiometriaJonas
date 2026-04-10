import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Headphones } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [ready, setReady] = useState(false);

  // The SDK fires PASSWORD_RECOVERY when the user arrives via the reset link.
  // We wait for that event before showing the form (ensures session is set).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Also check if session is already established (event may have fired before mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const inputStyle = (field: string, hasError: boolean) => ({
    border: hasError
      ? "1.5px solid #ef4444"
      : focusedField === field
      ? "1.5px solid #4F46E5"
      : "1.5px solid #e2e8f0",
    boxShadow: focusedField === field
      ? "0 0 0 3px rgba(79,70,229,0.12), 0 2px 8px rgba(79,70,229,0.08)"
      : hasError
      ? "0 0 0 3px rgba(239,68,68,0.1)"
      : "none",
    background: hasError ? "#fef2f2" : "#fff",
  });

  const validate = () => {
    const e: { password?: string; confirm?: string } = {};
    if (!password) e.password = "Senha é obrigatória";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    if (!confirm) e.confirm = "Confirme a senha";
    else if (confirm !== password) e.confirm = "As senhas não coincidem";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Senha atualizada com sucesso!");
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch {
      toast.error("Erro ao atualizar senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1E3C]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm text-indigo-200">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-[420px]">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #4F46E5, #22C55E)" }}>
            <Headphones className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#0B1E3C] mb-1">Nova senha</h2>
          <p className="text-[#64748b] text-sm">Digite e confirme sua nova senha</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-[#1e293b] mb-1.5">Nova senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                disabled={isLoading}
                className="w-full h-12 px-4 pr-12 rounded-xl text-sm text-[#0B1E3C] placeholder:text-slate-400 outline-none transition-all duration-200"
                style={inputStyle("password", !!errors.password)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1.5">{errors.password}</p>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-sm font-semibold text-[#1e293b] mb-1.5">Confirmar senha</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })); }}
                onFocus={() => setFocusedField("confirm")}
                onBlur={() => setFocusedField(null)}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                disabled={isLoading}
                className="w-full h-12 px-4 pr-12 rounded-xl text-sm text-[#0B1E3C] placeholder:text-slate-400 outline-none transition-all duration-200"
                style={inputStyle("confirm", !!errors.confirm)}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm && (
              <p className="text-xs text-red-500 mt-1.5">{errors.confirm}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundImage: isLoading ? "none" : "linear-gradient(135deg, #4F46E5 0%, #7c3aed 50%, #22C55E 100%)",
              backgroundColor: isLoading ? "#94a3b8" : "transparent",
              boxShadow: isLoading ? "none" : "0 4px 20px rgba(79,70,229,0.4)",
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </span>
            ) : "Salvar nova senha"}
          </button>
        </form>

        <p className="text-center text-sm text-[#64748b] mt-6">
          <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            Voltar ao login
          </a>
        </p>
      </div>
    </div>
  );
}
