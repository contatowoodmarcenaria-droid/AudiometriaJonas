import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Headphones } from "lucide-react";
import { toast } from "sonner";
import { AudioWaves } from "@/components/AudioWaves";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/sessionContext";

function useRipple() {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const addRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
  }, []);
  return { ripples, addRipple };
}

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { session, loading: checkingSession } = useSession();
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { ripples: btnRipples, addRipple: addBtnRipple } = useRipple();

  useEffect(() => {
    if (!checkingSession && session) {
      navigate("/dashboard");
    }
  }, [session, checkingSession, navigate]);

  useEffect(() => {
    if (email || password) {
      setIsTyping(true);
      const t = setTimeout(() => setIsTyping(false), 1200);
      return () => clearTimeout(t);
    }
  }, [email, password]);

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!email) e.email = "Email é obrigatório";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Email inválido";
    if (!password) e.password = "Senha é obrigatória";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Confirme seu email antes de fazer login");
        } else {
          toast.error(error.message);
        }
      }
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1E3C]">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] overflow-hidden">

      {/* ─── LEFT SIDE: Visual / Branding ─── */}
      <div
        className="relative md:w-1/2 min-h-[260px] md:min-h-screen overflow-hidden flex flex-col items-center justify-center"
        style={{ animation: "fadeInLeft 0.8s ease-out forwards" }}
      >
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(135deg, #0B1E3C 0%, #1e1b4b 40%, #0f2d1f 75%, #0B1E3C 100%)",
          backgroundSize: "400% 400%",
          animation: "gradientShift 8s ease infinite",
        }} />

        {/* Glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full"
            style={{ width: 400, height: 400, top: "5%", left: "5%", background: "radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)", filter: "blur(50px)", animation: "pulseBlob1 5s ease-in-out infinite" }} />
          <div className="absolute rounded-full"
            style={{ width: 300, height: 300, bottom: "10%", right: "5%", background: "radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)", filter: "blur(50px)", animation: "pulseBlob2 7s ease-in-out infinite 1s" }} />
        </div>

        {/* Sound waves canvas */}
        <div className="absolute inset-0">
          <AudioWaves isTyping={isTyping} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-10 py-12">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, rgba(79,70,229,0.8), rgba(34,197,94,0.6))",
              boxShadow: "0 0 40px rgba(79,70,229,0.5), 0 0 80px rgba(34,197,94,0.2)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.15)",
              animation: "floatIcon 3.5s ease-in-out infinite",
            }}
          >
            <Headphones className="w-10 h-10 text-white" />
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4"
            style={{ animation: "fadeInUp 0.7s ease-out 0.4s both" }}
          >
            Precisão em<br />
            <span style={{ background: "linear-gradient(90deg, #818cf8, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Audiometria Ocupacional
            </span>
          </h1>

          <p
            className="text-base text-indigo-200/80 max-w-xs leading-relaxed"
            style={{ animation: "fadeInUp 0.7s ease-out 0.6s both" }}
          >
            Tecnologia avançada para avaliação da saúde auditiva
          </p>

          <div
            className="flex flex-wrap gap-2 mt-8 justify-center"
            style={{ animation: "fadeIn 0.7s ease-out 0.9s both" }}
          >
            {["Audiometria Tonal", "Laudos PDF", "Gestão de Pacientes"].map((tag) => (
              <span key={tag} className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT SIDE: Login Form ─── */}
      <div
        className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#F8FAFC]"
        style={{ animation: "fadeInRight 0.8s ease-out forwards" }}
      >
        <div className="w-full max-w-[420px]">

          {/* Header */}
          <div className="mb-8" style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}>
            <div className="flex items-center gap-3 mb-6 md:hidden">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #4F46E5, #22C55E)" }}>
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-[#0B1E3C] text-lg">FonoOcupacional</span>
            </div>
            <h2 className="text-3xl font-bold text-[#0B1E3C] mb-2">Bem-vindo de volta</h2>
            <p className="text-[#64748b] text-sm">Entre com seu email e senha para acessar o sistema</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" style={{ animation: "fadeInUp 0.6s ease-out 0.4s both" }}>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#1e293b] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={isLoading}
                className="w-full h-12 px-4 rounded-xl text-sm text-[#0B1E3C] placeholder:text-slate-400 outline-none transition-all duration-200"
                style={{
                  border: errors.email ? "1.5px solid #ef4444" : focusedField === "email" ? "1.5px solid #4F46E5" : "1.5px solid #e2e8f0",
                  boxShadow: focusedField === "email" ? "0 0 0 3px rgba(79,70,229,0.12), 0 2px 8px rgba(79,70,229,0.08)" : errors.email ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
                  background: errors.email ? "#fef2f2" : "#fff",
                }}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1.5 transition-all duration-200">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-[#1e293b]">Senha</label>
                <button type="button" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full h-12 px-4 pr-12 rounded-xl text-sm text-[#0B1E3C] placeholder:text-slate-400 outline-none transition-all duration-200"
                  style={{
                    border: errors.password ? "1.5px solid #ef4444" : focusedField === "password" ? "1.5px solid #4F46E5" : "1.5px solid #e2e8f0",
                    boxShadow: focusedField === "password" ? "0 0 0 3px rgba(79,70,229,0.12), 0 2px 8px rgba(79,70,229,0.08)" : errors.password ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
                    background: errors.password ? "#fef2f2" : "#fff",
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5 transition-all duration-200">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              onClick={addBtnRipple}
              className="relative w-full h-12 rounded-xl font-semibold text-white text-sm overflow-hidden mt-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundImage: isLoading ? "none" : "linear-gradient(135deg, #4F46E5 0%, #7c3aed 50%, #22C55E 100%)",
                backgroundColor: isLoading ? "#94a3b8" : "transparent",
                backgroundSize: "200% 200%",
                boxShadow: isLoading ? "none" : "0 4px 20px rgba(79,70,229,0.4)",
              }}
            >
              {btnRipples.map((r) => (
                <span key={r.id} className="absolute rounded-full bg-white/30 animate-ping"
                  style={{ left: r.x - 20, top: r.y - 20, width: 40, height: 40 }} />
              ))}
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </span>
              ) : "Entrar"}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-[#64748b] mt-6" style={{ animation: "fadeIn 0.7s ease-out 0.8s both" }}>
            Não tem uma conta?{" "}
            <a href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              Criar conta gratuita
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseBlob1 {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes pulseBlob2 {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
