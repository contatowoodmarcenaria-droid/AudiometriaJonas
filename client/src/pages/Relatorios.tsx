import { trpc } from "@/lib/trpc";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, BarChart3, Building2, CheckCircle, Download, FileText, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Relatorios() {
  const [filterEmpresaId, setFilterEmpresaId] = useState<string>("");
  const [filterPeriodo, setFilterPeriodo] = useState<string>("6meses");
  const [mesesFiltro, setMesesFiltro] = useState<number>(6);

  const { data: empresas } = trpc.empresas.list.useQuery({});
  const { data: stats } = trpc.exames.stats.useQuery();
  const { data: empStats } = trpc.empresas.stats.useQuery();

  // Dados reais para os gráficos
  const { data: examesPorMes, isLoading: loadingBarChart } = trpc.relatorios.examesPorMes.useQuery({ meses: mesesFiltro });
  const { data: distribuicaoResultados, isLoading: loadingPieChart } = trpc.relatorios.distribuicaoResultados.useQuery();
  const { data: empresasRelatorio, isLoading: loadingEmpresas } = trpc.relatorios.empresasRelatorio.useQuery();

  // Aplicar filtro de empresa na tabela
  const empresasFiltradas = (empresasRelatorio ?? []).filter((emp) =>
    !filterEmpresaId || filterEmpresaId === "all" ? true : String(emp.id) === filterEmpresaId
  );

  const handleAplicarFiltros = () => {
    const mesesMap: Record<string, number> = {
      "3meses": 3,
      "6meses": 6,
      "12meses": 12,
    };
    setMesesFiltro(mesesMap[filterPeriodo] ?? 6);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#101828]">Relatórios</h1>
          <p className="text-base text-[#4a5565] mt-1">Análises e indicadores de saúde auditiva ocupacional</p>
        </div>
        <Button
          variant="outline"
          className="h-10 rounded-[10px] border-gray-200 text-[#364153] text-sm font-medium gap-2"
          onClick={() => toast.info("Exportação de relatório em desenvolvimento")}
        >
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Exames"
          value={stats?.total ?? 0}
          icon={Activity}
          iconBg="bg-blue-50"
          iconColor="text-[#155dfc]"
        />
        <MetricCard
          title="Exames Normais"
          value={stats ? Math.max(0, (stats.realizados) - (stats.alteracoes)) : 0}
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-[#008236]"
        />
        <MetricCard
          title="Com Alterações"
          value={stats?.alteracoes ?? 0}
          icon={TrendingUp}
          iconBg="bg-amber-50"
          iconColor="text-[#bb4d00]"
        />
        <MetricCard
          title="Empresas Atendidas"
          value={empStats?.total ?? 0}
          icon={Building2}
          iconBg="bg-blue-50"
          iconColor="text-[#155dfc]"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[14px] border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#364153]">Empresa</Label>
            <Select value={filterEmpresaId} onValueChange={setFilterEmpresaId}>
              <SelectTrigger className="h-10 rounded-[10px] border-gray-200 bg-gray-50 text-sm">
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {(empresas ?? []).map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#364153]">Período</Label>
            <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
              <SelectTrigger className="h-10 rounded-[10px] border-gray-200 bg-gray-50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3meses">Últimos 3 meses</SelectItem>
                <SelectItem value="6meses">Últimos 6 meses</SelectItem>
                <SelectItem value="12meses">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              className="h-10 w-full rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm font-medium"
              onClick={handleAplicarFiltros}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="xl:col-span-2 bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#101828]">Exames por Período</h3>
            <span className="text-xs text-[#6a7282]">
              {filterPeriodo === "3meses" ? "Últimos 3 meses" : filterPeriodo === "12meses" ? "Último ano" : "Últimos 6 meses"}
            </span>
          </div>
          {loadingBarChart ? (
            <div className="h-[240px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#155dfc] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !examesPorMes || examesPorMes.length === 0 ? (
            <div className="h-[240px] flex flex-col items-center justify-center gap-2 text-[#6a7282]">
              <BarChart3 className="w-10 h-10 text-gray-300" />
              <p className="text-sm">Nenhum exame registrado no período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={examesPorMes} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6a7282" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6a7282" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                  cursor={{ fill: "rgba(21, 93, 252, 0.05)" }}
                />
                <Bar dataKey="realizados" name="Realizados" fill="#155dfc" radius={[6, 6, 0, 0]} />
                <Bar dataKey="alteracoes" name="Alterações" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#155dfc]" />
              <span className="text-xs text-[#6a7282]">Realizados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span className="text-xs text-[#6a7282]">Alterações</span>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#101828]">Distribuição por Resultado</h3>
          </div>
          {loadingPieChart ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#155dfc] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !distribuicaoResultados || distribuicaoResultados.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-[#6a7282]">
              <Activity className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-center">Nenhum exame para exibir distribuição</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={distribuicaoResultados}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distribuicaoResultados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb" }}
                  formatter={(value: number, name: string, props: { payload?: { count?: number } }) => [
                    `${value}% (${props?.payload?.count ?? 0} exames)`,
                    ""
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {distribuicaoResultados && distribuicaoResultados.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {distribuicaoResultados.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-[#4a5565]">{item.name}</span>
                  </div>
                  <span className="text-xs font-medium text-[#101828]">{item.value}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empresas Table */}
      <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#101828]">Relatório por Empresa</h3>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-[8px] border-gray-200 text-[#364153] text-xs gap-1.5"
            onClick={() => toast.info("Exportação em desenvolvimento")}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </Button>
        </div>
        <div className="overflow-x-auto">
          {loadingEmpresas ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#155dfc] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : empresasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#6a7282]">
              <Building2 className="w-10 h-10 text-gray-300" />
              <p className="text-sm">Nenhuma empresa cadastrada</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Colaboradores</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Exames</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Alterações</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Pendentes</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {empresasFiltradas.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#51a2ff] to-[#ad46ff] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {emp.nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[#101828]">{emp.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#4a5565]">{emp.totalColaboradores}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#4a5565]">{emp.totalExames}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-medium ${emp.totalAlteracoes > 0 ? "text-[#bb4d00]" : "text-[#99a1af]"}`}>
                        {emp.totalAlteracoes > 0 ? emp.totalAlteracoes : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-medium ${emp.examesPendentes > 0 ? "text-[#c10007]" : "text-[#99a1af]"}`}>
                        {emp.examesPendentes > 0 ? emp.examesPendentes : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        emp.status === "Regular" ? "bg-green-50 text-[#008236]" :
                        emp.status === "Com Pendências" ? "bg-red-50 text-[#c10007]" :
                        "bg-amber-50 text-[#bb4d00]"
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        className="flex items-center gap-1.5 text-xs text-[#155dfc] hover:underline"
                        onClick={() => toast.info("Relatório detalhado em desenvolvimento")}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Ver relatório
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
