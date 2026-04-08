/**
 * GerarLaudoPDF.tsx
 * Gera o laudo audiológico em PDF usando jsPDF.
 * Replica o layout do ST Audiometria Pró Ocupacional v2.12.
 */
import { jsPDF } from "jspdf";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DadosIdentificacao {
  empresaNome: string;
  cnpj: string;
  pacienteNome: string;
  cpf: string;
  setor: string;
  funcao: string;
  dataNascimento: string;
  idade: string;
  sexo: string;
  audiometro: string;
  dataCalibracaoAudiometro: string;
  dataRealizacao: string;
}

export interface DadosMotivoAvaliacao {
  motivoAvaliacao: string;
  repousoAuditivo: string;
  repousoHoras: string;
  queixa: boolean;
  queixaDescricao: string;
  epiUso: string;
}

export interface DadosMeatoscopia {
  meatoscopiaOD: string;
  meatoscopiaOE: string;
}

export interface LimiaresFreq {
  hz250?: number | null;
  hz500?: number | null;
  hz1000?: number | null;
  hz2000?: number | null;
  hz3000?: number | null;
  hz4000?: number | null;
  hz6000?: number | null;
  hz8000?: number | null;
}

export interface LimiaresFreqVO {
  hz500?: number | null;
  hz1000?: number | null;
  hz2000?: number | null;
  hz3000?: number | null;
  hz4000?: number | null;
}

export interface DadosAudiometria {
  vaOD: LimiaresFreq;
  vaOE: LimiaresFreq;
  voOD: LimiaresFreqVO;
  voOE: LimiaresFreqVO;
  mediaOD: number | null;
  mediaOE: number | null;
  classOD: string | null;
  classOE: string | null;
  metodoMedia: string;
  tipoMedia: string;
  lrfOD: string;
  ldvOD: string;
  lrfOE: string;
  ldvOE: string;
  irfODIntensidade: string;
  irfODMonossilabos: string;
  irfODDissilabos: string;
  irfOEIntensidade: string;
  irfOEMonossilabos: string;
  irfOEDissilabos: string;
}

export interface DadosParecer {
  parecer: string;
}

