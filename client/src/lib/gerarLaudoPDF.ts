import jsPDF from "jspdf";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DadosLaudo {
  // Cabeçalho da clínica
  nomeClinica?: string;
  enderecoClinica?: string;
  telefoneClinica?: string;
  cnpjClinica?: string;
  logotipoUrl?: string;

  // Identificação do paciente
  empresa: string;
  cnpjEmpresa?: string;
  paciente: string;
  cpf?: string;
  setor?: string;
  dataNascimento?: string;
  idade?: string;
  funcao?: string;
  sexo?: string;
  audiometro?: string;
  dataCalibracaoAudiometro?: string;
  dataRealizacao: string;

  // Motivo da avaliação
  motivoAvaliacao: string;
  repousoAuditivo?: string;
  repousoHoras?: string;
  queixa?: boolean;
  queixaDescricao?: string;
  epiUso?: string;
  epiPlug?: boolean;
  epiConcha?: boolean;

  // Meatoscopia
  meatoscopiaOD: string;
  meatoscopiaOE: string;

  // Audiometria Tonal - Via Aérea OD (250-8000 Hz)
  vaOD250?: number | null;
  vaOD500?: number | null;
  vaOD1000?: number | null;
  vaOD2000?: number | null;
  vaOD3000?: number | null;
  vaOD4000?: number | null;
  vaOD6000?: number | null;
  vaOD8000?: number | null;

  // Via Aérea OE
  vaOE250?: number | null;
  vaOE500?: number | null;
  vaOE1000?: number | null;
  vaOE2000?: number | null;
  vaOE3000?: number | null;
  vaOE4000?: number | null;
  vaOE6000?: number | null;
  vaOE8000?: number | null;

  // Via Óssea OD (500-4000 Hz)
  voOD500?: number | null;
  voOD1000?: number | null;
  voOD2000?: number | null;
  voOD3000?: number | null;
  voOD4000?: number | null;

  // Via Óssea OE
  voOE500?: number | null;
  voOE1000?: number | null;
  voOE2000?: number | null;
  voOE3000?: number | null;
  voOE4000?: number | null;

  // Médias
  mediaOD?: string;
  mediaOE?: string;
  classificacaoOD?: string;
  classificacaoOE?: string;
  metodoMedia?: string;

  // LRF, LDV, MASC
  lrfOD?: string;
  ldvOD?: string;
  mascOD?: string;
  lrfOE?: string;
  ldvOE?: string;
  mascOE?: string;

  // IRF
  irfIntensidadeOD?: number | null;
  irfMonossilabosOD?: number | null;
  irfDissilabosOD?: number | null;
  irfMascOD?: number | null;
  irfIntensidadeOE?: number | null;
  irfMonossilabosOE?: number | null;
  irfDissilabosOE?: number | null;
  irfMascOE?: number | null;

  // Mascaramento
  mascVAODMin?: number | null;
  mascVAODMax?: number | null;
  mascVOODMin?: number | null;
  mascVOODMax?: number | null;
  mascVAOEMin?: number | null;
  mascVAOEMax?: number | null;
  mascVOOEMin?: number | null;
  mascVOOEMax?: number | null;

  // Parecer
  parecerAudiologico?: string;

  // Profissional
  nomeProfissional?: string;
  titulosProfissional?: string;
  crfa?: string;
  assinaturaUrl?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(val: number | null | undefined): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

function fmtDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  // Tenta formatar YYYY-MM-DD → DD/MM/YYYY
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return dateStr;
}

function motivoLabel(motivo: string): string {
  const map: Record<string, string> = {
    admissional: "ADMISSIONAL",
    periodico: "PERIÓDICO",
    retorno_trabalho: "RETORNO AO TRABALHO",
    demissional: "DEMISSIONAL",
    mudanca_riscos: "MUDANÇA DE RISCOS OCUPACIONAIS",
    monitoracao_pontual: "MONITORAÇÃO PONTUAL",
    consulta_medica: "CONSULTA MÉDICA",
  };
  return map[motivo] || motivo.toUpperCase();
}

// ─── Geração do Audiograma SVG como imagem ────────────────────────────────────

