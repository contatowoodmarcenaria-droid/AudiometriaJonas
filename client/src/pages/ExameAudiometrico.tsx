// v2 - redesign completo
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Save, ChevronLeft, FileText, Trash2, Calculator, RotateCcw
} from "lucide-react";
import { Audiograma, LegendaASHA, type PontoAudiograma } from "@/components/Audiograma";
import {
  calcularMedia, classificarPerda,
  METODOS_MEDIA, FREQS_VA, FREQS_VO,
  type MetodoMedia, type TipoMedia, type TipoResposta, type LimiaresOrelha
} from "@/lib/audiometria-calculos";
import { gerarLaudoPDF } from "@/components/GerarLaudoPDF";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FreqVAKey = "hz250" | "hz500" | "hz1000" | "hz2000" | "hz3000" | "hz4000" | "hz6000" | "hz8000";
type FreqVOKey = "hz500" | "hz1000" | "hz2000" | "hz3000" | "hz4000";

type LimiarEntry = {
  valor: string;       // VA/VO principal — presença não mascarada
  mascValor: string;   // MASC VA/VO — presença mascarada
  ausNMValor: string;  // AUS N.M. — ausência não mascarada
  ausMascValor: string; // AUS MASC — ausência mascarada
};
type LimiaresVA = Record<FreqVAKey, LimiarEntry>;
type LimiaresVO = Record<FreqVOKey, LimiarEntry>;

const FREQ_VA_KEYS: { key: FreqVAKey; label: string; hz: number }[] = [
  { key: "hz250", label: "250", hz: 250 },
  { key: "hz500", label: "500", hz: 500 },
  { key: "hz1000", label: "1k", hz: 1000 },
  { key: "hz2000", label: "2k", hz: 2000 },
  { key: "hz3000", label: "3k", hz: 3000 },
  { key: "hz4000", label: "4k", hz: 4000 },
  { key: "hz6000", label: "6k", hz: 6000 },
  { key: "hz8000", label: "8k", hz: 8000 },
];

const FREQ_VO_KEYS: { key: FreqVOKey; label: string; hz: number }[] = [
  { key: "hz500", label: "500", hz: 500 },
  { key: "hz1000", label: "1k", hz: 1000 },
  { key: "hz2000", label: "2k", hz: 2000 },
  { key: "hz3000", label: "3k", hz: 3000 },
  { key: "hz4000", label: "4k", hz: 4000 },
];

function emptyLimiarEntry(): LimiarEntry { return { valor: "", mascValor: "", ausNMValor: "", ausMascValor: "" }; }
function emptyLimiaresVA(): LimiaresVA {
  return { hz250: emptyLimiarEntry(), hz500: emptyLimiarEntry(), hz1000: emptyLimiarEntry(), hz2000: emptyLimiarEntry(), hz3000: emptyLimiarEntry(), hz4000: emptyLimiarEntry(), hz6000: emptyLimiarEntry(), hz8000: emptyLimiarEntry() };
}
function emptyLimiaresVO(): LimiaresVO {
  return { hz500: emptyLimiarEntry(), hz1000: emptyLimiarEntry(), hz2000: emptyLimiarEntry(), hz3000: emptyLimiarEntry(), hz4000: emptyLimiarEntry() };
}

function limiaresToCalculo(limiares: LimiaresVA | LimiaresVO): LimiaresOrelha {
  const result: LimiaresOrelha = {};
  for (const [key, entry] of Object.entries(limiares)) {
    const v = parseFloat(entry.valor);
    (result as any)[key] = isNaN(v) ? null : v;
  }
  return result;
}

