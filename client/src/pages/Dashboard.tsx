import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Activity, AlertTriangle, Building2, Calendar, CheckCircle, Clock, FileText, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useSupabaseAlerts } from "@/hooks/useSupabaseAlerts";

const TIPO_LABELS: Record<string, string> = {
  audiometria_ocupacional: "Audiometria Ocupacional",
  avaliacao_audiologica: "Avaliação Audiológica",
  meatoscopia: "Meatoscopia",
  imitanciometria: "Imitanciometria",
};

/**
 * Converte o objeto de variação em prop `trend` do MetricCard.
 * Retorna undefined quando não há dados históricos (variacao === null).
 */
function buildTrend(variacao: { valor: number; positivo: boolean } | null | undefined) {
  if (!variacao) return undefined;
  const sinal = variacao.positivo ? "+" : "";
  return {
    value: `${sinal}${variacao.valor}%`,
    positive: variacao.positivo,
    label: "vs mês anterior",
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: recentExames, isLoading: examesLoading } = trpc.dashboard.recentExames.useQuery({ limit: 5 });
  const { data: comparativo } = trpc.dashboard.comparativoMensal.useQuery();
  const { alertas, isLoading: alertasLoading } = useSupabaseAlerts();

  const firstName = user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Usuário";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#101828]">Bem-vindo(a), {firstName}</h1>
        <p className="text-base text-[#4a5565] mt-1">Visão geral do acompanhamento ocupacional</p>
      </div>

      {/* Metrics Cards - primeira linha */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Empresas"
          value={statsLoading ? "—" : (stats?.empresas ?? 0)}
          icon={Building2}
          iconBg="bg-blue-50"
          iconColor="text-[#155dfc]"
          trend={buildTrend(comparativo?.empresas)}
        />
        <MetricCard
          title="Colaboradores"
          value={statsLoading ? "—" : (stats?.colaboradores ?? 0)}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-[#155dfc]"
          trend={buildTrend(comparativo?.colaboradores)}
        />
        <MetricCard
          title="Exames Realizados"
          value={statsLoading ? "—" : (stats?.examesRealizados ?? 0)}
          icon={Activity}
          iconBg="bg-green-50"
          iconColor="text-[#008236]"
          trend={buildTrend(comparativo?.exames)}
        />
        <MetricCard
          title="Exames Vencidos"
          value={statsLoading ? "—" : (stats?.examesVencidos ?? 0)}
          icon={AlertTriangle}
          iconBg="bg-red-50"
          iconColor="text-[#c10007]"
        />
      </div>

      {/* Metrics Cards - segunda linha */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Exames Pendentes"
          value={statsLoading ? "—" : (stats?.examesPendentes ?? 0)}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-[#bb4d00]"
        />
        <MetricCard
          title="Alterações Detectadas"
          value={statsLoading ? "—" : (stats?.alteracoes ?? 0)}
          icon={TrendingUp}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <MetricCard
          title="Laudos Emitidos"
          value={statsLoading ? "—" : (stats?.examesRealizados ?? 0)}
          icon={FileText}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <MetricCard
          title="Exames Normais"
          value={statsLoading ? "—" : Math.max(0, (stats?.examesRealizados ?? 0) - (stats?.alteracoes ?? 0))}
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-[#008236]"
        />
      </div>

      {/* Alertas e Pendências */}
      <div className="bg-white rounded-[14px] border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#101828]">Alertas e Pendências</h2>
          <span className="text-xs text-[#6a7282]">Ações necessárias</span>
        </div>
        <div className="flex flex-col gap-3">
          {alertasLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-[10px] bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : alertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
              <p className="text-sm font-medium text-[#101828]">Nenhuma pendência ainda</p>
              <p className="text-xs text-[#6a7282] mt-1">Todos os exames estão em dia</p>
            </div>
          ) : (
            alertas.map((alerta) => (
              <div
                key={alerta.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-[10px] border",
                  alerta.urgente ? "bg-red-50 border-red-100" : "bg-yellow-50 border-yellow-100"
                )}
              >
                <AlertTriangle className={cn("w-4 h-4 mt-0.5 flex-shrink-0", alerta.urgente ? "text-[#c10007]" : "text-[#bb4d00]")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", alerta.urgente ? "text-[#c10007]" : "text-[#bb4d00]")}>{alerta.titulo}</p>
                  <p className="text-xs text-[#6a7282] mt-0.5">{alerta.descricao}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Exames Recentes */}
      <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#101828]">Exames Recentes</h2>
          <Link href="/exames">
            <span className="text-sm text-[#155dfc] hover:underline cursor-pointer">Ver todos</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Colaborador</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Tipo de Exame</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Data</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Vencimento</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {examesLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-[#6a7282]">Carregando...</td>
                </tr>
              ) : recentExames && recentExames.length > 0 ? (
                recentExames.map((exame) => (
                  <tr key={exame.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#51a2ff] to-[#ad46ff] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {(exame.colaboradorNome ?? "U").split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[#101828]">{exame.colaboradorNome ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#6a7282]" />
                        <span className="text-sm text-[#4a5565]">{exame.empresaNome ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#6a7282]" />
                        <span className="text-sm text-[#4a5565]">{TIPO_LABELS[exame.tipo] ?? exame.tipo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#6a7282]" />
                        <span className="text-sm text-[#4a5565]">{exame.dataRealizacao}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#6a7282]" />
                        <span className="text-sm text-[#4a5565]">{exame.dataVencimento ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={exame.resultado ?? "normal"} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Activity className="w-10 h-10 text-gray-300" />
                      <p className="text-sm text-[#6a7282]">Nenhum exame registrado ainda</p>
                      <Link href="/exames/novo">
                        <span className="text-sm text-[#155dfc] hover:underline cursor-pointer">Registrar primeiro exame</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
