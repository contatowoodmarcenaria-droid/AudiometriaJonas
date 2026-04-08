/**
 * Utilitário de cálculos audiométricos
 * Implementa os métodos de média e classificação conforme o ST Audiometria Pró Ocupacional v2.12
 */

export type MetodoMedia =
  | "lloyd_kaplan_1978"
  | "northern_downs_2002"
  | "oms_2014"
  | "oms_2020"
  | "oms_2021";

export type TipoMedia = "tritonal" | "quadritonal";

export interface LimiaresOrelha {
  hz250?: number | null;
  hz500?: number | null;
  hz1000?: number | null;
  hz2000?: number | null;
  hz3000?: number | null;
  hz4000?: number | null;
  hz6000?: number | null;
  hz8000?: number | null;
}

/**
 * Calcula a média audiométrica conforme o método selecionado
 *
 * Lloyd & Kaplan (1978):
 *   - Tritonal: média de 500, 1000, 2000 Hz
 *   - Quadritonal: média de 500, 1000, 2000, 3000 Hz
 *
 * Northern & Downs (2002) - Crianças até 7 anos:
 *   - Tritonal: média de 500, 1000, 2000 Hz
 *   - Quadritonal: média de 500, 1000, 2000, 4000 Hz
 *
 * OMS 2014 - Crianças até 7 anos:
 *   - Tritonal: média de 500, 1000, 2000 Hz
 *   - Quadritonal: média de 500, 1000, 2000, 4000 Hz
 *
 * OMS 2020:
 *   - Tritonal: média de 500, 1000, 2000 Hz
 *   - Quadritonal: média de 500, 1000, 2000, 4000 Hz
 *
 * OMS 2021:
 *   - Tritonal: média de 500, 1000, 2000 Hz
 *   - Quadritonal: média de 500, 1000, 2000, 4000 Hz
 */
export function calcularMedia(
  limiares: LimiaresOrelha,
  metodo: MetodoMedia,
  tipo: TipoMedia
): number | null {
  const { hz500, hz1000, hz2000, hz3000, hz4000 } = limiares;

  if (tipo === "tritonal") {
    // Todos os métodos usam 500, 1000, 2000 Hz para tritonal
    if (hz500 == null || hz1000 == null || hz2000 == null) return null;
    return Math.round(((hz500 + hz1000 + hz2000) / 3) * 100) / 100;
  }

  // Quadritonal — a 4ª frequência varia por método
  if (metodo === "lloyd_kaplan_1978") {
    // Lloyd & Kaplan: 500, 1000, 2000, 3000 Hz
    if (hz500 == null || hz1000 == null || hz2000 == null || hz3000 == null) return null;
    return Math.round(((hz500 + hz1000 + hz2000 + hz3000) / 4) * 100) / 100;
  } else {
    // Northern & Downs, OMS 2014, 2020, 2021: 500, 1000, 2000, 4000 Hz
    if (hz500 == null || hz1000 == null || hz2000 == null || hz4000 == null) return null;
    return Math.round(((hz500 + hz1000 + hz2000 + hz4000) / 4) * 100) / 100;
  }
}

/**
 * Classifica a perda auditiva conforme a média calculada
 *
 * Classificação padrão (Lloyd & Kaplan / Northern & Downs / OMS):
 *   ≤ 25 dB → Audição normal
 *   26–40 dB → Perda leve
 *   41–55 dB → Perda moderada
 *   56–70 dB → Perda moderadamente severa
 *   71–90 dB → Perda severa
 *   > 90 dB → Perda profunda
 *
 * OMS 2021 usa limiares ligeiramente diferentes:
 *   ≤ 20 dB → Audição normal
 *   21–35 dB → Perda leve
 *   36–50 dB → Perda moderada
 *   51–65 dB → Perda moderadamente severa
 *   66–80 dB → Perda severa
 *   81–95 dB → Perda profunda
 *   > 95 dB → Perda total/cofose
 */