function gerarAudiogramaSVG(
  freqs: number[],
  valores: (number | null | undefined)[],
  cor: string,
  simbolo: string,
  largura = 200,
  altura = 180
): string {
  const marginLeft = 40;
  const marginTop = 20;
  const marginRight = 10;
  const marginBottom = 20;
  const plotW = largura - marginLeft - marginRight;
  const plotH = altura - marginTop - marginBottom;

  const dbMin = -10;
  const dbMax = 120;
  const dbRange = dbMax - dbMin;

  const freqsAll = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
  const freqCount = freqsAll.length - 1;

  function xPos(freq: number): number {
    const idx = freqsAll.indexOf(freq);
    if (idx < 0) return marginLeft;
    return marginLeft + (idx / freqCount) * plotW;
  }

  function yPos(db: number): number {
    return marginTop + ((db - dbMin) / dbRange) * plotH;
  }

  // Grid horizontal
  let gridLines = "";
  for (let db = 0; db <= 120; db += 10) {
    const y = yPos(db);
    gridLines += `<line x1="${marginLeft}" y1="${y}" x2="${marginLeft + plotW}" y2="${y}" stroke="#ddd" stroke-width="0.5"/>`;
  }

  // Grid vertical
  let vLines = "";
  freqsAll.forEach((f, i) => {
    const x = marginLeft + (i / freqCount) * plotW;
    vLines += `<line x1="${x}" y1="${marginTop}" x2="${x}" y2="${marginTop + plotH}" stroke="#ddd" stroke-width="0.5"/>`;
  });

  // Eixo Y labels
  let yLabels = "";
  for (let db = 0; db <= 120; db += 20) {
    const y = yPos(db);
    yLabels += `<text x="${marginLeft - 5}" y="${y + 3}" font-size="7" text-anchor="end" fill="#666">${db}</text>`;
  }

  // Eixo X labels
  let xLabels = "";
  const freqLabels = ["250", "500", "1k", "2k", "3k", "4k", "6k", "8k"];
  freqsAll.forEach((f, i) => {
    const x = marginLeft + (i / freqCount) * plotW;
    xLabels += `<text x="${x}" y="${marginTop - 5}" font-size="7" text-anchor="middle" fill="#666">${freqLabels[i]}</text>`;
  });

  // Linha conectando os pontos
  const pontos = freqs.map((f, i) => ({ f, v: valores[i] })).filter(p => p.v !== null && p.v !== undefined);
  let linha = "";
  if (pontos.length > 1) {
    const pts = pontos.map(p => `${xPos(p.f)},${yPos(p.v!)}`).join(" ");
    linha = `<polyline points="${pts}" fill="none" stroke="${cor}" stroke-width="1.5"/>`;
  }

  // Símbolos nos pontos
  let simbolos = "";
  pontos.forEach(p => {
    const x = xPos(p.f);
    const y = yPos(p.v!);
    if (simbolo === "O") {
      simbolos += `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="${cor}" stroke-width="1.5"/>`;
    } else if (simbolo === "X") {
      simbolos += `<line x1="${x-4}" y1="${y-4}" x2="${x+4}" y2="${y+4}" stroke="${cor}" stroke-width="1.5"/>`;
      simbolos += `<line x1="${x+4}" y1="${y-4}" x2="${x-4}" y2="${y+4}" stroke="${cor}" stroke-width="1.5"/>`;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}">
    <rect width="${largura}" height="${altura}" fill="white"/>
    ${gridLines}${vLines}
    <line x1="${marginLeft}" y1="${marginTop}" x2="${marginLeft}" y2="${marginTop + plotH}" stroke="#999" stroke-width="1"/>
    <line x1="${marginLeft}" y1="${marginTop + plotH}" x2="${marginLeft + plotW}" y2="${marginTop + plotH}" stroke="#999" stroke-width="1"/>
    ${yLabels}${xLabels}
    ${linha}${simbolos}
  </svg>`;
}

// ─── Função principal de geração do PDF ───────────────────────────────────────

export async function gerarLaudoPDF(dados: DadosLaudo): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - 2 * margin;
  let y = margin;

  // ── Helpers de desenho ────────────────────────────────────────────────────

  const setFont = (size: number, style: "normal" | "bold" = "normal") => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
  };

  const drawText = (text: string, x: number, yPos: number, opts?: { align?: "left" | "center" | "right"; maxWidth?: number }) => {
    doc.text(text, x, yPos, opts as any);
  };

  const drawRect = (x: number, y: number, w: number, h: number, style: "S" | "F" | "FD" = "S") => {
    doc.rect(x, y, w, h, style);
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    doc.line(x1, y1, x2, y2);
  };

  const setColor = (r: number, g: number, b: number) => {
    doc.setTextColor(r, g, b);
  };

  const setDrawColor = (r: number, g: number, b: number) => {
    doc.setDrawColor(r, g, b);
  };

  const setFillColor = (r: number, g: number, b: number) => {
    doc.setFillColor(r, g, b);
  };

  // ── Cabeçalho ─────────────────────────────────────────────────────────────

  // Borda do cabeçalho
  setDrawColor(0, 0, 0);
  drawRect(margin, y, contentW, 22);

  // Nome da clínica
  setFont(11, "bold");
  setColor(0, 0, 0);
  const nomeClinica = dados.nomeClinica || "AVALIAÇÃO AUDIOLÓGICA";
  drawText(nomeClinica, pageW / 2, y + 8, { align: "center" });

  if (dados.enderecoClinica) {
    setFont(8);
    drawText(dados.enderecoClinica, pageW / 2, y + 13, { align: "center" });
  }
  if (dados.telefoneClinica) {
    setFont(8);
    drawText(`Tel: ${dados.telefoneClinica}`, pageW / 2, y + 17, { align: "center" });
  }

  // Título direito
  setFont(12, "bold");
  setColor(21, 93, 252);
  drawText("AVALIAÇÃO AUDIOLÓGICA", pageW - margin - 2, y + 10, { align: "right" });
  setColor(0, 0, 0);

  y += 25;

  // ── Seção 1: Identificação ────────────────────────────────────────────────

  setFont(9, "bold");
  drawText("1 - Identificação", margin, y);
  y += 4;

  // Tabela de identificação
  const rowH = 6;
  const col1W = contentW * 0.55;
  const col2W = contentW * 0.45;

  // Linha 1: Empresa | CNPJ
  drawRect(margin, y, col1W, rowH);
  drawRect(margin + col1W, y, col2W, rowH);
  setFont(7, "bold"); drawText("Empresa:", margin + 1, y + 4);
  setFont(7); drawText(dados.empresa || "", margin + 20, y + 4);
  setFont(7, "bold"); drawText("CNPJ/CAEPF:", margin + col1W + 1, y + 4);
  setFont(7); drawText(dados.cnpjEmpresa || "", margin + col1W + 22, y + 4);
  y += rowH;

  // Linha 2: Paciente | CPF
  drawRect(margin, y, col1W, rowH);
  drawRect(margin + col1W, y, col2W, rowH);
  setFont(7, "bold"); drawText("Paciente:", margin + 1, y + 4);
  setFont(7); drawText(dados.paciente || "", margin + 18, y + 4);
  setFont(7, "bold"); drawText("CPF:", margin + col1W + 1, y + 4);
  setFont(7); drawText(dados.cpf || "", margin + col1W + 10, y + 4);
  y += rowH;

  // Linha 3: Setor | Data Nasc | Idade
  const col3W = contentW * 0.35;
  const col4W = contentW * 0.35;
  const col5W = contentW * 0.30;
  drawRect(margin, y, col3W, rowH);
  drawRect(margin + col3W, y, col4W, rowH);
  drawRect(margin + col3W + col4W, y, col5W, rowH);
  setFont(7, "bold"); drawText("Setor:", margin + 1, y + 4);
  setFont(7); drawText(dados.setor || "", margin + 12, y + 4);
  setFont(7, "bold"); drawText("Data de Nascimento:", margin + col3W + 1, y + 4);
  setFont(7); drawText(fmtDate(dados.dataNascimento), margin + col3W + 32, y + 4);
  setFont(7, "bold"); drawText("Idade:", margin + col3W + col4W + 1, y + 4);
  setFont(7); drawText(dados.idade || "", margin + col3W + col4W + 12, y + 4);
  y += rowH;

  // Linha 4: Função | Sexo
  drawRect(margin, y, col1W, rowH);
  drawRect(margin + col1W, y, col2W, rowH);
  setFont(7, "bold"); drawText("Função:", margin + 1, y + 4);
  setFont(7); drawText(dados.funcao || "", margin + 15, y + 4);
  setFont(7, "bold"); drawText("Sexo:", margin + col1W + 1, y + 4);
  setFont(7); drawText(dados.sexo || "", margin + col1W + 12, y + 4);
  y += rowH;

  // Linha 5: Audiômetro | Data Calibração
  drawRect(margin, y, col1W, rowH);
  drawRect(margin + col1W, y, col2W, rowH);
  setFont(7, "bold"); drawText("Audiômetro:", margin + 1, y + 4);
  setFont(7); drawText(dados.audiometro || "WIDE RANGE", margin + 22, y + 4);
  setFont(7, "bold"); drawText("Data da Calibração:", margin + col1W + 1, y + 4);
  setFont(7); drawText(fmtDate(dados.dataCalibracaoAudiometro), margin + col1W + 32, y + 4);
  y += rowH + 3;

  // ── Seção 2: Motivo da Avaliação ──────────────────────────────────────────

  setFont(9, "bold");
  drawText("2 - Motivo da Avaliação", margin, y);
  y += 4;

  // Motivo + Repouso Auditivo
  const motivoW = contentW * 0.40;
  const repousoW = contentW * 0.60;
  drawRect(margin, y, motivoW, 8);
  setFont(8); drawText(motivoLabel(dados.motivoAvaliacao), margin + 2, y + 5);

  // Repouso auditivo
  setFont(7, "bold"); drawText("Repouso Auditivo:", margin + motivoW + 2, y + 3);
  setFont(7);
  const repousoLabel = dados.repousoAuditivo === "maior_igual_14h" ? "☑ Maior ou igual a 14 Horas  ☐ Menor de 14 Horas"
    : dados.repousoAuditivo === "menor_14h" ? "☐ Maior ou igual a 14 Horas  ☑ Menor de 14 Horas"
    : "☐ Maior ou igual a 14 Horas  ☐ Menor de 14 Horas";
  drawText(repousoLabel, margin + motivoW + 2, y + 7);
  y += 10;

  // Queixa e EPI
  setFont(7);
  const queixaStr = dados.queixa ? "☑ Sim  ☐ Nega" : "☐ Sim  ☑ Nega";
  drawText(`Queixa: ${queixaStr}`, margin, y);

  const epiStr = dados.epiUso === "nao" ? "FAZ USO DE EPI: ☑ NÃO  ☐ SIM"
    : `FAZ USO DE EPI: ☐ NÃO  ☑ SIM  ${dados.epiPlug ? "☑ PLUG" : "☐ PLUG"}  ${dados.epiConcha ? "☑ CONCHA" : "☐ CONCHA"}`;
  drawText(epiStr, margin + 60, y);
  y += 5;

  // ── Meatoscopia ───────────────────────────────────────────────────────────

  const meatW = contentW * 0.40;
  setFont(8, "bold");
  setFillColor(220, 220, 220);
  drawRect(margin + contentW - meatW, y - 8, meatW, 6, "FD");
  drawText("MEATOSCOPIA", margin + contentW - meatW + meatW / 2, y - 4, { align: "center" });
  setFillColor(255, 255, 255);

  const meatRowH = 5;
  drawRect(margin + contentW - meatW, y - 2, meatW / 2, meatRowH);
  drawRect(margin + contentW - meatW / 2, y - 2, meatW / 2, meatRowH);
  setFont(7, "bold"); drawText("OD", margin + contentW - meatW + 2, y + 2);
  setFont(7); setColor(255, 0, 0); drawText(dados.meatoscopiaOD || "NORMAL", margin + contentW - meatW + 10, y + 2);
  setColor(0, 0, 0);

  drawRect(margin + contentW - meatW, y + 3, meatW / 2, meatRowH);
  drawRect(margin + contentW - meatW / 2, y + 3, meatW / 2, meatRowH);
  setFont(7, "bold"); drawText("OE", margin + contentW - meatW + 2, y + 7);
  setFont(7); setColor(255, 0, 0); drawText(dados.meatoscopiaOE || "NORMAL", margin + contentW - meatW + 10, y + 7);
  setColor(0, 0, 0);

  y += 10;

  // ── Audiometria Tonal - Cabeçalho ─────────────────────────────────────────

  setFillColor(50, 50, 50);
  drawRect(margin, y, contentW, 6, "FD");
  setFont(9, "bold");
  setColor(255, 255, 255);
  drawText("AUDIOMETRIA TONAL", pageW / 2, y + 4, { align: "center" });
  setColor(0, 0, 0);
  setFillColor(255, 255, 255);
  y += 8;

  // ── Audiogramas ───────────────────────────────────────────────────────────

  const audioW = (contentW - 10) / 2;
  const audioH = 55;

  // Títulos
  setFont(9, "bold");
  setColor(200, 0, 0);
  drawText("Orelha Direita", margin + audioW / 2, y, { align: "center" });
  setColor(0, 0, 200);
  drawText("Orelha Esquerda", margin + audioW + 10 + audioW / 2, y, { align: "center" });
  setColor(0, 0, 0);
  y += 4;

  // Gerar audiogramas SVG e converter para imagem
  const freqsVA = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
  const vaODVals = [dados.vaOD250, dados.vaOD500, dados.vaOD1000, dados.vaOD2000, dados.vaOD3000, dados.vaOD4000, dados.vaOD6000, dados.vaOD8000];
  const vaOEVals = [dados.vaOE250, dados.vaOE500, dados.vaOE1000, dados.vaOE2000, dados.vaOE3000, dados.vaOE4000, dados.vaOE6000, dados.vaOE8000];

  // Desenhar audiograma OD manualmente no PDF
  const drawAudiogramaPDF = (
    xStart: number,
    yStart: number,
    w: number,
    h: number,
    vaVals: (number | null | undefined)[],
    voVals: (number | null | undefined)[],
    cor: [number, number, number],
    simboloVA: string,
    simboloVO: string
  ) => {
    const mL = 12, mT = 8, mR = 4, mB = 8;
    const pW = w - mL - mR;
    const pH = h - mT - mB;
    const dbMin = -10, dbMax = 120;
    const freqsAll = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
    const freqCount = freqsAll.length - 1;

    const xP = (freq: number) => xStart + mL + (freqsAll.indexOf(freq) / freqCount) * pW;
    const yP = (db: number) => yStart + mT + ((db - dbMin) / (dbMax - dbMin)) * pH;

    // Borda
    setDrawColor(150, 150, 150);
    drawRect(xStart, yStart, w, h);

    // Grid
    doc.setLineWidth(0.1);
    setDrawColor(220, 220, 220);
    for (let db = 0; db <= 120; db += 10) {
      drawLine(xStart + mL, yP(db), xStart + mL + pW, yP(db));
    }
    freqsAll.forEach((f, i) => {
      const x = xStart + mL + (i / freqCount) * pW;
      drawLine(x, yStart + mT, x, yStart + mT + pH);
    });

    // Eixos
    doc.setLineWidth(0.3);
    setDrawColor(100, 100, 100);
    drawLine(xStart + mL, yStart + mT, xStart + mL, yStart + mT + pH);
    drawLine(xStart + mL, yStart + mT + pH, xStart + mL + pW, yStart + mT + pH);

    // Labels Y
    setFont(5);
    setColor(100, 100, 100);
    for (let db = 0; db <= 120; db += 20) {
      drawText(String(db), xStart + mL - 1, yP(db) + 1.5, { align: "right" });
    }

    // Labels X
    const freqLabels = ["250", "500", "1k", "2k", "3k", "4k", "6k", "8k"];
    freqsAll.forEach((f, i) => {
      const x = xStart + mL + (i / freqCount) * pW;
      drawText(freqLabels[i], x, yStart + mT - 2, { align: "center" });
    });

    setColor(0, 0, 0);
    doc.setLineWidth(0.5);

    // Linha VA
    const pontosVA = freqsAll.map((f, i) => ({ f, v: vaVals[i] })).filter(p => p.v !== null && p.v !== undefined) as { f: number; v: number }[];
    if (pontosVA.length > 1) {
      setDrawColor(...cor);
      for (let i = 0; i < pontosVA.length - 1; i++) {
        drawLine(xP(pontosVA[i].f), yP(pontosVA[i].v), xP(pontosVA[i + 1].f), yP(pontosVA[i + 1].v));
      }
    }

    // Símbolos VA
    setDrawColor(...cor);
    pontosVA.forEach(p => {
      const x = xP(p.f);
      const yy = yP(p.v);
      if (simboloVA === "O") {
        doc.circle(x, yy, 1.5, "S");
      } else if (simboloVA === "X") {
        drawLine(x - 1.5, yy - 1.5, x + 1.5, yy + 1.5);
        drawLine(x + 1.5, yy - 1.5, x - 1.5, yy + 1.5);
      }
    });

    // Linha VO (pontilhada)
    const freqsVO = [500, 1000, 2000, 3000, 4000];
    const pontosVO = freqsVO.map((f, i) => ({ f, v: voVals[i] })).filter(p => p.v !== null && p.v !== undefined) as { f: number; v: number }[];
    if (pontosVO.length > 1) {
      setDrawColor(...cor);
      doc.setLineDashPattern([1, 1], 0);
      for (let i = 0; i < pontosVO.length - 1; i++) {
        drawLine(xP(pontosVO[i].f), yP(pontosVO[i].v), xP(pontosVO[i + 1].f), yP(pontosVO[i + 1].v));
      }
      doc.setLineDashPattern([], 0);
    }

    // Símbolos VO (< e >)
    setDrawColor(...cor);
    pontosVO.forEach(p => {
      const x = xP(p.f);
      const yy = yP(p.v);
      if (simboloVO === "<") {
        drawLine(x, yy, x - 2.5, yy - 1.5);
        drawLine(x, yy, x - 2.5, yy + 1.5);
      } else if (simboloVO === ">") {
        drawLine(x, yy, x + 2.5, yy - 1.5);
        drawLine(x, yy, x + 2.5, yy + 1.5);
      }
    });

    setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
  };

  const voODVals = [dados.voOD500, dados.voOD1000, dados.voOD2000, dados.voOD3000, dados.voOD4000];
  const voOEVals = [dados.voOE500, dados.voOE1000, dados.voOE2000, dados.voOE3000, dados.voOE4000];

  drawAudiogramaPDF(margin, y, audioW, audioH, vaODVals, voODVals, [200, 0, 0], "O", "<");
  drawAudiogramaPDF(margin + audioW + 10, y, audioW, audioH, vaOEVals, voOEVals, [0, 0, 200], "X", ">");

  // Legenda ASHA no centro
  const legendX = margin + audioW + 1;
  const legendY = y + 5;
  setFont(6, "bold");
  drawText("Legenda ASHA (1990)", legendX + 4, legendY);
  setFont(5);
  const legendItems = [
    ["VIA AÉREA", "Pres. resp. não masc.", "O", "X"],
    ["", "Pres. resp. mascarada", "△", "□"],
    ["", "Aus. resp. não masc.", "⊘", "✕"],
    ["", "Aus. resp. mascarada", "▲", "■"],
    ["VIA ÓSSEA", "Pres. resp. não masc.", "<", ">"],
    ["", "Pres. resp. mascarada", "[", "]"],
    ["", "Aus. resp. não masc.", "⌊", "⌋"],
    ["", "Aus. resp. mascarada", "⊏", "⊐"],
  ];
  legendItems.forEach((item, i) => {
    const ly = legendY + 4 + i * 4;
    if (item[0]) { setFont(5, "bold"); drawText(item[0], legendX, ly); setFont(5); }
    drawText(item[1], legendX + 10, ly);
    setColor(200, 0, 0); drawText(item[2], legendX + 32, ly);
    setColor(0, 0, 200); drawText(item[3], legendX + 36, ly);
    setColor(0, 0, 0);
  });

  y += audioH + 4;

  // ── Médias ────────────────────────────────────────────────────────────────

  setFont(8, "bold");
  setColor(200, 0, 0);
  drawText(`Média: ${dados.mediaOD || "—"} dB`, margin, y);
  if (dados.classificacaoOD) {
    setFont(7); setColor(0, 150, 0);
    drawText(dados.classificacaoOD, margin, y + 4);
  }

  setColor(0, 0, 200);
  drawText(`Média: ${dados.mediaOE || "—"} dB`, margin + audioW + 10, y);
  if (dados.classificacaoOE) {
    setFont(7); setColor(0, 150, 0);
    drawText(dados.classificacaoOE, margin + audioW + 10, y + 4);
  }

  setColor(0, 0, 0);
  setFont(7);
  drawText(`LRF: ${dados.lrfOD || ""}   LDV: ${dados.ldvOD || ""}   MASC: ${dados.mascOD || ""}`, margin, y + 8);
  drawText(`LRF: ${dados.lrfOE || ""}   LDV: ${dados.ldvOE || ""}   MASC: ${dados.mascOE || ""}`, margin + audioW + 10, y + 8);
  y += 14;

  // ── Tabela de Limiares ────────────────────────────────────────────────────

  const freqHeaders = ["F. Hz", "250", "500", "1k", "2k", "3k", "4k", "6k", "8k", "Logo"];
  const cellW = contentW / 2 / freqHeaders.length;
  const cellH = 5;

  // OD
  setFont(7, "bold");
  setColor(200, 0, 0);
  drawText("Orelha Direita", margin, y);
  setColor(0, 0, 200);
  drawText("Orelha Esquerda", margin + contentW / 2 + 2, y);
  setColor(0, 0, 0);
  y += 3;

  // Headers
  setFillColor(230, 230, 230);
  freqHeaders.forEach((h, i) => {
    drawRect(margin + i * cellW, y, cellW, cellH, "FD");
    drawRect(margin + contentW / 2 + i * cellW, y, cellW, cellH, "FD");
    setFont(6, "bold");
    drawText(h, margin + i * cellW + cellW / 2, y + 3.5, { align: "center" });
    drawText(h, margin + contentW / 2 + i * cellW + cellW / 2, y + 3.5, { align: "center" });
  });
  setFillColor(255, 255, 255);
  y += cellH;

  // Linha VO
  const voODRow = ["VO", "", fmt(dados.voOD500), fmt(dados.voOD1000), fmt(dados.voOD2000), fmt(dados.voOD3000), fmt(dados.voOD4000), "", "", ""];
  const voOERow = ["VO", "", fmt(dados.voOE500), fmt(dados.voOE1000), fmt(dados.voOE2000), fmt(dados.voOE3000), fmt(dados.voOE4000), "", "", ""];

  voODRow.forEach((v, i) => {
    drawRect(margin + i * cellW, y, cellW, cellH);
    drawRect(margin + contentW / 2 + i * cellW, y, cellW, cellH);
    setFont(6);
    drawText(v, margin + i * cellW + cellW / 2, y + 3.5, { align: "center" });
    drawText(voOERow[i], margin + contentW / 2 + i * cellW + cellW / 2, y + 3.5, { align: "center" });
  });
  y += cellH;

  // Linha VA
  const vaODRow = ["VA", fmt(dados.vaOD250), fmt(dados.vaOD500), fmt(dados.vaOD1000), fmt(dados.vaOD2000), fmt(dados.vaOD3000), fmt(dados.vaOD4000), fmt(dados.vaOD6000), fmt(dados.vaOD8000), ""];
  const vaOERow = ["VA", fmt(dados.vaOE250), fmt(dados.vaOE500), fmt(dados.vaOE1000), fmt(dados.vaOE2000), fmt(dados.vaOE3000), fmt(dados.vaOE4000), fmt(dados.vaOE6000), fmt(dados.vaOE8000), ""];

  vaODRow.forEach((v, i) => {
    drawRect(margin + i * cellW, y, cellW, cellH);
    drawRect(margin + contentW / 2 + i * cellW, y, cellW, cellH);
    setFont(6);
    drawText(v, margin + i * cellW + cellW / 2, y + 3.5, { align: "center" });
    drawText(vaOERow[i], margin + contentW / 2 + i * cellW + cellW / 2, y + 3.5, { align: "center" });
  });
  y += cellH + 3;

  // ── IRF ───────────────────────────────────────────────────────────────────

  setFont(8, "bold");
  drawText("Índice de Reconhecimento de Fala", margin, y);
  y += 4;

  const irfHeaders = ["", "Intensidade", "Monossílabos", "Dissílabos", "Masc."];
  const irfCellW = [30, 30, 30, 30, 30];
  const irfTotal = irfCellW.reduce((a, b) => a + b, 0);
  const irfScale = (contentW * 0.55) / irfTotal;

  let irfX = margin;
  irfHeaders.forEach((h, i) => {
    const w = irfCellW[i] * irfScale;
    setFillColor(230, 230, 230);
    drawRect(irfX, y, w, cellH, "FD");
    setFont(6, "bold");
    drawText(h, irfX + w / 2, y + 3.5, { align: "center" });
    irfX += w;
  });
  setFillColor(255, 255, 255);
  y += cellH;

  const irfRows = [
    ["Pal. Faladas OD", fmt(dados.irfIntensidadeOD), fmt(dados.irfMonossilabosOD), fmt(dados.irfDissilabosOD), fmt(dados.irfMascOD)],
    ["Pal. Faladas OE", fmt(dados.irfIntensidadeOE), fmt(dados.irfMonossilabosOE), fmt(dados.irfDissilabosOE), fmt(dados.irfMascOE)],
  ];

  irfRows.forEach(row => {
    irfX = margin;
    row.forEach((v, i) => {
      const w = irfCellW[i] * irfScale;
      drawRect(irfX, y, w, cellH);
      setFont(6);
      drawText(v, irfX + w / 2, y + 3.5, { align: "center" });
      irfX += w;
    });
    y += cellH;
  });

  y += 3;

  // ── Parecer Audiológico ───────────────────────────────────────────────────

  setFont(8, "bold");
  drawText("Parecer Audiológico:", margin, y);
  y += 4;

  const parecerH = 30;
  drawRect(margin, y, contentW, parecerH);

  if (dados.parecerAudiologico) {
    setFont(7);
    const lines = doc.splitTextToSize(dados.parecerAudiologico, contentW - 4);
    lines.slice(0, 8).forEach((line: string, i: number) => {
      drawText(line, margin + 2, y + 4 + i * 3.5);
    });
  }
  y += parecerH + 4;

  // ── Assinatura ────────────────────────────────────────────────────────────

  const assW = contentW / 2;
  const assH = 20;

  // Assinatura do paciente
  drawRect(margin, y, assW - 5, assH);
  setFont(7);
  drawText("Assinatura do(a) Paciente", margin + 2, y + assH - 2);
  drawText(`Data de realização do exame: ${fmtDate(dados.dataRealizacao)}`, margin + 2, y + assH + 4);

  // Dados do profissional
  const profX = margin + assW + 5;
  drawRect(profX, y, assW - 5, assH);
  setFont(9, "bold");
  drawText(dados.nomeProfissional || "Fonoaudiólogo(a)", profX + (assW - 5) / 2, y + 6, { align: "center" });
  setFont(8);
  drawText(dados.titulosProfissional || "Fonoaudiólogo", profX + (assW - 5) / 2, y + 11, { align: "center" });
  if (dados.crfa) {
    drawText(`CRFa ${dados.crfa}`, profX + (assW - 5) / 2, y + 16, { align: "center" });
  }

  y += assH + 8;
  setFont(7);
  drawText(`Fonoaudiólogo(a): ${dados.nomeProfissional || ""}`, margin, y);
  if (dados.crfa) drawText(`CRFA: ${dados.crfa}`, margin, y + 4);

  // ── Salvar PDF ────────────────────────────────────────────────────────────

  const nomeArquivo = `laudo_${dados.paciente.replace(/\s+/g, "_")}_${dados.dataRealizacao || "sem_data"}.pdf`;
  doc.save(nomeArquivo);
}
