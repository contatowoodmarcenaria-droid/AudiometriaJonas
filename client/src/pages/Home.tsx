import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  Headphones,
  Building2,
  Users,
  FileText,
  BarChart3,
  Shield,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Se já autenticado, redireciona para o dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogin = () => {
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2b7fff] to-[#155dfc] flex items-center justify-center animate-pulse">
            <Headphones className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Building2,
      title: "Gestão de Empresas",
      desc: "Cadastre e gerencie todas as empresas clientes com CNPJ, endereço e contatos.",
    },
    {
      icon: Users,
      title: "Cadastro de Colaboradores",
      desc: "Registre funcionários com dados completos, histórico de exames e acompanhamento evolutivo.",
    },
    {
      icon: Headphones,
      title: "Exame Audiométrico",
      desc: "Formulário completo com audiograma interativo, símbolos ASHA, VA e VO para OD e OE.",
    },
    {
      icon: FileText,
      title: "Laudo em PDF",
      desc: "Geração automática de laudos profissionais em PDF com dados da clínica e assinatura.",
    },
    {
      icon: BarChart3,
      title: "Comparativo Evolutivo",
      desc: "Analise a evolução auditiva do colaborador ao longo do tempo com gráficos comparativos.",
    },
    {
      icon: Shield,
      title: "Dados Isolados por Usuário",
      desc: "Cada fonoaudiólogo tem seus próprios dados, completamente privados e seguros.",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2b7fff] to-[#155dfc] flex items-center justify-center">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <span className="text-[#101828] font-semibold text-lg">FonoOcupacional</span>
          </div>
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm font-medium transition-colors"
          >
            Entrar
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center bg-gradient-to-b from-blue-50/60 to-white">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-[#155dfc] text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#155dfc]" />
          Plataforma de Audiometria Ocupacional
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-[#101828] leading-tight max-w-2xl mb-5">
          Gestão completa de{" "}
          <span className="text-[#155dfc]">audiometrias ocupacionais</span>
        </h1>

        <p className="text-lg text-[#6a7282] max-w-xl mb-10 leading-relaxed">
          Sistema web profissional para fonoaudiólogos. Realize exames audiométricos,
          gere laudos em PDF e acompanhe a evolução auditiva dos colaboradores das
          empresas que você atende.
        </p>

        {/* Login Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleLogin}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#155dfc] hover:bg-[#1249d4] text-white font-semibold text-base transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02] active:scale-[0.99]"
          >
            {/* Google Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff" fillOpacity="0.9"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff" fillOpacity="0.9"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#ffffff" fillOpacity="0.9"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ffffff" fillOpacity="0.9"/>
            </svg>
            Entrar com Google
          </button>
          <p className="text-xs text-[#99a1af]">
            Acesse com sua conta Google. Seus dados ficam privados e isolados.
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-[#6a7282]">
          {["Dados isolados por usuário", "Laudos em PDF", "Audiograma interativo", "Gratuito para testar"].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#155dfc]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#101828] mb-3">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-[#6a7282] max-w-lg mx-auto">
              Do cadastro da empresa ao laudo final, o FonoOcupacional cobre todo o fluxo
              de trabalho da audiometria ocupacional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-100 hover:shadow-md hover:shadow-blue-50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
                    <Icon className="w-5 h-5 text-[#155dfc]" />
                  </div>
                  <h3 className="font-semibold text-[#101828] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#6a7282] leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-[#155dfc] to-[#2b7fff]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Comece a usar agora mesmo
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Faça login com sua conta Google e comece a gerenciar suas audiometrias
            ocupacionais de forma profissional.
          </p>
          <button
            onClick={handleLogin}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white hover:bg-gray-50 text-[#155dfc] font-semibold text-base transition-all shadow-lg hover:scale-[1.02] active:scale-[0.99]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#99a1af]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2b7fff] to-[#155dfc] flex items-center justify-center">
              <Headphones className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-[#6a7282]">FonoOcupacional</span>
          </div>
          <p>Plataforma de Saúde Auditiva Ocupacional &mdash; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