export function classificarPerda(media: number | null, metodo: MetodoMedia): string {
  if (media === null) return "";

  if (metodo === "oms_2021") {
    if (media <= 20) return "Audição normal";
    if (media <= 35) return "Perda leve";
    if (media <= 50) return "Perda moderada";
    if (media <= 65) return "Perda moderadamente severa";
    if (media <= 80) return "Perda severa";
    if (media <= 95) return "Perda profunda";
    return "Perda total (cofose)";
  }

  // Lloyd & Kaplan, Northern & Downs, OMS 2014, OMS 2020
  if (media <= 25) return "Audição normal";
  if (media <= 40) return "Perda leve";
  if (media <= 55) return "Perda moderada";
  if (media <= 70) return "Perda moderadamente severa";
  if (media <= 90) return "Perda severa";
  return "Perda profunda";
}

/**
 * Determina o tipo de perda auditiva comparando via aérea e via óssea
 *
 * Regras:
 * - Se VA ≤ 25 dB → Audição normal (independente de VO)
 * - Se VA > 25 dB e VO ≤ 25 dB e diferença VA-VO ≥ 10 dB → Condutiva
 * - Se VA > 25 dB e VO > 25 dB e diferença VA-VO < 10 dB → Sensorioneural
 * - Se VA > 25 dB e VO > 25 dB e diferença VA-VO ≥ 10 dB → Mista
 */
export function determinarTipoPerda(
  mediaVA: number | null,
  mediaVO: number | null
): string {
  if (mediaVA === null) return "";
  if (mediaVA <= 25) return "Normal";

  if (mediaVO === null) return "Sensorioneural (VO não realizada)";

  const gap = mediaVA - mediaVO;

  if (mediaVO <= 25 && gap >= 10) return "Condutiva";
  if (mediaVO > 25 && gap < 10) return "Sensorioneural";
  if (mediaVO > 25 && gap >= 10) return "Mista";

  return "Sensorioneural";
}

/**
 * Retorna o símbolo ASHA 1990 para o tipo de resposta
 *
 * OD (Orelha Direita):
 *   Via Aérea:
 *     O = Presença de resposta não mascarada
 *     Δ = Presença de resposta mascarada
 *     ∅ (ou Q) = Ausência de resposta não mascarada
 *     Δ̄ = Ausência de resposta mascarada
 *   Via Óssea:
 *     < = Presença de resposta não mascarada
 *     [ = Presença de resposta mascarada
 *     ↙ = Ausência de resposta não mascarada
 *     ⌊ = Ausência de resposta mascarada
 *
 * OE (Orelha Esquerda):
 *   Via Aérea:
 *     X = Presença de resposta não mascarada
 *     □ = Presença de resposta mascarada
 *     ✕ = Ausência de resposta não mascarada
 *     □̄ = Ausência de resposta mascarada
 *   Via Óssea:
 *     > = Presença de resposta não mascarada
 *     ] = Presença de resposta mascarada
 *     ↘ = Ausência de resposta não mascarada
 *     ⌋ = Ausência de resposta mascarada
 */
export type TipoResposta =
  | "aus_nao_masc"   // Ausência de resposta não mascarada
  | "aus_masc"       // Ausência de resposta mascarada
  | "pres_nao_masc"  // Presença de resposta não mascarada (padrão)
  | "pres_masc";     // Presença de resposta mascarada

export type Via = "aerea" | "ossea";
export type Orelha = "OD" | "OE";

export interface SimboloASHA {
  char: string;
  color: string;
  label: string;
}

