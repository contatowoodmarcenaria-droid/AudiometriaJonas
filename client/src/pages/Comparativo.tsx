import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  Info,
  TrendingDown,
  Users,
} from "lucide-react";
import { useState, useMemo } from "react";

const FREQS_VA = [500, 1000, 2000, 3000, 4000, 6000, 8000];

type LimiarFreq = Record<number, number | null>;

interface ExameComparativo {
  id: number;
  tipo: string;
  dataRealizacao: string | null;
  resultado: string | null;
  vaOD: LimiarFreq;
  vaOE: LimiarFreq;
}

function parseLimiaresFromExame(exame: Record<string, unknown>, prefix: string): LimiarFreq {
  const result: LimiarFreq = {};
  for (const freq of FREQS_VA) {
    const key = `${prefix}${freq}`;
    const val = exame[key];
    result[freq] = val !== undefined && val !== null && val !== "" ? Number(val) : null;
  }
  return result;
}

function calcDiff(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return b - a;
}

function DiffBadge({ diff }: { diff: number | null }) {
  if (diff === null || diff === 0) return <span className="text-gray-400 text-xs">—</span>;
  const isWorse = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
        isWorse ? "text-amber-700 bg-amber-50" : "text-green-700 bg-green-50"
      }`}
    >
      {isWorse ? <TrendingDown className="w-3 h-3" /> : null}
      {isWorse ? `+${diff}` : `${diff}`}
    </span>
  );
}

function TabelaComparativa({
  label,
  color,
  exameRef,
  exameAtual,
}: {
  label: string;
  color: "red" | "blue";
  exameRef: LimiarFreq;
  exameAtual: LimiarFreq;
}) {
  const colorClass = color === "red" ? "text-red-600" : "text-blue-600";
  const dotClass = color === "red" ? "bg-red-500" : "bg-blue-500";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotClass}`} />
        <span className={`text-sm font-bold uppercase ${colorClass}`}>{label}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-t border-b border-gray-200">
              <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase border-r border-gray-200 w-36">
                Exame
              </th>
              {FREQS_VA.map((f) => (
                <th key={f} className="text-center px-2 py-2.5 text-xs font-bold text-gray-500 uppercase">
                  {f >= 1000 ? `${f / 1000}k` : f} Hz
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-2.5 text-sm text-gray-700 border-r border-gray-200">Referência</td>
              {FREQS_VA.map((f) => (
                <td key={f} className="text-center px-2 py-2.5 text-sm text-gray-700">
                  {exameRef[f] ?? "—"}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-100 font-semibold">
              <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-200">Atual</td>
              {FREQS_VA.map((f) => (
                <td key={f} className="text-center px-2 py-2.5 text-sm text-gray-900">
                  {exameAtual[f] ?? "—"}
                </td>
              ))}
            </tr>
            <tr className="bg-gray-50/50">
              <td className="px-4 py-2.5 text-xs text-gray-500 border-r border-gray-200">Diferença</td>
              {FREQS_VA.map((f) => (
                <td key={f} className="text-center px-2 py-2.5">
                  <DiffBadge diff={calcDiff(exameRef[f], exameAtual[f])} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Comparativo() {
  const [selectedColaboradorId, setSelectedColaboradorId] = useState<string>("");
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");
  const [comparando, setComparando] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [colSearch, setColSearch] = useState("");

  const { data: empresas } = trpc.empresas.list.useQuery({});
  const { data: colaboradores } = trpc.colaboradores.list.useQuery(
    selectedEmpresaId ? { empresaId: Number(selectedEmpresaId) } : {}
  );

  const { data: examesRaw } = trpc.audiometria.listByColaborador.useQuery(
    { colaboradorId: Number(selectedColaboradorId) },
    { enabled: comparando && !!selectedColaboradorId }
  );

  const colaboradorSelecionado = useMemo(
    () => (colaboradores as Array<{ id: number; nome: string; cargo?: string; setor?: string; dataAdmissao?: string; empresaId?: number }> | undefined)?.find(
      (c) => c.id === Number(selectedColaboradorId)
    ),
    [colaboradores, selectedColaboradorId]
  );

  const empresaSelecionada = useMemo(
    () => (empresas as Array<{ id: number; nome: string }> | undefined)?.find(
      (e) => e.id === (colaboradorSelecionado?.empresaId ?? Number(selectedEmpresaId))
    ),
    [empresas, colaboradorSelecionado, selectedEmpresaId]
  );

  const exames: ExameComparativo[] = useMemo(() => {
    if (!examesRaw) return [];
    return (examesRaw as Array<Record<string, unknown>>).map((e) => ({
      id: e.id as number,
      tipo: (e.motivoAvaliacao as string) || "Audiometria",
      dataRealizacao: (e.dataRealizacao as string) || null,
      resultado: (e.resultadoFinal as string) || null,
      vaOD: parseLimiaresFromExame(e, "vaOD"),
      vaOE: parseLimiaresFromExame(e, "vaOE"),
    }));
  }, [examesRaw]);

  // Exame mais antigo = referência, mais recente = atual
  const exameRef = exames.length > 0 ? exames[exames.length - 1] : null;
  const exameAtual = exames.length > 1 ? exames[0] : null;

  const hasAlteracao = useMemo(() => {
    if (!exameRef || !exameAtual) return false;
    for (const f of FREQS_VA) {
      const diffOD = calcDiff(exameRef.vaOD[f], exameAtual.vaOD[f]);
      const diffOE = calcDiff(exameRef.vaOE[f], exameAtual.vaOE[f]);
      if ((diffOD !== null && diffOD >= 10) || (diffOE !== null && diffOE >= 10)) return true;
    }
    return false;
  }, [exameRef, exameAtual]);

  function handleComparar() {
    if (!selectedColaboradorId) return;
    setComparando(true);
  }

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    try {
      const parts = d.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return d;
      }
      return new Date(d).toLocaleDateString("pt-BR");
    } catch {
      return d;
    }
  };

  const MOTIVO_LABELS: Record<string, string> = {
    admissional: "Admissional",
    periodico: "Periódico",
    retorno_trabalho: "Retorno ao Trabalho",
    demissional: "Demissional",
    mudanca_riscos: "Mudança de Riscos",
    monitoracao_pontual: "Monitoração Pontual",
    consulta_medica: "Consulta Médica",
  };

  const showResult = comparando && exames.length > 0;
  const showInsuficiente = comparando && exames.length < 2;

  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#101828]">Comparativo Audiométrico</h1>
        <p className="text-base text-[#4a5565] mt-1">
          Compare exames ao longo do tempo e acompanhe a evolução auditiva dos colaboradores
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#364153] uppercase">Empresa</label>
            <Select
              value={selectedEmpresaId}
              onValueChange={(v) => {
                setSelectedEmpresaId(v);
                setSelectedColaboradorId("");
                setComparando(false);
              }}
            >
              <SelectTrigger className="bg-gray-50 rounded-[10px] border-gray-200 h-[42px]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <SelectValue placeholder="Selecione uma empresa..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                {(empresas as Array<{ id: number; nome: string }> | undefined)?.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#364153] uppercase">Colaborador</label>
            <Select
              value={selectedColaboradorId}
              onValueChange={(v) => {
                setSelectedColaboradorId(v);
                setComparando(false);
              }}
            >
              <SelectTrigger className="bg-gray-50 rounded-[10px] border-gray-200 h-[42px]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <SelectValue placeholder="Selecione um colaborador..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="Buscar por nome ou COL-XXXX..."
                    value={colSearch}
                    onChange={e => setColSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => e.stopPropagation()}
                    className="w-full h-7 px-2 text-xs border border-gray-200 rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                {(colaboradores as Array<{ id: number; nome: string; codigo?: string }> | undefined)
                  ?.filter(c => {
                    if (!colSearch.trim()) return true;
                    const q = colSearch.toLowerCase();
                    return c.nome.toLowerCase().includes(q) || (c.codigo ?? "").toLowerCase().includes(q);
                  })
                  .map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.codigo ? <span className="text-blue-600 font-mono mr-1.5">{c.codigo}</span> : null}{c.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#364153] uppercase">Filtro por Período</label>
            <Select>
              <SelectTrigger className="bg-gray-50 rounded-[10px] border-gray-200 h-[42px]">
                <SelectValue placeholder="Todos os períodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1ano">Último 1 ano</SelectItem>
                <SelectItem value="2anos">Últimos 2 anos</SelectItem>
                <SelectItem value="5anos">Últimos 5 anos</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleComparar}
            disabled={!selectedColaboradorId}
            className="bg-[#155dfc] hover:bg-[#1447e6] text-white rounded-[10px] h-10 px-5 gap-2"
          >
            <BarChart2 className="w-4 h-4" />
            Comparar Exames
          </Button>
          <Button variant="outline" className="rounded-[10px] h-10 px-5 gap-2 border-gray-200">
            <Eye className="w-4 h-4" />
            Ver Detalhes
          </Button>
          <Button variant="outline" className="rounded-[10px] h-10 px-5 gap-2 border-gray-200">
            <Download className="w-4 h-4" />
            Emitir Relatório
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      {showResult && exameRef && exameAtual && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-5 flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#6a7282] uppercase">Exame de Referência</span>
                <span className="text-lg font-bold text-[#101828]">{MOTIVO_LABELS[exameRef.tipo] ?? exameRef.tipo}</span>
                <div className="flex items-center gap-1 text-sm text-[#6a7282]">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(exameRef.dataRealizacao)}
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-50 border border-[#bedbff] rounded-full flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-5 flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#6a7282] uppercase">Último Exame Comparado</span>
                <span className="text-lg font-bold text-[#101828]">{MOTIVO_LABELS[exameAtual.tipo] ?? exameAtual.tipo}</span>
                <div className="flex items-center gap-1 text-sm text-[#6a7282]">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(exameAtual.dataRealizacao)}
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-50 border border-[#bedbff] rounded-full flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-5 flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#6a7282] uppercase">Situação Atual</span>
                <span className="text-lg font-bold text-[#101828]">
                  {hasAlteracao ? "Alteração Observada" : "Sem Alteração"}
                </span>
                <div className="flex items-center gap-1 text-sm text-[#6a7282]">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {hasAlteracao ? "Piora em frequências altas" : "Audiometria estável"}
                </div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${hasAlteracao ? "bg-amber-50 border border-[#fee685]" : "bg-green-50 border border-green-200"}`}>
                <AlertTriangle className={`w-5 h-5 ${hasAlteracao ? "text-amber-500" : "text-green-500"}`} />
              </div>
            </div>

            <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-5 flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#6a7282] uppercase">Necessita Análise</span>
                <span className="text-lg font-bold text-[#101828]">{hasAlteracao ? "Sim" : "Não"}</span>
                <div className="flex items-center gap-1 text-sm text-[#6a7282]">
                  <ClipboardList className="w-3.5 h-3.5" />
                  {hasAlteracao ? "Requer acompanhamento" : "Dentro do esperado"}
                </div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${hasAlteracao ? "bg-red-50 border border-[#ffc9c9]" : "bg-green-50 border border-green-200"}`}>
                <ClipboardList className={`w-5 h-5 ${hasAlteracao ? "text-red-500" : "text-green-500"}`} />
              </div>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="grid grid-cols-[336px_1fr] gap-6 items-start">
            {/* Coluna esquerda */}
            <div className="flex flex-col gap-6">
              {/* Perfil do colaborador */}
              <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
                <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#2b7fff] to-[#1447e6] rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-white text-xl font-bold">
                      {colaboradorSelecionado?.nome?.split(" ").slice(0, 2).map((n: string) => n[0]).join("") || "?"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xl font-bold text-[#101828] truncate">{colaboradorSelecionado?.nome || "—"}</span>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="text-[#364153] font-medium">{colaboradorSelecionado?.cargo || "—"}</span>
                      {colaboradorSelecionado?.setor && (
                        <>
                          <div className="w-1 h-1 bg-[#d1d5dc] rounded-full" />
                          <span className="text-[#6a7282]">{colaboradorSelecionado.setor}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-[#6a7282] uppercase">Empresa</span>
                      <span className="text-sm font-semibold text-[#101828]">{empresaSelecionada?.nome || "—"}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-[#6a7282] uppercase">Data de Admissão</span>
                      <span className="text-sm font-semibold text-[#101828]">
                        {formatDate(colaboradorSelecionado?.dataAdmissao)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-[10px] border border-gray-100 p-4 flex flex-col gap-3">
                    <div>
                      <span className="text-xs font-bold text-[#6a7282] uppercase">Exame Base Utilizado</span>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="bg-blue-100 text-[#1447e6] text-xs font-bold px-2 py-1 rounded-lg">
                          {MOTIVO_LABELS[exameRef.tipo] ?? exameRef.tipo}
                        </span>
                        <span className="text-sm text-[#364153] font-medium">{formatDate(exameRef.dataRealizacao)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#6a7282] uppercase">Última Situação</span>
                      <div className="mt-1.5">
                        {hasAlteracao ? (
                          <span className="bg-red-50 border border-[#ffc9c9] text-[#c10007] text-xs font-bold px-3 py-1 rounded-full">
                            Requer Análise Técnica
                          </span>
                        ) : (
                          <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                            Sem Alteração Significativa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linha do tempo */}
              <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <ClipboardList className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-[#101828] uppercase">Linha do Tempo dos Exames</span>
                </div>
                <div className="flex flex-col gap-0 relative">
                  <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-gray-100" />
                  {exames.map((e, i) => {
                    const isFirst = i === exames.length - 1;
                    const isLast = i === 0;
                    let dotColor = "bg-green-400";
                    let textColor = "text-green-600";
                    let statusText = "Sem alteração significativa";
                    if (isFirst) { dotColor = "bg-blue-400"; textColor = "text-blue-600"; statusText = "Exame de referência"; }
                    if (isLast && hasAlteracao) { dotColor = "bg-red-400"; textColor = "text-red-600"; statusText = "Requer análise técnica"; }
                    return (
                      <div key={e.id} className="flex items-start gap-3 pb-5 relative">
                        <div className={`w-6 h-6 rounded-full ${dotColor} border-2 border-white shadow flex items-center justify-center z-10 flex-shrink-0`}>
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                        <div className="flex flex-col gap-0.5 pt-0.5">
                          <span className="text-sm font-semibold text-[#101828]">{MOTIVO_LABELS[e.tipo] ?? e.tipo}</span>
                          <div className="flex items-center gap-1.5 text-xs text-[#6a7282] flex-wrap">
                            <span>{formatDate(e.dataRealizacao)}</span>
                            <span>·</span>
                            <span className={`font-semibold ${textColor}`}>{statusText}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Origem dos dados */}
              <div className="bg-gray-50 rounded-[14px] shadow-sm border border-gray-200 px-6 pt-6 pb-4 flex flex-col gap-4">
                <div className="pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-[#6a7282] uppercase">Origem dos Dados e Rastreabilidade</span>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[#6a7282]">Origem do Exame de Referência</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-[#1447e6] text-xs font-bold px-2 py-1 rounded-lg">Manual</span>
                      <span className="text-xs text-[#6a7282]">FonoOcupacional</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[#6a7282]">Origem do Exame Atual</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg">Manual</span>
                      <span className="text-xs text-[#6a7282]">FonoOcupacional</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[#6a7282]">Última Sincronização</span>
                    <span className="text-xs font-semibold text-[#364153]">
                      {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna direita */}
            <div className="flex flex-col gap-6">
              {/* Análise Evolutiva */}
              <div className="bg-red-50/50 rounded-[14px] shadow-sm border border-[#ffe2e2] px-6 pt-6 pb-4 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#82181a]" />
                  <span className="text-sm font-bold text-[#82181a] uppercase">Análise Evolutiva</span>
                </div>
                <div className="bg-white rounded-[14px] border border-[#ffc9c9] px-5 pt-5 pb-4">
                  <ul className="flex flex-col gap-3">
                    {hasAlteracao ? (
                      <>
                        <li className="flex items-start gap-3 text-sm text-[#1e2939]">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                          Há indícios de piora auditiva ao longo do acompanhamento.
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#1e2939]">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          Alteração auditiva observada em comparação ao exame de referência. Recomenda-se avaliação especializada.
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#1e2939]">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                          Caso requer análise técnica especializada devido à evolução dos limiares auditivos.
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-3 text-sm text-[#1e2939]">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                          Não há indícios de piora auditiva significativa ao longo do acompanhamento.
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#1e2939]">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                          Limiares auditivos dentro dos parâmetros normais em comparação ao exame de referência.
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* Tabela Comparativa */}
              <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[#101828]" />
                    <span className="text-lg font-bold text-[#101828]">Tabela Comparativa Audiométrica</span>
                  </div>
                  <span className="bg-blue-50 border border-blue-100 text-[#1447e6] text-xs font-bold px-3 py-1 rounded-full">
                    {MOTIVO_LABELS[exameRef.tipo] ?? exameRef.tipo} vs Atual
                  </span>
                </div>

                <TabelaComparativa
                  label="Orelha Direita (OD)"
                  color="red"
                  exameRef={exameRef.vaOD}
                  exameAtual={exameAtual.vaOD}
                />

                <div className="border-t border-gray-100 pt-6">
                  <TabelaComparativa
                    label="Orelha Esquerda (OE)"
                    color="blue"
                    exameRef={exameRef.vaOE}
                    exameAtual={exameAtual.vaOE}
                  />
                </div>
              </div>

              {/* Observações do Profissional */}
              <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <ClipboardList className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-[#101828] uppercase">Observações do Profissional</span>
                </div>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Insira suas anotações técnicas, histórico de queixas do colaborador e conduta a ser adotada..."
                  className="min-h-[120px] resize-none border-gray-200 rounded-[10px] text-sm text-[#364153] placeholder:text-gray-400"
                />
                <div className="flex justify-end">
                  <Button className="bg-[#155dfc] hover:bg-[#1447e6] text-white rounded-[10px] h-10 px-5">
                    Salvar Anotações
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Exames insuficientes */}
      {showInsuficiente && (
        <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#101828] mb-1">Exames insuficientes</h3>
            <p className="text-sm text-[#6a7282] max-w-sm">
              Este colaborador possui {exames.length === 0 ? "nenhum exame" : "apenas 1 exame"} cadastrado. São necessários ao menos 2 exames audiométricos para realizar a comparação.
            </p>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {!comparando && (
        <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <BarChart2 className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#101828] mb-1">Selecione um colaborador</h3>
            <p className="text-sm text-[#6a7282] max-w-sm">
              Escolha uma empresa e um colaborador, depois clique em "Comparar Exames" para visualizar a evolução audiométrica ao longo do tempo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