function limiaresToPontos(limiares: LimiaresVA | LimiaresVO): PontoAudiograma[] {
  const pontos: PontoAudiograma[] = [];
  for (const [key, entry] of Object.entries(limiares)) {
    const hz = parseInt(key.replace("hz", ""));
    // Presença não mascarada (VA/VO principal)
    if (entry.valor !== "") {
      const db = parseFloat(entry.valor);
      if (!isNaN(db)) pontos.push({ freq: hz, db, tipo: "pres_nao_masc" });
    }
    // Presença mascarada (MASC VA/VO)
    if (entry.mascValor !== "") {
      const db = parseFloat(entry.mascValor);
      if (!isNaN(db)) pontos.push({ freq: hz, db, tipo: "pres_masc" });
    }
    // Ausência não mascarada (AUS N.M.)
    if (entry.ausNMValor !== "") {
      const db = parseFloat(entry.ausNMValor);
      if (!isNaN(db)) pontos.push({ freq: hz, db, tipo: "aus_nao_masc" });
    }
    // Ausência mascarada (AUS MASC)
    if (entry.ausMascValor !== "") {
      const db = parseFloat(entry.ausMascValor);
      if (!isNaN(db)) pontos.push({ freq: hz, db, tipo: "aus_masc" });
    }
  }
  return pontos;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ExameAudiometrico() {
  const [, navigate] = useLocation();

  // ── Identificação ──────────────────────────────────────────────────────────
  const [colaboradorId, setColaboradorId] = useState<number | null>(null);
  const [empresaNome, setEmpresaNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [pacienteNome, setPacienteNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [setor, setSetor] = useState("");
  const [funcao, setFuncao] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [idade, setIdade] = useState("");
  const [sexo, setSexo] = useState("");
  const [audiometro, setAudiometro] = useState("WIDE RANGE");
  const [dataCalibracaoAudiometro, setDataCalibracaoAudiometro] = useState("");
  const [dataRealizacao, setDataRealizacao] = useState(new Date().toISOString().split("T")[0]);

  // ── Motivo + EPI ───────────────────────────────────────────────────────────
  const [motivoAvaliacao, setMotivoAvaliacao] = useState("admissional");
  const [repousoAuditivo, setRepousoAuditivo] = useState("nao_informado");
  const [repousoHoras, setRepousoHoras] = useState("");
  const [queixa, setQueixa] = useState(false);
  const [queixaDescricao, setQueixaDescricao] = useState("");
  const [epiUso, setEpiUso] = useState("nao");
  const [epiQual, setEpiQual] = useState("");
  const [epiPlug, setEpiPlug] = useState(false);
  const [epiConcha, setEpiConcha] = useState(false);

  // ── Meatoscopia ────────────────────────────────────────────────────────────
  const [meatoscopiaOD, setMeatoscopiaOD] = useState("normal");
  const [meatoscopiaOE, setMeatoscopiaOE] = useState("normal");

  // ── Limiares ───────────────────────────────────────────────────────────────
  const [vaOD, setVaOD] = useState<LimiaresVA>(emptyLimiaresVA());
  const [vaOE, setVaOE] = useState<LimiaresVA>(emptyLimiaresVA());
  const [voOD, setVoOD] = useState<LimiaresVO>(emptyLimiaresVO());
  const [voOE, setVoOE] = useState<LimiaresVO>(emptyLimiaresVO());

  // ── Método de cálculo ──────────────────────────────────────────────────────
  const [metodoMedia, setMetodoMedia] = useState<MetodoMedia>("lloyd_kaplan_1978");
  const [tipoMedia, setTipoMedia] = useState<TipoMedia>("tritonal");

  // ── IRF ────────────────────────────────────────────────────────────────────
  const [irfODIntensidade, setIrfODIntensidade] = useState("");
  const [irfODMonossilabos, setIrfODMonossilabos] = useState("");
  const [irfODDissilabos, setIrfODDissilabos] = useState("");
  const [irfODMasc, setIrfODMasc] = useState("");
  const [irfOEIntensidade, setIrfOEIntensidade] = useState("");
  const [irfOEMonossilabos, setIrfOEMonossilabos] = useState("");
  const [irfOEDissilabos, setIrfOEDissilabos] = useState("");
  const [irfOEMasc, setIrfOEMasc] = useState("");
  const [lrfOD, setLrfOD] = useState("");
  const [ldvOD, setLdvOD] = useState("");
  const [lrfOE, setLrfOE] = useState("");
  const [ldvOE, setLdvOE] = useState("");

  // ── Mascaramento ───────────────────────────────────────────────────────────
  const [mascVAODMin, setMascVAODMin] = useState("");
  const [mascVAODMax, setMascVAODMax] = useState("");
  const [mascVOODMin, setMascVOODMin] = useState("");
  const [mascVOODMax, setMascVOODMax] = useState("");
  const [mascVAOEMin, setMascVAOEMin] = useState("");
  const [mascVAOEMax, setMascVAOEMax] = useState("");
  const [mascVOOEMin, setMascVOOEMin] = useState("");
  const [mascVOOEMax, setMascVOOEMax] = useState("");

  // ── Parecer ────────────────────────────────────────────────────────────────
  const [parecer, setParecer] = useState("");

  // ── Cálculos automáticos ───────────────────────────────────────────────────
  const calcVAOD = limiaresToCalculo(vaOD);
  const calcVAOE = limiaresToCalculo(vaOE);
  const mediaOD = calcularMedia(calcVAOD, metodoMedia, tipoMedia);
  const mediaOE = calcularMedia(calcVAOE, metodoMedia, tipoMedia);
  const classOD = classificarPerda(mediaOD, metodoMedia);
  const classOE = classificarPerda(mediaOE, metodoMedia);
  const pontosVAOD = limiaresToPontos(vaOD);
  const pontosVAOE = limiaresToPontos(vaOE);
  const pontosVOOD = limiaresToPontos(voOD);
  const pontosVOOE = limiaresToPontos(voOE);

  // ── Calcular idade automaticamente ────────────────────────────────────────
  useEffect(() => {
    if (dataNascimento) {
      const hoje = new Date();
      const nasc = new Date(dataNascimento);
      let anos = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
      setIdade(String(anos));
    }
  }, [dataNascimento]);

  // ── Busca de colaborador ──────────────────────────────────────────────────
  const [colSearch, setColSearch] = useState("");

  // ── Preencher dados do colaborador ao selecionar ──────────────────────────
  const { data: colaboradores } = trpc.colaboradores.list.useQuery(undefined);

  const colaboradoresFiltrados = (colaboradores ?? []).filter((c: any) => {
    if (!colSearch.trim()) return true;
    const q = colSearch.toLowerCase();
    return c.nome.toLowerCase().includes(q) || (c.codigo ?? "").toLowerCase().includes(q);
  });
  const { data: pareceres } = trpc.audiometria.listPareceresModelo.useQuery(undefined);
  const { data: configLaudo } = trpc.audiometria.getConfiguracaoLaudo.useQuery();

  const { data: empresas } = trpc.empresas.list.useQuery(undefined);

  const handleSelectColaborador = (id: string) => {
    const colab = colaboradores?.find((c: any) => String(c.id) === id);
    if (!colab) return;
    setColaboradorId(colab.id);
    setPacienteNome(colab.nome || "");
    setCpf(colab.cpf || "");
    setSetor(colab.setor || "");
    setFuncao(colab.cargo || "");
    if (colab.dataNascimento) {
      try {
        const d = new Date(colab.dataNascimento);
        if (!isNaN(d.getTime())) {
          setDataNascimento(d.toISOString().split("T")[0]);
        } else {
          setDataNascimento("");
        }
      } catch {
        setDataNascimento("");
      }
    } else {
      setDataNascimento("");
    }
    setSexo(colab.sexo || "");
    // Empresa pelo empresaId
    const empresa = empresas?.find((e: any) => e.id === colab.empresaId);
    if (empresa) {
      setEmpresaNome(empresa.nome || "");
      setCnpj(empresa.cnpj || "");
    }
  };

  // ── Mutations ──────────────────────────────────────────────────────────────
  const salvarExame = trpc.audiometria.create.useMutation({
    onSuccess: () => toast.success("Exame salvo com sucesso!"),
    onError: (err: any) => toast.error("Erro ao salvar: " + err.message),
  });

  const handleSalvar = () => {
    if (!colaboradorId) { toast.error("Selecione um colaborador antes de salvar."); return; }
    salvarExame.mutate({
      colaboradorId,
      empresaId: colaboradores?.find((c: any) => c.id === colaboradorId)?.empresaId ?? 1,
      audiometro, dataCalibracaoAudiometro, dataRealizacao,
      motivoAvaliacao: motivoAvaliacao as any,
      repousoAuditivo: repousoAuditivo as any,
      repousoHoras, queixa, queixaDescricao,
      epiUso: epiUso as any,
      meatoscopiaOD: meatoscopiaOD as any,
      meatoscopiaOE: meatoscopiaOE as any,
      vaOD250: vaOD.hz250.valor ? parseFloat(vaOD.hz250.valor) : null,
      vaOD500: vaOD.hz500.valor ? parseFloat(vaOD.hz500.valor) : null,
      vaOD1000: vaOD.hz1000.valor ? parseFloat(vaOD.hz1000.valor) : null,
      vaOD2000: vaOD.hz2000.valor ? parseFloat(vaOD.hz2000.valor) : null,
      vaOD3000: vaOD.hz3000.valor ? parseFloat(vaOD.hz3000.valor) : null,
      vaOD4000: vaOD.hz4000.valor ? parseFloat(vaOD.hz4000.valor) : null,
      vaOD6000: vaOD.hz6000.valor ? parseFloat(vaOD.hz6000.valor) : null,
      vaOD8000: vaOD.hz8000.valor ? parseFloat(vaOD.hz8000.valor) : null,
      vaOE250: vaOE.hz250.valor ? parseFloat(vaOE.hz250.valor) : null,
      vaOE500: vaOE.hz500.valor ? parseFloat(vaOE.hz500.valor) : null,
      vaOE1000: vaOE.hz1000.valor ? parseFloat(vaOE.hz1000.valor) : null,
      vaOE2000: vaOE.hz2000.valor ? parseFloat(vaOE.hz2000.valor) : null,
      vaOE3000: vaOE.hz3000.valor ? parseFloat(vaOE.hz3000.valor) : null,
      vaOE4000: vaOE.hz4000.valor ? parseFloat(vaOE.hz4000.valor) : null,
      vaOE6000: vaOE.hz6000.valor ? parseFloat(vaOE.hz6000.valor) : null,
      vaOE8000: vaOE.hz8000.valor ? parseFloat(vaOE.hz8000.valor) : null,
      voOD500: voOD.hz500.valor ? parseFloat(voOD.hz500.valor) : null,
      voOD1000: voOD.hz1000.valor ? parseFloat(voOD.hz1000.valor) : null,
      voOD2000: voOD.hz2000.valor ? parseFloat(voOD.hz2000.valor) : null,
      voOD3000: voOD.hz3000.valor ? parseFloat(voOD.hz3000.valor) : null,
      voOD4000: voOD.hz4000.valor ? parseFloat(voOD.hz4000.valor) : null,
      voOE500: voOE.hz500.valor ? parseFloat(voOE.hz500.valor) : null,
      voOE1000: voOE.hz1000.valor ? parseFloat(voOE.hz1000.valor) : null,
      voOE2000: voOE.hz2000.valor ? parseFloat(voOE.hz2000.valor) : null,
      voOE3000: voOE.hz3000.valor ? parseFloat(voOE.hz3000.valor) : null,
      voOE4000: voOE.hz4000.valor ? parseFloat(voOE.hz4000.valor) : null,
      mediaOD: mediaOD !== null ? String(mediaOD) : undefined,
      mediaOE: mediaOE !== null ? String(mediaOE) : undefined,
      metodoMedia, tipoMedia,
      irfIntensidadeOD: irfODIntensidade ? parseFloat(irfODIntensidade) : null,
      irfMonossilabosOD: irfODMonossilabos ? parseFloat(irfODMonossilabos) : null,
      irfDissilabosOD: irfODDissilabos ? parseFloat(irfODDissilabos) : null,
      irfIntensidadeOE: irfOEIntensidade ? parseFloat(irfOEIntensidade) : null,
      irfMonossilabosOE: irfOEMonossilabos ? parseFloat(irfOEMonossilabos) : null,
      irfDissilabosOE: irfOEDissilabos ? parseFloat(irfOEDissilabos) : null,
      parecerAudiologico: parecer,
    });
  };

  const handleGerarPDF = () => {
    gerarLaudoPDF(
      { empresaNome, cnpj, pacienteNome, cpf, setor, funcao, dataNascimento, idade, sexo, audiometro, dataCalibracaoAudiometro, dataRealizacao },
      { motivoAvaliacao, repousoAuditivo, repousoHoras, queixa, queixaDescricao, epiUso },
      { meatoscopiaOD, meatoscopiaOE },
      {
        vaOD: { hz250: vaOD.hz250.valor ? parseFloat(vaOD.hz250.valor) : null, hz500: vaOD.hz500.valor ? parseFloat(vaOD.hz500.valor) : null, hz1000: vaOD.hz1000.valor ? parseFloat(vaOD.hz1000.valor) : null, hz2000: vaOD.hz2000.valor ? parseFloat(vaOD.hz2000.valor) : null, hz3000: vaOD.hz3000.valor ? parseFloat(vaOD.hz3000.valor) : null, hz4000: vaOD.hz4000.valor ? parseFloat(vaOD.hz4000.valor) : null, hz6000: vaOD.hz6000.valor ? parseFloat(vaOD.hz6000.valor) : null, hz8000: vaOD.hz8000.valor ? parseFloat(vaOD.hz8000.valor) : null },
        vaOE: { hz250: vaOE.hz250.valor ? parseFloat(vaOE.hz250.valor) : null, hz500: vaOE.hz500.valor ? parseFloat(vaOE.hz500.valor) : null, hz1000: vaOE.hz1000.valor ? parseFloat(vaOE.hz1000.valor) : null, hz2000: vaOE.hz2000.valor ? parseFloat(vaOE.hz2000.valor) : null, hz3000: vaOE.hz3000.valor ? parseFloat(vaOE.hz3000.valor) : null, hz4000: vaOE.hz4000.valor ? parseFloat(vaOE.hz4000.valor) : null, hz6000: vaOE.hz6000.valor ? parseFloat(vaOE.hz6000.valor) : null, hz8000: vaOE.hz8000.valor ? parseFloat(vaOE.hz8000.valor) : null },
        voOD: { hz500: voOD.hz500.valor ? parseFloat(voOD.hz500.valor) : null, hz1000: voOD.hz1000.valor ? parseFloat(voOD.hz1000.valor) : null, hz2000: voOD.hz2000.valor ? parseFloat(voOD.hz2000.valor) : null, hz3000: voOD.hz3000.valor ? parseFloat(voOD.hz3000.valor) : null, hz4000: voOD.hz4000.valor ? parseFloat(voOD.hz4000.valor) : null },
        voOE: { hz500: voOE.hz500.valor ? parseFloat(voOE.hz500.valor) : null, hz1000: voOE.hz1000.valor ? parseFloat(voOE.hz1000.valor) : null, hz2000: voOE.hz2000.valor ? parseFloat(voOE.hz2000.valor) : null, hz3000: voOE.hz3000.valor ? parseFloat(voOE.hz3000.valor) : null, hz4000: voOE.hz4000.valor ? parseFloat(voOE.hz4000.valor) : null },
        mediaOD, mediaOE, classOD, classOE, metodoMedia, tipoMedia,
        lrfOD, ldvOD, lrfOE, ldvOE,
        irfODIntensidade, irfODMonossilabos, irfODDissilabos,
        irfOEIntensidade, irfOEMonossilabos, irfOEDissilabos,
      },
      { parecer },
      {
        nomeClinica: configLaudo?.nomeClinica ?? "",
        enderecoClinica: configLaudo?.enderecoClinica ?? "",
        telefoneClinica: configLaudo?.telefoneClinica ?? "",
        emailClinica: configLaudo?.emailClinica ?? "",
        cnpjClinica: configLaudo?.cnpjClinica ?? "",
        nomeProfissional: configLaudo?.nomeProfissional ?? "",
        titulosProfissional: configLaudo?.titulosProfissional ?? "",
        crfa: configLaudo?.crfa ?? "",
      }
    );
  };

  const handleLimpar = () => {
    setVaOD(emptyLimiaresVA()); setVaOE(emptyLimiaresVA());
    setVoOD(emptyLimiaresVO()); setVoOE(emptyLimiaresVO());
    setParecer("");
    toast.info("Dados de audiometria limpos.");
  };

  // ── Input helper ──────────────────────────────────────────────────────────
  const inp = "w-full text-center text-xs border-0 bg-transparent focus:outline-none focus:bg-yellow-50 rounded";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-4">

        {/* Barra de ações superior */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/exames")}>
            <ChevronLeft className="w-4 h-4 mr-1" />Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleLimpar}>
              <Trash2 className="w-4 h-4 mr-1" />Limpar
            </Button>
            <Button variant="outline" size="sm" onClick={handleGerarPDF}>
              <FileText className="w-4 h-4 mr-1" />Gerar Laudo PDF
            </Button>
            <Button size="sm" onClick={handleSalvar} disabled={salvarExame.isPending}>
              <Save className="w-4 h-4 mr-1" />{salvarExame.isPending ? "Salvando..." : "Salvar Exame"}
            </Button>
          </div>
        </div>

        {/* Formulário principal */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">

          {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
          <div className="border-b border-gray-200">
            <div className="grid grid-cols-[auto_1fr_auto] items-stretch">
              <div className="flex items-center justify-center w-24 bg-primary/5 border-r border-gray-200 p-3">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-black text-primary">
                    {(configLaudo?.nomeClinica || "A").charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="px-5 py-3 flex flex-col justify-center">
                <div className="text-base font-bold text-gray-800">
                  {configLaudo?.nomeClinica || "Clínica de Audiologia Ocupacional"}
                </div>
                {configLaudo?.enderecoClinica && (
                  <div className="text-xs text-gray-500 mt-0.5">{configLaudo.enderecoClinica}</div>
                )}
                <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-500">
                  {configLaudo?.telefoneClinica && <span>📞 {configLaudo.telefoneClinica}</span>}
                  {configLaudo?.emailClinica && <span>✉ {configLaudo.emailClinica}</span>}
                  {configLaudo?.cnpjClinica && <span>CNPJ: {configLaudo.cnpjClinica}</span>}
                </div>
              </div>
              <div className="bg-primary text-white px-6 py-3 flex flex-col items-center justify-center min-w-[200px]">
                <div className="text-sm font-bold tracking-wide">AVALIAÇÃO AUDIOLÓGICA</div>
                <div className="text-xs opacity-80 mt-1">
                  {new Date().toLocaleDateString("pt-BR")} {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="mt-2">
                  <input type="date" value={dataRealizacao} onChange={e => setDataRealizacao(e.target.value)}
                    className="h-6 text-xs bg-white/10 border border-white/30 text-white rounded px-2 w-36" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">

            {/* ── Seção 1: Identificação ─────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</div>
                <h2 className="text-sm font-bold text-gray-800">Identificação</h2>
                {/* Seletor rápido de colaborador */}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-gray-500">Buscar colaborador:</span>
                  <Select value={colaboradorId ? String(colaboradorId) : ""} onValueChange={handleSelectColaborador}>
                    <SelectTrigger className="h-7 text-xs w-64">
                      <SelectValue placeholder="Selecione para preencher..." />
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
                      {colaboradoresFiltrados.length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-400">Nenhum colaborador encontrado</div>
                      )}
                      {colaboradoresFiltrados.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.codigo ? <span className="text-blue-600 font-mono mr-1.5">{c.codigo}</span> : null}{c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="bg-gray-50 px-3 py-2 font-semibold text-gray-600 w-28 border-r border-gray-200">Empresa:</td>
                      <td className="px-2 py-1.5">
                        <Input value={empresaNome} onChange={e => setEmpresaNome(e.target.value)} className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 p-0" placeholder="Razão Social" />
                      </td>
                      <td className="bg-gray-50 px-3 py-2 font-semibold text-gray-600 w-28 border-l border-r border-gray-200">CNPJ/CAEPF:</td>
                      <td className="px-2 py-1.5 w-44">
                        <Input value={cnpj} onChange={e => setCnpj(e.target.value)} className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 p-0" placeholder="00.000.000/0000-00" />
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="bg-gray-50 px-3 py-2 font-semibold text-gray-600 border-r border-gray-200">Paciente:</td>
                      <td className="px-2 py-1.5">
                        <Input value={pacienteNome} onChange={e => setPacienteNome(e.target.value)} className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 p-0" placeholder="Nome completo" />
                      </td>
                      <td className="bg-gray-50 px-3 py-2 font-semibold text-gray-600 border-l border-r border-gray-200">CPF:</td>
                      <td className="px-2 py-1.5">
                        <Input value={cpf} onChange={e => setCpf(e.target.value)} className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 p-0" placeholder="000.000.000-00" />
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="bg-gray-50 px-3 py-2 font-semibold text-gray-600 border-r border-gray-200">Setor:</td>
                      <td className="px-2 py-1.5">
                        <Input value={setor} onChange={e => setSetor(e.target.value)} className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 p-0" />
                      </td>
                      <td className="bg-gray-50 px-3 py-2 font-semibold text-gray-600 border-l border-r border-gray-200">Data de Nasc.:</td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <Input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 p-0 w-32" />
                          {idade && <span className="text-gray-500 whitespace-nowrap"><strong>{idade}</strong> anos</span>}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="bg-gray-50 px-3 py-2 font-semibold text-gray-600 border-r border-gray-200">Função:</td>
                      <td className="px-2 py-1.5">
                        <Input value={funcao} onChange={e => setFuncao(e.target.value)} className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 p-0" />
                      </td>
                      <td className="bg-gray-50 px-3 py-2 font-semibold text-gray-600 border-l border-r border-gray-200">Sexo:</td>
                      <td className="px-2 py-1.5">
                        <Select value={sexo} onValueChange={setSexo}>
                          <SelectTrigger className="h-7 text-xs border-0 shadow-none focus:ring-0"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-50 px-3 py-2 font-semibold text-gray-600 border-r border-gray-200">Audiômetro:</td>
                      <td className="px-2 py-1.5">
                        <Input value={audiometro} onChange={e => setAudiometro(e.target.value)} className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 p-0" />
                      </td>
                      <td className="bg-gray-50 px-3 py-2 font-semibold text-gray-600 border-l border-r border-gray-200">Data Calibração:</td>
                      <td className="px-2 py-1.5">
                        <Input type="date" value={dataCalibracaoAudiometro} onChange={e => setDataCalibracaoAudiometro(e.target.value)} className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 p-0" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Seção 2: Motivo + Meatoscopia ─────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</div>
                <h2 className="text-sm font-bold text-gray-800">Motivo da Avaliação</h2>
              </div>
              <div className="grid grid-cols-[1fr_220px] gap-4">
                {/* Motivo + Repouso + Queixa + EPI */}
                <div className="border border-gray-200 rounded-lg p-3 space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-600 w-16 shrink-0">Motivo:</span>
                    <Select value={motivoAvaliacao} onValueChange={setMotivoAvaliacao}>
                      <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admissional">ADMISSIONAL</SelectItem>
                        <SelectItem value="periodico">PERIÓDICO</SelectItem>
                        <SelectItem value="retorno_trabalho">RETORNO AO TRABALHO</SelectItem>
                        <SelectItem value="demissional">DEMISSIONAL</SelectItem>
                        <SelectItem value="mudanca_riscos">MUDANÇA DE RISCOS OCUPACIONAIS</SelectItem>
                        <SelectItem value="monitoracao_pontual">MONITORAÇÃO PONTUAL</SelectItem>
                        <SelectItem value="consulta_medica">CONSULTA MÉDICA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-gray-600 w-16 shrink-0">Repouso:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="repouso" value="maior_igual_14h" checked={repousoAuditivo === "maior_igual_14h"} onChange={() => setRepousoAuditivo("maior_igual_14h")} className="accent-primary" />
                      <span>≥ 14 horas</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="repouso" value="menor_14h" checked={repousoAuditivo === "menor_14h"} onChange={() => setRepousoAuditivo("menor_14h")} className="accent-primary" />
                      <span>{"< 14 horas"}</span>
                    </label>
                    {repousoAuditivo === "menor_14h" && (
                      <Input value={repousoHoras} onChange={e => setRepousoHoras(e.target.value)} className="h-6 w-16 text-xs" placeholder="horas" />
                    )}
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="repouso" value="nao_informado" checked={repousoAuditivo === "nao_informado"} onChange={() => setRepousoAuditivo("nao_informado")} className="accent-primary" />
                      <span>Não informado</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-gray-600 w-16 shrink-0">Queixa:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={queixa} onChange={e => setQueixa(e.target.checked)} className="accent-primary" />
                      <span>Sim</span>
                    </label>
                    {queixa && (
                      <Input value={queixaDescricao} onChange={e => setQueixaDescricao(e.target.value)} className="h-6 flex-1 text-xs" placeholder="Descreva a queixa..." />
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-gray-600 w-16 shrink-0">EPI:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="epi" value="nao" checked={epiUso === "nao"} onChange={() => setEpiUso("nao")} className="accent-primary" />
                      <span>Não usa</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="epi" value="sim" checked={epiUso === "sim"} onChange={() => setEpiUso("sim")} className="accent-primary" />
                      <span>Sim</span>
                    </label>
                    {epiUso === "sim" && (
                      <Input value={epiQual} onChange={e => setEpiQual(e.target.value)} className="h-6 w-24 text-xs" placeholder="Qual?" />
                    )}
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={epiPlug} onChange={e => setEpiPlug(e.target.checked)} className="accent-primary" />
                      <span className="font-medium">Plug</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={epiConcha} onChange={e => setEpiConcha(e.target.checked)} className="accent-primary" />
                      <span className="font-medium">Concha</span>
                    </label>
                  </div>
                </div>
                {/* Meatoscopia */}
                <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                  <div className="bg-gray-700 text-white font-bold text-center py-2 text-xs tracking-wider">MEATOSCOPIA</div>
                  <div className="divide-y divide-gray-200">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="font-bold text-red-600 w-8">OD</span>
                      <Select value={meatoscopiaOD} onValueChange={setMeatoscopiaOD}>
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal"><span className="text-green-600 font-bold">NORMAL</span></SelectItem>
                          <SelectItem value="obstrucao_parcial">OBSTRUÇÃO PARCIAL</SelectItem>
                          <SelectItem value="obstrucao_total">OBSTRUÇÃO TOTAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="font-bold text-blue-600 w-8">OE</span>
                      <Select value={meatoscopiaOE} onValueChange={setMeatoscopiaOE}>
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal"><span className="text-green-600 font-bold">NORMAL</span></SelectItem>
                          <SelectItem value="obstrucao_parcial">OBSTRUÇÃO PARCIAL</SelectItem>
                          <SelectItem value="obstrucao_total">OBSTRUÇÃO TOTAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Seção 3: Audiometria Tonal ──────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</div>
                <h2 className="text-sm font-bold text-gray-800">Audiometria Tonal Limiar</h2>
              </div>

              {/* Tabela central de limiares — OD à esquerda, frequências no centro, OE à direita */}
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                <div className="grid grid-cols-[1fr_auto_1fr]">
                  {/* Cabeçalho OD */}
                  <div className="bg-red-600 text-white text-center text-xs font-bold py-1.5 tracking-wide">Orelha Direita (OD)</div>
                  <div className="bg-gray-700 text-white text-center text-xs font-bold py-1.5 px-4">Freq. (Hz)</div>
                  <div className="bg-blue-600 text-white text-center text-xs font-bold py-1.5 tracking-wide">Orelha Esquerda (OE)</div>
                </div>

                {/* Sub-cabeçalho */}
                <div className="grid grid-cols-[1fr_auto_1fr] border-b border-gray-200 bg-gray-50 text-xs">
                  <div className="grid grid-cols-4 border-r border-gray-200">
                    <div className="text-center py-1 px-1 bg-red-400 text-white font-semibold border-r border-red-300">AUS MASC</div>
                    <div className="text-center py-1 px-1 bg-red-400 text-white font-semibold border-r border-red-300">AUS N.M.</div>
                    <div className="text-center py-1 px-1 bg-red-300 text-white font-semibold border-r border-red-200">MASC VA</div>
                    <div className="text-center py-1 px-1 bg-red-100 text-red-800 font-bold border-r border-gray-200">VA</div>
                  </div>
                  <div className="w-20 text-center py-1 text-gray-500 font-semibold border-r border-gray-200">—</div>
                  <div className="grid grid-cols-4">
                    <div className="text-center py-1 px-1 bg-blue-100 text-blue-800 font-bold border-r border-gray-200">VA</div>
                    <div className="text-center py-1 px-1 bg-blue-300 text-white font-semibold border-r border-blue-200">MASC VA</div>
                    <div className="text-center py-1 px-1 bg-blue-400 text-white font-semibold border-r border-blue-300">AUS N.M.</div>
                    <div className="text-center py-1 px-1 bg-blue-400 text-white font-semibold">AUS MASC</div>
                  </div>
                </div>

                {/* Linhas VA */}
                {FREQ_VA_KEYS.map(({ key, label }) => {
                  const entryOD = vaOD[key];
                  const entryOE = vaOE[key];
                  return (
                    <div key={key} className="grid grid-cols-[1fr_auto_1fr] border-b border-gray-100 hover:bg-gray-50/50">
                      {/* OD: AUS MASC | AUS N.M. | MASC VA | VA */}
                      <div className="grid grid-cols-4 border-r border-gray-200">
                        <div className="border-r border-gray-100 p-0.5">
                          <input type="number" value={entryOD.ausMascValor}
                            onChange={e => setVaOD({ ...vaOD, [key]: { ...entryOD, ausMascValor: e.target.value } })}
                            className={inp} placeholder="" />
                        </div>
                        <div className="border-r border-gray-100 p-0.5">
                          <input type="number" value={entryOD.ausNMValor}
                            onChange={e => setVaOD({ ...vaOD, [key]: { ...entryOD, ausNMValor: e.target.value } })}
                            className={inp} placeholder="" />
                        </div>
                        <div className="border-r border-gray-100 p-0.5">
                          <input type="number" value={entryOD.mascValor}
                            onChange={e => setVaOD({ ...vaOD, [key]: { ...entryOD, mascValor: e.target.value } })}
                            className={inp} placeholder="" />
                        </div>
                        <div className="border-r border-gray-200 p-0.5">
                          <input type="number" value={entryOD.valor}
                            onChange={e => setVaOD({ ...vaOD, [key]: { ...entryOD, valor: e.target.value } })}
                            className={`${inp} font-semibold text-red-700`} placeholder="" min={-10} max={120} step={5} />
                        </div>
                      </div>
                      <div className="w-20 flex items-center justify-center border-r border-gray-200 bg-gray-50">
                        <span className="text-xs font-bold text-gray-700">{label}</span>
                      </div>
                      {/* OE: VA | MASC VA | AUS N.M. | AUS MASC */}
                      <div className="grid grid-cols-4">
                        <div className="border-r border-gray-200 p-0.5">
                          <input type="number" value={entryOE.valor}
                            onChange={e => setVaOE({ ...vaOE, [key]: { ...entryOE, valor: e.target.value } })}
                            className={`${inp} font-semibold text-blue-700`} placeholder="" min={-10} max={120} step={5} />
                        </div>
                        <div className="border-r border-gray-100 p-0.5">
                          <input type="number" value={entryOE.mascValor}
                            onChange={e => setVaOE({ ...vaOE, [key]: { ...entryOE, mascValor: e.target.value } })}
                            className={inp} placeholder="" />
                        </div>
                        <div className="border-r border-gray-100 p-0.5">
                          <input type="number" value={entryOE.ausNMValor}
                            onChange={e => setVaOE({ ...vaOE, [key]: { ...entryOE, ausNMValor: e.target.value } })}
                            className={inp} placeholder="" />
                        </div>
                        <div className="p-0.5">
                          <input type="number" value={entryOE.ausMascValor}
                            onChange={e => setVaOE({ ...vaOE, [key]: { ...entryOE, ausMascValor: e.target.value } })}
                            className={inp} placeholder="" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Separador Via Óssea */}
                <div className="grid grid-cols-[1fr_auto_1fr] bg-gray-100 border-b border-gray-200">
                  <div className="text-center py-1 text-xs font-semibold text-gray-500 border-r border-gray-200">— Via Óssea OD —</div>
                  <div className="w-20 text-center py-1 text-xs font-semibold text-gray-500 border-r border-gray-200">VO</div>
                  <div className="text-center py-1 text-xs font-semibold text-gray-500">— Via Óssea OE —</div>
                </div>

                {/* Sub-cabeçalho VO */}
                <div className="grid grid-cols-[1fr_auto_1fr] border-b border-gray-200 bg-gray-50 text-xs">
                  <div className="grid grid-cols-4 border-r border-gray-200">
                    <div className="text-center py-1 px-1 bg-red-400 text-white font-semibold border-r border-red-300">AUS MASC</div>
                    <div className="text-center py-1 px-1 bg-red-400 text-white font-semibold border-r border-red-300">AUS N.M.</div>
                    <div className="text-center py-1 px-1 bg-red-300 text-white font-semibold border-r border-red-200">MASC VO</div>
                    <div className="text-center py-1 px-1 bg-red-100 text-red-800 font-bold border-r border-gray-200">VO</div>
                  </div>
                  <div className="w-20 text-center py-1 text-gray-500 font-semibold border-r border-gray-200">—</div>
                  <div className="grid grid-cols-4">
                    <div className="text-center py-1 px-1 bg-blue-100 text-blue-800 font-bold border-r border-gray-200">VO</div>
                    <div className="text-center py-1 px-1 bg-blue-300 text-white font-semibold border-r border-blue-200">MASC VO</div>
                    <div className="text-center py-1 px-1 bg-blue-400 text-white font-semibold border-r border-blue-300">AUS N.M.</div>
                    <div className="text-center py-1 px-1 bg-blue-400 text-white font-semibold">AUS MASC</div>
                  </div>
                </div>

                {/* Linhas VO */}
                {FREQ_VO_KEYS.map(({ key, label }) => {
                  const entryOD = voOD[key];
                  const entryOE = voOE[key];
                  return (
                    <div key={key} className="grid grid-cols-[1fr_auto_1fr] border-b border-gray-100 hover:bg-gray-50/50">
                      {/* OD: AUS MASC | AUS N.M. | MASC VO | VO */}
                      <div className="grid grid-cols-4 border-r border-gray-200">
                        <div className="border-r border-gray-100 p-0.5">
                          <input type="number" value={entryOD.ausMascValor}
                            onChange={e => setVoOD({ ...voOD, [key]: { ...entryOD, ausMascValor: e.target.value } })}
                            className={inp} placeholder="" />
                        </div>
                        <div className="border-r border-gray-100 p-0.5">
                          <input type="number" value={entryOD.ausNMValor}
                            onChange={e => setVoOD({ ...voOD, [key]: { ...entryOD, ausNMValor: e.target.value } })}
                            className={inp} placeholder="" />
                        </div>
                        <div className="border-r border-gray-100 p-0.5">
                          <input type="number" value={entryOD.mascValor}
                            onChange={e => setVoOD({ ...voOD, [key]: { ...entryOD, mascValor: e.target.value } })}
                            className={inp} placeholder="" />
                        </div>
                        <div className="border-r border-gray-200 p-0.5">
                          <input type="number" value={entryOD.valor}
                            onChange={e => setVoOD({ ...voOD, [key]: { ...entryOD, valor: e.target.value } })}
                            className={`${inp} font-semibold text-red-700`} placeholder="" min={-10} max={120} step={5} />
                        </div>
                      </div>
                      <div className="w-20 flex items-center justify-center border-r border-gray-200 bg-gray-50">
                        <span className="text-xs font-bold text-gray-700">{label}</span>
                      </div>
                      {/* OE: VO | MASC VO | AUS N.M. | AUS MASC */}
                      <div className="grid grid-cols-4">
                        <div className="border-r border-gray-200 p-0.5">
                          <input type="number" value={entryOE.valor}
                            onChange={e => setVoOE({ ...voOE, [key]: { ...entryOE, valor: e.target.value } })}
                            className={`${inp} font-semibold text-blue-700`} placeholder="" min={-10} max={120} step={5} />
                        </div>
                        <div className="border-r border-gray-100 p-0.5">
                          <input type="number" value={entryOE.mascValor}
                            onChange={e => setVoOE({ ...voOE, [key]: { ...entryOE, mascValor: e.target.value } })}
                            className={inp} placeholder="" />
                        </div>
                        <div className="border-r border-gray-100 p-0.5">
                          <input type="number" value={entryOE.ausNMValor}
                            onChange={e => setVoOE({ ...voOE, [key]: { ...entryOE, ausNMValor: e.target.value } })}
                            className={inp} placeholder="" />
                        </div>
                        <div className="p-0.5">
                          <input type="number" value={entryOE.ausMascValor}
                            onChange={e => setVoOE({ ...voOE, [key]: { ...entryOE, ausMascValor: e.target.value } })}
                            className={inp} placeholder="" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Botões de limpar por orelha */}
                <div className="grid grid-cols-[1fr_auto_1fr] bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-center py-1.5 border-r border-gray-200">
                    <button onClick={() => { setVaOD(emptyLimiaresVA()); setVoOD(emptyLimiaresVO()); }}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors">
                      <RotateCcw className="w-3 h-3" /> Apagar OD
                    </button>
                  </div>
                  <div className="w-20 border-r border-gray-200" />
                  <div className="flex justify-center py-1.5">
                    <button onClick={() => { setVaOE(emptyLimiaresVA()); setVoOE(emptyLimiaresVO()); }}
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors">
                      <RotateCcw className="w-3 h-3" /> Apagar OE
                    </button>
                  </div>
                </div>
              </div>

              {/* Audiogramas lado a lado com legenda ASHA no centro */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start">
                {/* OD */}
                <div className="border border-red-200 rounded-lg overflow-hidden w-full">
                  <div className="bg-red-600 text-white text-center text-xs font-bold py-1.5 tracking-wide flex items-center justify-center gap-2">
                    <span>Orelha Direita (OD)</span>
                  </div>
                  <div className="w-full">
                    <Audiograma orelha="OD" pontosVA={pontosVAOD} pontosVO={pontosVOOD} />
                  </div>
                  <div className="bg-red-50 border-t border-red-200 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600">Média:</span>
                      {mediaOD !== null ? (
                        <span className={`font-bold ${mediaOD <= 25 ? "text-green-600" : "text-red-600"}`}>
                          {mediaOD.toFixed(1)} dB
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </div>
                    {classOD && <div className="text-gray-600 text-center font-medium">{classOD}</div>}
                    <div className="flex gap-3 mt-2 text-gray-600">
                      <span>LRF: <input value={lrfOD} onChange={e => setLrfOD(e.target.value)} className="w-10 border-b border-gray-300 text-center bg-transparent focus:outline-none" /></span>
                      <span>LDV: <input value={ldvOD} onChange={e => setLdvOD(e.target.value)} className="w-10 border-b border-gray-300 text-center bg-transparent focus:outline-none" /></span>
                    </div>
                  </div>
                </div>

                {/* Legenda ASHA */}
                <div>
                  <LegendaASHA />
                </div>

                {/* OE */}
                <div className="border border-blue-200 rounded-lg overflow-hidden w-full">
                  <div className="bg-blue-600 text-white text-center text-xs font-bold py-1.5 tracking-wide">Orelha Esquerda (OE)</div>
                  <div className="w-full">
                    <Audiograma orelha="OE" pontosVA={pontosVAOE} pontosVO={pontosVOOE} />
                  </div>
                  <div className="bg-blue-50 border-t border-blue-200 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600">Média:</span>
                      {mediaOE !== null ? (
                        <span className={`font-bold ${mediaOE <= 25 ? "text-green-600" : "text-blue-600"}`}>
                          {mediaOE.toFixed(1)} dB
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </div>
                    {classOE && <div className="text-gray-600 text-center font-medium">{classOE}</div>}
                    <div className="flex gap-3 mt-2 text-gray-600">
                      <span>LRF: <input value={lrfOE} onChange={e => setLrfOE(e.target.value)} className="w-10 border-b border-gray-300 text-center bg-transparent focus:outline-none" /></span>
                      <span>LDV: <input value={ldvOE} onChange={e => setLdvOE(e.target.value)} className="w-10 border-b border-gray-300 text-center bg-transparent focus:outline-none" /></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seletor de método de cálculo */}
              <div className="mt-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-primary" />
                  Método de cálculo da média:
                </div>
                <div className="flex flex-wrap gap-2">
                  {METODOS_MEDIA.map(metodo => {
                    const isSelected = metodoMedia === metodo.id;
                    return (
                      <div key={metodo.id}
                        className={`border rounded-lg px-3 py-2 cursor-pointer transition-all text-xs ${isSelected ? "border-primary bg-primary text-white shadow-sm" : "border-gray-200 bg-white text-gray-700 hover:border-primary/50"}`}
                        onClick={() => setMetodoMedia(metodo.id)}>
                        <div className="font-semibold">{metodo.label}</div>
                        {metodo.descricao && <div className={`text-xs mt-0.5 ${isSelected ? "opacity-80" : "text-gray-500"}`}>{metodo.descricao}</div>}
                        {isSelected && (
                          <div className="flex gap-3 mt-1.5">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" checked={tipoMedia === "tritonal"} onChange={() => setTipoMedia("tritonal")} className="accent-white" />
                              <span>Tritonal</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" checked={tipoMedia === "quadritonal"} onChange={() => setTipoMedia("quadritonal")} className="accent-white" />
                              <span>Quadritonal</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── Seção 4: IRF + Mascaramento ─────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">4</div>
                <h2 className="text-sm font-bold text-gray-800">Índice de Reconhecimento de Fala (IRF) e Mascaramento</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* IRF */}
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">Palavras Faladas</div>
                  <table className="w-full border-collapse border border-gray-300 text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-0.5 text-left w-20"></th>
                        <th className="border border-gray-300 px-2 py-0.5 text-center">Intensidade</th>
                        <th className="border border-gray-300 px-2 py-0.5 text-center">Monossílabos</th>
                        <th className="border border-gray-300 px-2 py-0.5 text-center">Dissílabos</th>
                        <th className="border border-gray-300 px-2 py-0.5 text-center">Masc.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-2 py-0.5 font-semibold text-red-600 bg-red-50">OD</td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={irfODIntensidade} onChange={e => setIrfODIntensidade(e.target.value)} className={inp} /></td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={irfODMonossilabos} onChange={e => setIrfODMonossilabos(e.target.value)} className={inp} /></td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={irfODDissilabos} onChange={e => setIrfODDissilabos(e.target.value)} className={inp} /></td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={irfODMasc} onChange={e => setIrfODMasc(e.target.value)} className={inp} /></td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-2 py-0.5 font-semibold text-blue-600 bg-blue-50">OE</td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={irfOEIntensidade} onChange={e => setIrfOEIntensidade(e.target.value)} className={inp} /></td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={irfOEMonossilabos} onChange={e => setIrfOEMonossilabos(e.target.value)} className={inp} /></td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={irfOEDissilabos} onChange={e => setIrfOEDissilabos(e.target.value)} className={inp} /></td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={irfOEMasc} onChange={e => setIrfOEMasc(e.target.value)} className={inp} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mascaramento */}
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">Mascaramento (em dB)</div>
                  <table className="w-full border-collapse border border-gray-300 text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-0.5 text-left"></th>
                        <th className="border border-gray-300 px-2 py-0.5 text-center bg-red-500 text-white">VA OD Min</th>
                        <th className="border border-gray-300 px-2 py-0.5 text-center bg-red-500 text-white">VA OD Max</th>
                        <th className="border border-gray-300 px-2 py-0.5 text-center bg-red-400 text-white">VO OD Min</th>
                        <th className="border border-gray-300 px-2 py-0.5 text-center bg-red-400 text-white">VO OD Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-2 py-0.5 font-semibold text-red-600 bg-red-50">OD</td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={mascVAODMin} onChange={e => setMascVAODMin(e.target.value)} className={inp} /></td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={mascVAODMax} onChange={e => setMascVAODMax(e.target.value)} className={inp} /></td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={mascVOODMin} onChange={e => setMascVOODMin(e.target.value)} className={inp} /></td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={mascVOODMax} onChange={e => setMascVOODMax(e.target.value)} className={inp} /></td>
                      </tr>
                    </tbody>
                  </table>
                  <table className="w-full border-collapse border border-gray-300 text-xs mt-2">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-0.5 text-left"></th>
                        <th className="border border-gray-300 px-2 py-0.5 text-center bg-blue-600 text-white">VA OE Min</th>
                        <th className="border border-gray-300 px-2 py-0.5 text-center bg-blue-600 text-white">VA OE Max</th>
                        <th className="border border-gray-300 px-2 py-0.5 text-center bg-blue-500 text-white">VO OE Min</th>
                        <th className="border border-gray-300 px-2 py-0.5 text-center bg-blue-500 text-white">VO OE Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-2 py-0.5 font-semibold text-blue-600 bg-blue-50">OE</td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={mascVAOEMin} onChange={e => setMascVAOEMin(e.target.value)} className={inp} /></td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={mascVAOEMax} onChange={e => setMascVAOEMax(e.target.value)} className={inp} /></td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={mascVOOEMin} onChange={e => setMascVOOEMin(e.target.value)} className={inp} /></td>
                        <td className="border border-gray-300 p-0.5"><input type="number" value={mascVOOEMax} onChange={e => setMascVOOEMax(e.target.value)} className={inp} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ── Seção 5: Parecer Audiológico ─────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">5</div>
                <h2 className="text-sm font-bold text-gray-800">Parecer Audiológico</h2>
              </div>
              {pareceres && pareceres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pareceres.map((p: any) => (
                    <Button key={p.id} variant="outline" size="sm" className="text-xs h-7" onClick={() => setParecer(p.texto)}>
                      {p.titulo}
                    </Button>
                  ))}
                </div>
              )}
              {(!pareceres || pareceres.length === 0) && (
                <div className="text-xs text-gray-400 mb-2">
                  Nenhum modelo cadastrado. Acesse Configurações → Modelos de Parecer para adicionar.
                </div>
              )}
              <Textarea
                value={parecer}
                onChange={e => setParecer(e.target.value)}
                className="text-xs min-h-[100px] font-mono"
                placeholder="Digite ou selecione um modelo de parecer audiológico..."
              />
            </section>

            {/* ── Seção 6: Assinatura ──────────────────────────────────────── */}
            <section>
              <div className="grid grid-cols-2 gap-6 border-t border-gray-200 pt-4">
                <div className="space-y-2">
                  <div className="border-t-2 border-gray-400 pt-2 text-xs text-gray-600 text-center">
                    Assinatura do(a) Paciente
                  </div>
                  <div className="text-xs text-gray-600 text-center">
                    Data: <span className="font-semibold">
                      {dataRealizacao ? new Date(dataRealizacao + "T12:00:00").toLocaleDateString("pt-BR") : ""}
                    </span>
                  </div>
                </div>
                <div className="text-center text-xs text-gray-700 space-y-1 border-t-2 border-gray-400 pt-2">
                  {configLaudo?.nomeProfissional ? (
                    <>
                      <div className="font-bold text-sm">{configLaudo.nomeProfissional}</div>
                      {configLaudo.titulosProfissional && <div>{configLaudo.titulosProfissional}</div>}
                      {configLaudo.crfa && <div>CRFa: {configLaudo.crfa}</div>}
                    </>
                  ) : (
                    <div className="text-gray-400 italic text-xs">
                      Configure o profissional em Configurações → Laudo
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── Botões finais ─────────────────────────────────────────────── */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <Button variant="outline" size="sm" onClick={() => navigate("/exames")}>
                <ChevronLeft className="w-4 h-4 mr-1" />Voltar para Exames
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleLimpar}>
                  <Trash2 className="w-4 h-4 mr-1" />Limpar
                </Button>
                <Button variant="outline" size="sm" onClick={handleGerarPDF}>
                  <FileText className="w-4 h-4 mr-1" />Gerar Laudo PDF
                </Button>
                <Button size="sm" onClick={handleSalvar} disabled={salvarExame.isPending}>
                  <Save className="w-4 h-4 mr-1" />{salvarExame.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>

          </div>
        </div>
    </div>
  );
}
