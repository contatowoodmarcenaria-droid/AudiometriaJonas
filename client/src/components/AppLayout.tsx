import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  FileText,
  Headphones,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Users,
  User,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/App";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/empresas", label: "Empresas", icon: Building2 },
  { path: "/colaboradores", label: "Colaboradores", icon: Users },
  { path: "/exames", label: "Exames", icon: Activity },
  { path: "/comparativo", label: "Comparativo Audiométrico", icon: Headphones },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

function UserAvatar({ name, size = "md" }: { name?: string | null; size?: "sm" | "md" | "lg" }) {
  const initials = name
    ? name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "U";
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-10 h-10 text-sm" : "w-9 h-9 text-xs";
  return (
    <div className={cn("rounded-full bg-gradient-to-br from-[#51a2ff] to-[#ad46ff] flex items-center justify-center text-white font-medium flex-shrink-0", sizeClass)}>
      {initials}
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const supabaseUser = session?.user ?? null;
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Limpar busca ao navegar para outra página
  useEffect(() => {
    setSearchQuery("");
    setShowDropdown(false);
  }, [location]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca com debounce via tRPC — só dispara quando há pelo menos 1 caractere
  const { data: sugestoes } = trpc.colaboradores.buscarRapido.useQuery(
    { q: searchQuery },
    {
      enabled: searchQuery.trim().length >= 1,
      staleTime: 300,
    }
  );

  const resultados = sugestoes ?? [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setActiveIndex(-1);
    setShowDropdown(val.trim().length >= 1);
  };

  const handleSelectResult = (id: number) => {
    navigate("/colaboradores?busca=" + encodeURIComponent(searchQuery.trim()));
    setShowDropdown(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || resultados.length === 0) {
      if (e.key === "Enter" && searchQuery.trim()) {
        navigate("/colaboradores?busca=" + encodeURIComponent(searchQuery.trim()));
        setShowDropdown(false);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && resultados[activeIndex]) {
        handleSelectResult(resultados[activeIndex].id);
      } else if (searchQuery.trim()) {
        navigate("/colaboradores?busca=" + encodeURIComponent(searchQuery.trim()));
        setShowDropdown(false);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  const { data: alertasData } = trpc.alertas.list.useQuery({ lido: false }, { enabled: !!supabaseUser });
  const unreadCount = alertasData?.length ?? 0;

  const displayName = supabaseUser?.user_metadata?.full_name
    || supabaseUser?.user_metadata?.name
    || supabaseUser?.email?.split("@")[0]
    || "Usuário";
  const displayEmail = supabaseUser?.email ?? "";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 px-2 bg-gradient-to-br from-[#2b7fff] to-[#155dfc] rounded-[14px] flex items-center justify-center flex-shrink-0">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] text-[17px] font-semibold leading-tight truncate">FonoOcupacional</span>
              <span className="text-[#6a7282] text-xs font-normal truncate">{displayName}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pt-4 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 h-11 rounded-[10px] cursor-pointer transition-colors",
                    isActive
                      ? "bg-blue-50 text-[#155dfc]"
                      : "text-[#4a5565] hover:bg-gray-50 hover:text-[#101828]"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-[10px] hover:bg-gray-100 transition-colors">
                <UserAvatar name={displayName} size="lg" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-[#101828] truncate">{displayName}</p>
                  <p className="text-xs text-[#6a7282] truncate">Fonoaudiólogo(a)</p>
                </div>
                <ChevronDown className="w-4 h-4 text-[#6a7282] flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link href="/configuracoes">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
          {/* Search with autocomplete */}
          <div className="relative flex-1 max-w-[448px]" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99a1af] pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Buscar colaboradores por nome ou COL-XXXX..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.trim().length >= 1 && setShowDropdown(true)}
              className="w-full h-[38px] pl-10 pr-4 bg-gray-50 rounded-[10px] border border-gray-200 text-sm text-[#101828] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#155dfc]/20 focus:border-[#155dfc]"
            />

            {/* Autocomplete dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[10px] shadow-lg z-50 overflow-hidden">
                {resultados.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center">
                    Nenhum colaborador encontrado
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      Colaboradores
                    </div>
                    {resultados.map((c, idx) => (
                      <button
                        key={c.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectResult(c.id);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors",
                          activeIndex === idx && "bg-blue-50"
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#51a2ff] to-[#ad46ff] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {c.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {c.codigo && (
                              <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                {c.codigo}
                              </span>
                            )}
                            <span className="text-sm font-medium text-[#101828] truncate">{c.nome}</span>
                          </div>
                          {c.email && (
                            <div className="text-xs text-gray-400 truncate">{c.email}</div>
                          )}
                        </div>
                        <User className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      </button>
                    ))}
                    <div className="px-3 py-2 border-t border-gray-100">
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          navigate("/colaboradores?busca=" + encodeURIComponent(searchQuery.trim()));
                          setShowDropdown(false);
                          setSearchQuery("");
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Ver todos os resultados para "{searchQuery}"
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="relative w-9 h-9 rounded-[10px] flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Bell className="w-5 h-5 text-[#4a5565]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#fb2c36] rounded-full" />
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-[10px] hover:bg-gray-50 transition-colors">
                  <UserAvatar name={displayName} size="sm" />
                  <ChevronDown className="w-4 h-4 text-[#6a7282]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-[#101828]">{displayName}</p>
                  <p className="text-xs text-[#6a7282]">{displayEmail}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

export { UserAvatar };