export interface ConfiguracaoLaudo {
  nomeClinica?: string;
  enderecoClinica?: string;
  telefoneClinica?: string;
  emailClinica?: string;
  cnpjClinica?: string;
  nomeProfissional?: string;
  titulosProfissional?: string;
  crfa?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarMotivo(motivo: string): string {
  const map: Record<string, string> = {
    admissional: "ADMISSIONAL",
    periodico: "PERIÓDICO",
    retorno_trabalho: "RETORNO AO TRABALHO",
    demissional: "DEMISSIONAL",
    mudanca_riscos: "MUDANÇA DE RISCOS OCUPACIONAIS",
    monitoracao_pontual: "MONITORAÇÃO PONTUAL",
    consulta_medica: "CONSULTA MÉDICA",
  };
  return map[motivo] ?? motivo.toUpperCase();
}

function formatarMeatoscopia(m: string): string {
  const map: Record<string, string> = {
    normal: "Normal",
    obstrucao_parcial: "Obstrução Parcial",
    obstrucao_total: "Obstrução Total",
  };
  return map[m] ?? m;
}

function formatarData(d: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function formatarMetodo(m: string): string {
  const map: Record<string, string> = {
    lloyd_kaplan_1978: "Lloyd & Kaplan (1978)",
    northern_downs_2002: "Northern & Downs (2002)",
    who_2014: "WHO (2014)",
    who_2020: "WHO (2020)",
    who_2021: "WHO (2021)",
  };
  return map[m] ?? m;
}

// ─── Audiograma SVG → Canvas → jsPDF ─────────────────────────────────────────

function desenharAudiograma(
  doc: jsPDF,
  x: number,
  y: number,
  largura: number,
  altura: number,
  vaFreqs: LimiaresFreq | LimiaresFreqVO,
  voFreqs: LimiaresFreq | LimiaresFreqVO,
  orelha: "OD" | "OE"
) {
  const freqs = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
  const freqsVO = [500, 1000, 2000, 3000, 4000];
  const dbMin = -10;
  const dbMax = 120;
  const dbRange = dbMax - dbMin;

  const marginLeft = 12;
  const marginRight = 4;
  const marginTop = 6;
  const marginBottom = 8;
  const plotW = largura - marginLeft - marginRight;
  const plotH = altura - marginTop - marginBottom;

  const freqToX = (hz: number) => {
    const logFreqs = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
    const idx = logFreqs.indexOf(hz);
    if (idx < 0) return x + marginLeft;
    return x + marginLeft + (idx / (logFreqs.length - 1)) * plotW;
  };

  const dbToY = (db: number) => {
    return y + marginTop + ((db - dbMin) / dbRange) * plotH;
  };

  // Fundo branco
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, largura, altura, "F");

  // Grade horizontal (a cada 10 dB)
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  for (let db = dbMin; db <= dbMax; db += 10) {
    const yLine = dbToY(db);
    doc.line(x + marginLeft, yLine, x + marginLeft + plotW, yLine);
    // Labels dB
    doc.setFontSize(4);
    doc.setTextColor(120, 120, 120);
    doc.text(String(db), x + marginLeft - 2, yLine + 1, { align: "right" });
  }

  // Grade vertical (frequências)
  freqs.forEach((hz) => {
    const xLine = freqToX(hz);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(xLine, y + marginTop, xLine, y + marginTop + plotH);
    // Labels Hz
    doc.setFontSize(4);
    doc.setTextColor(120, 120, 120);
    const label = hz >= 1000 ? `${hz / 1000}k` : String(hz);
    doc.text(label, xLine, y + marginTop - 1, { align: "center" });
  });

  // Borda do gráfico
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.rect(x + marginLeft, y + marginTop, plotW, plotH);

  // Linha de normalidade (25 dB)
  doc.setDrawColor(180, 220, 180);
  doc.setLineWidth(0.5);
  const y25 = dbToY(25);
  doc.line(x + marginLeft, y25, x + marginLeft + plotW, y25);

  // Plotar VA
  const vaColor = orelha === "OD" ? [220, 50, 50] : [50, 100, 220];
  doc.setDrawColor(vaColor[0], vaColor[1], vaColor[2]);
  doc.setLineWidth(0.6);

  let prevX: number | null = null;
  let prevY: number | null = null;

  freqs.forEach((hz) => {
    const key = `hz${hz}` as keyof typeof vaFreqs;
    const val = (vaFreqs as any)[key];
    if (val !== null && val !== undefined && !isNaN(val)) {
      const px = freqToX(hz);
      const py = dbToY(val);

      if (prevX !== null && prevY !== null) {
        doc.line(prevX, prevY, px, py);
      }

      // Símbolo: O para OD, X para OE
      doc.setFontSize(5);
      doc.setTextColor(vaColor[0], vaColor[1], vaColor[2]);
      if (orelha === "OD") {
        doc.circle(px, py, 1.2, "S");
      } else {
        doc.text("×", px, py + 1.5, { align: "center" });
      }

      prevX = px;
      prevY = py;
    } else {
      prevX = null;
      prevY = null;
    }
  });

  // Plotar VO
  const voColor = orelha === "OD" ? [200, 30, 30] : [30, 80, 200];
  doc.setDrawColor(voColor[0], voColor[1], voColor[2]);
  doc.setLineWidth(0.4);

  prevX = null;
  prevY = null;

  freqsVO.forEach((hz) => {
    const key = `hz${hz}` as keyof typeof voFreqs;
    const val = (voFreqs as any)[key];
    if (val !== null && val !== undefined && !isNaN(val)) {
      const px = freqToX(hz);
      const py = dbToY(val);

      if (prevX !== null && prevY !== null) {
        doc.setLineDashPattern([1, 1], 0);
        doc.line(prevX, prevY, px, py);
        doc.setLineDashPattern([], 0);
      }

      // Símbolo: < para OD, > para OE
      doc.setFontSize(5);
      doc.setTextColor(voColor[0], voColor[1], voColor[2]);
      doc.text(orelha === "OD" ? "<" : ">", px, py + 1.5, { align: "center" });

      prevX = px;
      prevY = py;
    } else {
      prevX = null;
      prevY = null;
    }
  });
}

// ─── Função principal de geração ──────────────────────────────────────────────

export function gerarLaudoPDF(
  identificacao: DadosIdentificacao,
  motivo: DadosMotivoAvaliacao,
  meatoscopia: DadosMeatoscopia,
  audiometria: DadosAudiometria,
  parecer: DadosParecer,
  config: ConfiguracaoLaudo
): void {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageW = 210;
    const pageH = 297;
    const margin = 12;
    const contentW = pageW - 2 * margin;
    let curY = margin;

    // ── Cabeçalho ────────────────────────────────────────────────────────────

    // Faixa azul do cabeçalho
    doc.setFillColor(21, 93, 252);
    doc.rect(0, 0, pageW, 22, "F");

    // Nome da clínica
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(config.nomeClinica || "Clínica de Audiologia Ocupacional", margin, 9);

    // Subtítulo
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text("AVALIAÇÃO AUDIOLÓGICA OCUPACIONAL", margin, 14);

    // Data no canto direito
    doc.setFontSize(7);
    doc.text(
      `Data: ${formatarData(identificacao.dataRealizacao)}`,
      pageW - margin,
      9,
      { align: "right" }
    );

    if (config.enderecoClinica) {
      doc.setFontSize(6.5);
      doc.text(config.enderecoClinica, pageW - margin, 14, { align: "right" });
    }
    if (config.telefoneClinica || config.emailClinica) {
      doc.setFontSize(6.5);
      const contact = [config.telefoneClinica, config.emailClinica].filter(Boolean).join("  |  ");
      doc.text(contact, pageW - margin, 18, { align: "right" });
    }

    curY = 26;

    // ── Seção 1: Identificação ────────────────────────────────────────────────

    doc.setFillColor(240, 245, 255);
    doc.rect(margin, curY, contentW, 6, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 93, 252);
    doc.text("1 - IDENTIFICAÇÃO", margin + 2, curY + 4);
    curY += 8;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(7.5);

    // Linha 1: Empresa + CNPJ
    doc.setFont("helvetica", "bold");
    doc.text("Empresa:", margin, curY);
    doc.setFont("helvetica", "normal");
    doc.text(identificacao.empresaNome || "—", margin + 16, curY);
    doc.setFont("helvetica", "bold");
    doc.text("CNPJ:", pageW - margin - 50, curY);
    doc.setFont("helvetica", "normal");
    doc.text(identificacao.cnpj || "—", pageW - margin - 38, curY);
    curY += 5;

    // Linha 2: Paciente + CPF
    doc.setFont("helvetica", "bold");
    doc.text("Paciente:", margin, curY);
    doc.setFont("helvetica", "normal");
    doc.text(identificacao.pacienteNome || "—", margin + 16, curY);
    doc.setFont("helvetica", "bold");
    doc.text("CPF:", pageW - margin - 50, curY);
    doc.setFont("helvetica", "normal");
    doc.text(identificacao.cpf || "—", pageW - margin - 38, curY);
    curY += 5;

    // Linha 3: Setor + Função + Sexo
    doc.setFont("helvetica", "bold");
    doc.text("Setor:", margin, curY);
    doc.setFont("helvetica", "normal");
    doc.text(identificacao.setor || "—", margin + 12, curY);
    doc.setFont("helvetica", "bold");
    doc.text("Função:", margin + 65, curY);
    doc.setFont("helvetica", "normal");
    doc.text(identificacao.funcao || "—", margin + 78, curY);
    doc.setFont("helvetica", "bold");
    doc.text("Sexo:", pageW - margin - 40, curY);
    doc.setFont("helvetica", "normal");
    doc.text(identificacao.sexo || "—", pageW - margin - 28, curY);
    curY += 5;

    // Linha 4: Data Nasc + Idade + Audiômetro + Calibração
    doc.setFont("helvetica", "bold");
    doc.text("Nasc.:", margin, curY);
    doc.setFont("helvetica", "normal");
    doc.text(formatarData(identificacao.dataNascimento), margin + 12, curY);
    doc.setFont("helvetica", "bold");
    doc.text("Idade:", margin + 40, curY);
    doc.setFont("helvetica", "normal");
    doc.text(identificacao.idade ? `${identificacao.idade} anos` : "—", margin + 52, curY);
    doc.setFont("helvetica", "bold");
    doc.text("Audiômetro:", margin + 80, curY);
    doc.setFont("helvetica", "normal");
    doc.text(identificacao.audiometro || "—", margin + 100, curY);
    doc.setFont("helvetica", "bold");
    doc.text("Calibração:", pageW - margin - 45, curY);
    doc.setFont("helvetica", "normal");
    doc.text(formatarData(identificacao.dataCalibracaoAudiometro), pageW - margin - 25, curY);
    curY += 7;

    // ── Seção 2: Motivo + Meatoscopia ─────────────────────────────────────────

    doc.setFillColor(240, 245, 255);
    doc.rect(margin, curY, contentW, 6, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 93, 252);
    doc.text("2 - MOTIVO DA AVALIAÇÃO / MEATOSCOPIA", margin + 2, curY + 4);
    curY += 8;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(7.5);

    // Motivo + Repouso
    doc.setFont("helvetica", "bold");
    doc.text("Motivo:", margin, curY);
    doc.setFont("helvetica", "normal");
    doc.text(formatarMotivo(motivo.motivoAvaliacao), margin + 14, curY);

    doc.setFont("helvetica", "bold");
    doc.text("Repouso Auditivo:", margin + 80, curY);
    doc.setFont("helvetica", "normal");
    const repousoText = motivo.repousoAuditivo === "maior_igual_14h"
      ? "≥ 14 horas"
      : motivo.repousoAuditivo === "menor_14h"
        ? `< 14h (${motivo.repousoHoras || "?"}h)`
        : "Não informado";
    doc.text(repousoText, margin + 110, curY);
    curY += 5;

    // Queixa + EPI
    doc.setFont("helvetica", "bold");
    doc.text("Queixa:", margin, curY);
    doc.setFont("helvetica", "normal");
    doc.text(
      motivo.queixa ? `Sim — ${motivo.queixaDescricao || ""}` : "Nega",
      margin + 14, curY
    );
    doc.setFont("helvetica", "bold");
    doc.text("EPI:", margin + 80, curY);
    doc.setFont("helvetica", "normal");
    const epiMap: Record<string, string> = {
      nao: "Não usa",
      sim: "Sim",
      plug: "Plug",
      concha: "Concha",
    };
    doc.text(epiMap[motivo.epiUso] ?? motivo.epiUso, margin + 88, curY);
    curY += 5;

    // Meatoscopia
    doc.setFont("helvetica", "bold");
    doc.text("Meatoscopia OD:", margin, curY);
    doc.setFont("helvetica", "normal");
    doc.text(formatarMeatoscopia(meatoscopia.meatoscopiaOD), margin + 28, curY);
    doc.setFont("helvetica", "bold");
    doc.text("Meatoscopia OE:", margin + 80, curY);
    doc.setFont("helvetica", "normal");
    doc.text(formatarMeatoscopia(meatoscopia.meatoscopiaOE), margin + 108, curY);
    curY += 7;

    // ── Seção 3: Audiometria Tonal ────────────────────────────────────────────

    doc.setFillColor(240, 245, 255);
    doc.rect(margin, curY, contentW, 6, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 93, 252);
    doc.text("3 - AUDIOMETRIA TONAL LIMIAR", margin + 2, curY + 4);
    curY += 8;

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(7);

    // Tabela de limiares
    const freqLabels = ["250", "500", "1k", "2k", "3k", "4k", "6k", "8k"];
    const freqKeys: (keyof LimiaresFreq)[] = ["hz250", "hz500", "hz1000", "hz2000", "hz3000", "hz4000", "hz6000", "hz8000"];
    const colW = (contentW - 20) / freqLabels.length;
    const rowH = 5;

    // Cabeçalho da tabela
    doc.setFillColor(200, 200, 200);
    doc.rect(margin, curY, 20, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.text("F. Hz", margin + 2, curY + 3.5);

    freqLabels.forEach((label, i) => {
      doc.setFillColor(220, 220, 220);
      doc.rect(margin + 20 + i * colW, curY, colW, rowH, "F");
      doc.text(label, margin + 20 + i * colW + colW / 2, curY + 3.5, { align: "center" });
    });
    curY += rowH;

    // Linha OD VA
    doc.setFillColor(255, 235, 235);
    doc.rect(margin, curY, 20, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 30, 30);
    doc.text("OD VA", margin + 2, curY + 3.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    freqKeys.forEach((key, i) => {
      const val = audiometria.vaOD[key];
      const text = val !== null && val !== undefined ? String(val) : "";
      doc.text(text, margin + 20 + i * colW + colW / 2, curY + 3.5, { align: "center" });
    });
    curY += rowH;

    // Linha OD VO
    doc.setFillColor(255, 245, 245);
    doc.rect(margin, curY, 20, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 30, 30);
    doc.text("OD VO", margin + 2, curY + 3.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const voODKeys: (keyof LimiaresFreqVO)[] = ["hz500", "hz1000", "hz2000", "hz3000", "hz4000"];
    freqLabels.forEach((_, i) => {
      const hz = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000][i];
      const voKey = `hz${hz}` as keyof LimiaresFreqVO;
      const val = voODKeys.includes(voKey) ? audiometria.voOD[voKey] : null;
      const text = val !== null && val !== undefined ? String(val) : "";
      doc.text(text, margin + 20 + i * colW + colW / 2, curY + 3.5, { align: "center" });
    });
    curY += rowH;

    // Linha OE VA
    doc.setFillColor(235, 235, 255);
    doc.rect(margin, curY, 20, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 50, 200);
    doc.text("OE VA", margin + 2, curY + 3.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    freqKeys.forEach((key, i) => {
      const val = audiometria.vaOE[key];
      const text = val !== null && val !== undefined ? String(val) : "";
      doc.text(text, margin + 20 + i * colW + colW / 2, curY + 3.5, { align: "center" });
    });
    curY += rowH;

    // Linha OE VO
    doc.setFillColor(245, 245, 255);
    doc.rect(margin, curY, 20, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 50, 200);
    doc.text("OE VO", margin + 2, curY + 3.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    freqLabels.forEach((_, i) => {
      const hz = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000][i];
      const voKey = `hz${hz}` as keyof LimiaresFreqVO;
      const val = voODKeys.includes(voKey) ? audiometria.voOE[voKey] : null;
      const text = val !== null && val !== undefined ? String(val) : "";
      doc.text(text, margin + 20 + i * colW + colW / 2, curY + 3.5, { align: "center" });
    });
    curY += rowH + 3;

    // ── Audiogramas ───────────────────────────────────────────────────────────

    const audiogramaW = (contentW - 4) / 2;
    const audiogramaH = 48;

    // Título OD
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 30, 30);
    doc.text("Orelha Direita (OD)", margin + audiogramaW / 2, curY, { align: "center" });
    doc.setTextColor(30, 50, 200);
    doc.text("Orelha Esquerda (OE)", margin + audiogramaW + 4 + audiogramaW / 2, curY, { align: "center" });
    curY += 3;

    desenharAudiograma(doc, margin, curY, audiogramaW, audiogramaH, audiometria.vaOD, audiometria.voOD, "OD");
    desenharAudiograma(doc, margin + audiogramaW + 4, curY, audiogramaW, audiogramaH, audiometria.vaOE, audiometria.voOE, "OE");
    curY += audiogramaH + 3;

    // Médias e classificações
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);

    const mediaODText = audiometria.mediaOD !== null
      ? `${audiometria.mediaOD.toFixed(1)} dB — ${audiometria.classOD ?? ""}`
      : "—";
    const mediaOEText = audiometria.mediaOE !== null
      ? `${audiometria.mediaOE.toFixed(1)} dB — ${audiometria.classOE ?? ""}`
      : "—";

    doc.text(`Média OD: ${mediaODText}`, margin, curY);
    doc.text(`Média OE: ${mediaOEText}`, margin + audiogramaW + 4, curY);
    curY += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    doc.text(
      `Método: ${formatarMetodo(audiometria.metodoMedia)} — ${audiometria.tipoMedia === "tritonal" ? "Tritonal" : "Quadritonal"}`,
      margin, curY
    );
    curY += 6;

    // LRF / LDV
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("LRF OD:", margin, curY);
    doc.setFont("helvetica", "normal");
    doc.text(audiometria.lrfOD || "—", margin + 14, curY);
    doc.setFont("helvetica", "bold");
    doc.text("LDV OD:", margin + 35, curY);
    doc.setFont("helvetica", "normal");
    doc.text(audiometria.ldvOD || "—", margin + 49, curY);
    doc.setFont("helvetica", "bold");
    doc.text("LRF OE:", margin + audiogramaW + 4, curY);
    doc.setFont("helvetica", "normal");
    doc.text(audiometria.lrfOE || "—", margin + audiogramaW + 18, curY);
    doc.setFont("helvetica", "bold");
    doc.text("LDV OE:", margin + audiogramaW + 39, curY);
    doc.setFont("helvetica", "normal");
    doc.text(audiometria.ldvOE || "—", margin + audiogramaW + 53, curY);
    curY += 5;

    // IRF
    if (audiometria.irfODIntensidade || audiometria.irfOEIntensidade) {
      doc.setFont("helvetica", "bold");
      doc.text("IRF OD:", margin, curY);
      doc.setFont("helvetica", "normal");
      const irfODText = [
        audiometria.irfODIntensidade ? `Int: ${audiometria.irfODIntensidade} dB` : "",
        audiometria.irfODMonossilabos ? `Mono: ${audiometria.irfODMonossilabos}%` : "",
        audiometria.irfODDissilabos ? `Dis: ${audiometria.irfODDissilabos}%` : "",
      ].filter(Boolean).join("  ");
      doc.text(irfODText, margin + 14, curY);

      doc.setFont("helvetica", "bold");
      doc.text("IRF OE:", margin + audiogramaW + 4, curY);
      doc.setFont("helvetica", "normal");
      const irfOEText = [
        audiometria.irfOEIntensidade ? `Int: ${audiometria.irfOEIntensidade} dB` : "",
        audiometria.irfOEMonossilabos ? `Mono: ${audiometria.irfOEMonossilabos}%` : "",
        audiometria.irfOEDissilabos ? `Dis: ${audiometria.irfOEDissilabos}%` : "",
      ].filter(Boolean).join("  ");
      doc.text(irfOEText, margin + audiogramaW + 18, curY);
      curY += 5;
    }

    // ── Seção 4: Parecer Audiológico ──────────────────────────────────────────

    curY += 2;
    doc.setFillColor(240, 245, 255);
    doc.rect(margin, curY, contentW, 6, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 93, 252);
    doc.text("4 - PARECER AUDIOLÓGICO", margin + 2, curY + 4);
    curY += 8;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(7.5);

    // Texto do parecer com quebra de linha
    const parecerLines = doc.splitTextToSize(parecer.parecer || "—", contentW);
    doc.text(parecerLines, margin, curY);
    curY += parecerLines.length * 4 + 6;

    // ── Rodapé / Assinatura ───────────────────────────────────────────────────

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, curY, pageW - margin, curY);
    curY += 5;

    // Assinatura do profissional (lado direito)
    const assinaturaX = pageW - margin - 70;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(config.nomeProfissional || "Fonoaudiólogo(a)", assinaturaX + 35, curY, { align: "center" });
    curY += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    if (config.titulosProfissional) {
      doc.text(config.titulosProfissional, assinaturaX + 35, curY, { align: "center" });
      curY += 4;
    }
    if (config.crfa) {
      doc.text(`CRFa: ${config.crfa}`, assinaturaX + 35, curY, { align: "center" });
      curY += 4;
    }

    // Data e assinatura do paciente (lado esquerdo)
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(`Data de realização: ${formatarData(identificacao.dataRealizacao)}`, margin, curY - 8);
    doc.line(margin, curY + 2, margin + 60, curY + 2);
    doc.text("Assinatura do(a) Paciente", margin + 30, curY + 6, { align: "center" });

    // Rodapé da página
    const footerY = pageH - 8;
    doc.setDrawColor(21, 93, 252);
    doc.setLineWidth(0.5);
    doc.line(0, footerY - 3, pageW, footerY - 3);
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "FonoOcupacional — Sistema de Gestão Audiológica Ocupacional",
      pageW / 2,
      footerY,
      { align: "center" }
    );

    // ── Salvar ────────────────────────────────────────────────────────────────

    const nomeArquivo = `laudo_${identificacao.pacienteNome.replace(/\s+/g, "_") || "paciente"}_${identificacao.dataRealizacao}.pdf`;
    doc.save(nomeArquivo);
    toast.success("Laudo PDF gerado com sucesso!");
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    toast.error("Erro ao gerar o laudo PDF. Tente novamente.");
  }
}