export function getSimboloASHA(via: Via, orelha: Orelha, tipo: TipoResposta): SimboloASHA {
  const colorOD = "#e53e3e"; // vermelho
  const colorOE = "#3182ce"; // azul

  if (via === "aerea") {
    if (orelha === "OD") {
      switch (tipo) {
        case "pres_nao_masc": return { char: "O", color: colorOD, label: "Presença de resposta não mascarada" };
        case "pres_masc":     return { char: "△", color: colorOD, label: "Presença de resposta mascarada" };
        case "aus_nao_masc":  return { char: "∅", color: colorOD, label: "Ausência de resposta não mascarada" };
        case "aus_masc":      return { char: "△̄", color: colorOD, label: "Ausência de resposta mascarada" };
      }
    } else {
      switch (tipo) {
        case "pres_nao_masc": return { char: "X", color: colorOE, label: "Presença de resposta não mascarada" };
        case "pres_masc":     return { char: "□", color: colorOE, label: "Presença de resposta mascarada" };
        case "aus_nao_masc":  return { char: "✕", color: colorOE, label: "Ausência de resposta não mascarada" };
        case "aus_masc":      return { char: "□̄", color: colorOE, label: "Ausência de resposta mascarada" };
      }
    }
  } else {
    // Via óssea
    if (orelha === "OD") {
      switch (tipo) {
        case "pres_nao_masc": return { char: "<", color: colorOD, label: "Presença de resposta não mascarada" };
        case "pres_masc":     return { char: "[", color: colorOD, label: "Presença de resposta mascarada" };
        case "aus_nao_masc":  return { char: "↙", color: colorOD, label: "Ausência de resposta não mascarada" };
        case "aus_masc":      return { char: "⌊", color: colorOD, label: "Ausência de resposta mascarada" };
      }
    } else {
      switch (tipo) {
        case "pres_nao_masc": return { char: ">", color: colorOE, label: "Presença de resposta não mascarada" };
        case "pres_masc":     return { char: "]", color: colorOE, label: "Presença de resposta mascarada" };
        case "aus_nao_masc":  return { char: "↘", color: colorOE, label: "Ausência de resposta não mascarada" };
        case "aus_masc":      return { char: "⌋", color: colorOE, label: "Ausência de resposta mascarada" };
      }
    }
  }
  return { char: "O", color: colorOD, label: "" };
}

// Frequências da via aérea
export const FREQS_VA = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000] as const;
// Frequências da via óssea
export const FREQS_VO = [500, 1000, 2000, 3000, 4000] as const;

// Níveis de dB disponíveis no audiograma (-10 a 120, passo 5)
export const DB_LEVELS = [-10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120] as const;

export type FreqVA = typeof FREQS_VA[number];
export type FreqVO = typeof FREQS_VO[number];

// Metadados dos métodos de média para exibição
export const METODOS_MEDIA = [
  {
    id: "lloyd_kaplan_1978" as MetodoMedia,
    label: "Lloyd e Kaplan, 1978",
    descricao: "",
    suportaTritonal: true,
    suportaQuadritonal: true,
    freqsQuadritonal: [500, 1000, 2000, 3000],
  },
  {
    id: "northern_downs_2002" as MetodoMedia,
    label: "Northern e Downs, 2002",
    descricao: "Crianças de até 7 anos de idade",
    suportaTritonal: true,
    suportaQuadritonal: true,
    freqsQuadritonal: [500, 1000, 2000, 4000],
  },
  {
    id: "oms_2014" as MetodoMedia,
    label: "OMS 2014",
    descricao: "Crianças de até 7 anos de idade",
    suportaTritonal: true,
    suportaQuadritonal: true,
    freqsQuadritonal: [500, 1000, 2000, 4000],
  },
  {
    id: "oms_2020" as MetodoMedia,
    label: "OMS 2020",
    descricao: "",
    suportaTritonal: true,
    suportaQuadritonal: true,
    freqsQuadritonal: [500, 1000, 2000, 4000],
  },
  {
    id: "oms_2021" as MetodoMedia,
    label: "OMS 2021",
    descricao: "",
    suportaTritonal: true,
    suportaQuadritonal: true,
    freqsQuadritonal: [500, 1000, 2000, 4000],
  },
] as const;

/**
 * Converte os limiares da orelha direita para o formato LimiaresOrelha
 */
export function limiaresODFromExame(exame: Record<string, any>): LimiaresOrelha {
  return {
    hz250: exame.vaOD250,
    hz500: exame.vaOD500,
    hz1000: exame.vaOD1000,
    hz2000: exame.vaOD2000,
    hz3000: exame.vaOD3000,
    hz4000: exame.vaOD4000,
    hz6000: exame.vaOD6000,
    hz8000: exame.vaOD8000,
  };
}

export function limiaresOEFromExame(exame: Record<string, any>): LimiaresOrelha {
  return {
    hz250: exame.vaOE250,
    hz500: exame.vaOE500,
    hz1000: exame.vaOE1000,
    hz2000: exame.vaOE2000,
    hz3000: exame.vaOE3000,
    hz4000: exame.vaOE4000,
    hz6000: exame.vaOE6000,
    hz8000: exame.vaOE8000,
  };
}

/**
 * Calcula a idade em anos a partir da data de nascimento
 */
export function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}
