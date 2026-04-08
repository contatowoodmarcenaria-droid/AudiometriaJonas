import React, { useMemo } from "react";
import type { TipoResposta, FreqVA, FreqVO } from "@/lib/audiometria-calculos";

// ─── Constantes do audiograma ─────────────────────────────────────────────────

const FREQS_DISPLAY = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
const DB_MIN = -10;
const DB_MAX = 120;
const DB_STEP = 10;

// Dimensões do SVG (viewBox — o SVG escala para preencher o container)
const MARGIN = { top: 48, right: 16, bottom: 28, left: 52 };
const WIDTH = 400;
const HEIGHT = 360;
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

// Mapeamento de frequência para posição X
function freqToX(freq: number): number {
  const freqs = FREQS_DISPLAY;
  const idx = freqs.indexOf(freq);
  if (idx === -1) return -1;
  return (idx / (freqs.length - 1)) * PLOT_W;
}

// Mapeamento de dB para posição Y
function dbToY(db: number): number {
  return ((db - DB_MIN) / (DB_MAX - DB_MIN)) * PLOT_H;
}

// ─── Símbolos ASHA 1990 ───────────────────────────────────────────────────────

type SymbolProps = {
  cx: number;
  cy: number;
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

// OD Via Aérea: Presença não mascarada = círculo vazio vermelho (O)
const CircleOpen = ({ cx, cy, size = 7, fill = "none", stroke = "#dc2626", strokeWidth = 2 }: SymbolProps) => (
  <circle cx={cx} cy={cy} r={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
);

// OD Via Aérea: Presença mascarada = triângulo vermelho (△)
const TriangleOpen = ({ cx, cy, size = 8, fill = "none", stroke = "#dc2626", strokeWidth = 2 }: SymbolProps) => {
  const h = size * 1.2;
  const pts = `${cx},${cy - h} ${cx - size},${cy + h * 0.5} ${cx + size},${cy + h * 0.5}`;
  return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
};

// OD Via Aérea: Ausência não mascarada = círculo com barra (⊘) vermelho
const CircleWithBar = ({ cx, cy, size = 7, stroke = "#dc2626", strokeWidth = 2 }: SymbolProps) => (
  <g>
    <circle cx={cx} cy={cy} r={size} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    <line x1={cx - size * 0.7} y1={cy + size * 0.7} x2={cx + size * 0.7} y2={cy - size * 0.7} stroke={stroke} strokeWidth={strokeWidth} />
  </g>
);

// OD Via Aérea: Ausência mascarada = triângulo com barra vermelho
const TriangleWithBar = ({ cx, cy, size = 8, stroke = "#dc2626", strokeWidth = 2 }: SymbolProps) => {
  const h = size * 1.2;
  const pts = `${cx},${cy - h} ${cx - size},${cy + h * 0.5} ${cx + size},${cy + h * 0.5}`;
  return (
    <g>
      <polygon points={pts} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
      <line x1={cx - size * 0.7} y1={cy + size * 0.7} x2={cx + size * 0.7} y2={cy - size * 0.7} stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  );
};

// OD Via Óssea: Presença não mascarada = seta para esquerda (<)
const ArrowLeft = ({ cx, cy, size = 8, stroke = "#dc2626", strokeWidth = 2 }: SymbolProps) => (
  <polyline
    points={`${cx + size},${cy - size} ${cx - size},${cy} ${cx + size},${cy + size}`}
    fill="none" stroke={stroke} strokeWidth={strokeWidth}
  />
);

// OD Via Óssea: Presença mascarada = colchete esquerdo ([)
const BracketLeft = ({ cx, cy, size = 7, stroke = "#dc2626", strokeWidth = 2 }: SymbolProps) => (
  <path d={`M${cx + size},${cy - size} L${cx - size},${cy - size} L${cx - size},${cy + size} L${cx + size},${cy + size}`}
    fill="none" stroke={stroke} strokeWidth={strokeWidth} />
);

// OD Via Óssea: Ausência não mascarada = seta esquerda com barra
const ArrowLeftWithBar = ({ cx, cy, size = 8, stroke = "#dc2626", strokeWidth = 2 }: SymbolProps) => (
  <g>
    <polyline points={`${cx + size},${cy - size} ${cx - size},${cy} ${cx + size},${cy + size}`}
      fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    <line x1={cx - size * 0.5} y1={cy + size * 0.7} x2={cx + size * 0.5} y2={cy - size * 0.7} stroke={stroke} strokeWidth={strokeWidth} />
  </g>
);

// OD Via Óssea: Ausência mascarada = colchete com barra
const BracketLeftWithBar = ({ cx, cy, size = 7, stroke = "#dc2626", strokeWidth = 2 }: SymbolProps) => (
  <g>
    <path d={`M${cx + size},${cy - size} L${cx - size},${cy - size} L${cx - size},${cy + size} L${cx + size},${cy + size}`}
      fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    <line x1={cx - size * 0.5} y1={cy + size * 0.7} x2={cx + size * 0.5} y2={cy - size * 0.7} stroke={stroke} strokeWidth={strokeWidth} />
  </g>
);

// OE Via Aérea: Presença não mascarada = X azul
const XMark = ({ cx, cy, size = 7, stroke = "#1d4ed8", strokeWidth = 2 }: SymbolProps) => (
  <g>
    <line x1={cx - size} y1={cy - size} x2={cx + size} y2={cy + size} stroke={stroke} strokeWidth={strokeWidth} />
    <line x1={cx + size} y1={cy - size} x2={cx - size} y2={cy + size} stroke={stroke} strokeWidth={strokeWidth} />
  </g>
);

// OE Via Aérea: Presença mascarada = quadrado azul vazio (□)
const SquareOpen = ({ cx, cy, size = 7, fill = "none", stroke = "#1d4ed8", strokeWidth = 2 }: SymbolProps) => (
  <rect x={cx - size} y={cy - size} width={size * 2} height={size * 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
);

// OE Via Aérea: Ausência não mascarada = X com barra azul
const XWithBar = ({ cx, cy, size = 7, stroke = "#1d4ed8", strokeWidth = 2 }: SymbolProps) => (
  <g>
    <line x1={cx - size} y1={cy - size} x2={cx + size} y2={cy + size} stroke={stroke} strokeWidth={strokeWidth} />
    <line x1={cx + size} y1={cy - size} x2={cx - size} y2={cy + size} stroke={stroke} strokeWidth={strokeWidth} />
    <line x1={cx - size * 0.7} y1={cy + size * 1.2} x2={cx + size * 0.7} y2={cy - size * 1.2} stroke={stroke} strokeWidth={strokeWidth} />
  </g>
);

// OE Via Aérea: Ausência mascarada = quadrado com barra azul
const SquareWithBar = ({ cx, cy, size = 7, stroke = "#1d4ed8", strokeWidth = 2 }: SymbolProps) => (
  <g>
    <rect x={cx - size} y={cy - size} width={size * 2} height={size * 2} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    <line x1={cx - size * 0.7} y1={cy + size * 0.7} x2={cx + size * 0.7} y2={cy - size * 0.7} stroke={stroke} strokeWidth={strokeWidth} />
  </g>
);

// OE Via Óssea: Presença não mascarada = seta para direita (>)
const ArrowRight = ({ cx, cy, size = 8, stroke = "#1d4ed8", strokeWidth = 2 }: SymbolProps) => (
  <polyline
    points={`${cx - size},${cy - size} ${cx + size},${cy} ${cx - size},${cy + size}`}
    fill="none" stroke={stroke} strokeWidth={strokeWidth}
  />
);

// OE Via Óssea: Presença mascarada = colchete direito (])
const BracketRight = ({ cx, cy, size = 7, stroke = "#1d4ed8", strokeWidth = 2 }: SymbolProps) => (
  <path d={`M${cx - size},${cy - size} L${cx + size},${cy - size} L${cx + size},${cy + size} L${cx - size},${cy + size}`}
    fill="none" stroke={stroke} strokeWidth={strokeWidth} />
);

// OE Via Óssea: Ausência não mascarada = seta direita com barra
const ArrowRightWithBar = ({ cx, cy, size = 8, stroke = "#1d4ed8", strokeWidth = 2 }: SymbolProps) => (
  <g>
    <polyline points={`${cx - size},${cy - size} ${cx + size},${cy} ${cx - size},${cy + size}`}
      fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    <line x1={cx - size * 0.5} y1={cy + size * 0.7} x2={cx + size * 0.5} y2={cy - size * 0.7} stroke={stroke} strokeWidth={strokeWidth} />
  </g>
);

// OE Via Óssea: Ausência mascarada = colchete direito com barra
const BracketRightWithBar = ({ cx, cy, size = 7, stroke = "#1d4ed8", strokeWidth = 2 }: SymbolProps) => (
  <g>
    <path d={`M${cx - size},${cy - size} L${cx + size},${cy - size} L${cx + size},${cy + size} L${cx - size},${cy + size}`}
      fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    <line x1={cx - size * 0.5} y1={cy + size * 0.7} x2={cx + size * 0.5} y2={cy - size * 0.7} stroke={stroke} strokeWidth={strokeWidth} />
  </g>
);

// ─── Função para renderizar símbolo baseado em orelha, via e tipo ─────────────

function renderSymbol(
  orelha: "OD" | "OE",
  via: "VA" | "VO",
  tipo: TipoResposta,
  cx: number,
  cy: number
): React.ReactNode {
  const key = `${cx}-${cy}`;
  if (orelha === "OD") {
    if (via === "VA") {
      switch (tipo) {
        case "pres_nao_masc": return <CircleOpen key={key} cx={cx} cy={cy} />;
        case "pres_masc": return <TriangleOpen key={key} cx={cx} cy={cy} />;
        case "aus_nao_masc": return <CircleWithBar key={key} cx={cx} cy={cy} />;
        case "aus_masc": return <TriangleWithBar key={key} cx={cx} cy={cy} />;
      }
    } else {
      switch (tipo) {
        case "pres_nao_masc": return <ArrowLeft key={key} cx={cx} cy={cy} />;
        case "pres_masc": return <BracketLeft key={key} cx={cx} cy={cy} />;
        case "aus_nao_masc": return <ArrowLeftWithBar key={key} cx={cx} cy={cy} />;
        case "aus_masc": return <BracketLeftWithBar key={key} cx={cx} cy={cy} />;
      }
    }
  } else {
    if (via === "VA") {
      switch (tipo) {
        case "pres_nao_masc": return <XMark key={key} cx={cx} cy={cy} />;
        case "pres_masc": return <SquareOpen key={key} cx={cx} cy={cy} />;
        case "aus_nao_masc": return <XWithBar key={key} cx={cx} cy={cy} />;
        case "aus_masc": return <SquareWithBar key={key} cx={cx} cy={cy} />;
      }
    } else {
      switch (tipo) {
        case "pres_nao_masc": return <ArrowRight key={key} cx={cx} cy={cy} />;
        case "pres_masc": return <BracketRight key={key} cx={cx} cy={cy} />;
        case "aus_nao_masc": return <ArrowRightWithBar key={key} cx={cx} cy={cy} />;
        case "aus_masc": return <BracketRightWithBar key={key} cx={cx} cy={cy} />;
      }
    }
  }
  return null;
}

// ─── Tipos do componente ──────────────────────────────────────────────────────

export type PontoAudiograma = {
  freq: number;
  db: number | null;
  tipo: TipoResposta;
};

type AudiogramaProps = {
  orelha: "OD" | "OE";
  pontosVA: PontoAudiograma[];
  pontosVO: PontoAudiograma[];
};

// ─── Componente Audiograma ────────────────────────────────────────────────────

export function Audiograma({ orelha, pontosVA, pontosVO }: AudiogramaProps) {
  const corLinha = orelha === "OD" ? "#dc2626" : "#1d4ed8";

  // Pontos válidos para linha VA
  const pontosVAValidos = useMemo(() =>
    pontosVA.filter(p => p.db !== null && FREQS_DISPLAY.includes(p.freq)),
    [pontosVA]
  );

  // Pontos válidos para linha VO
  const pontosVOValidos = useMemo(() =>
    pontosVO.filter(p => p.db !== null && FREQS_DISPLAY.includes(p.freq)),
    [pontosVO]
  );

  // Gerar polyline path para VA
  const vaLinePath = useMemo(() => {
    if (pontosVAValidos.length < 2) return "";
    return pontosVAValidos
      .map((p, i) => {
        const x = freqToX(p.freq) + MARGIN.left;
        const y = dbToY(p.db!) + MARGIN.top;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }, [pontosVAValidos]);

  // Gerar polyline path para VO (linha tracejada)
  const voLinePath = useMemo(() => {
    if (pontosVOValidos.length < 2) return "";
    return pontosVOValidos
      .map((p, i) => {
        const x = freqToX(p.freq) + MARGIN.left;
        const y = dbToY(p.db!) + MARGIN.top;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }, [pontosVOValidos]);

  // Linhas de grade
  const dbLevels = Array.from(
    { length: (DB_MAX - DB_MIN) / DB_STEP + 1 },
    (_, i) => DB_MIN + i * DB_STEP
  );

  return (
    <div className="border border-gray-300 rounded bg-white w-full flex justify-center">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto"
        style={{ maxWidth: '100%', display: 'block' }}
      >
        {/* Título frequências — DENTRO da área, logo acima da borda superior */}
        <text
          x={MARGIN.left + PLOT_W / 2}
          y={MARGIN.top - 22}
          textAnchor="middle"
          fontSize={9}
          fill="#555"
        >
          Frequência em Hertz (Hz)
        </text>

        {/* Rótulos de frequência — DENTRO da área, logo acima da borda superior */}
        {FREQS_DISPLAY.map((freq) => {
          const x = freqToX(freq) + MARGIN.left;
          const label = freq >= 1000 ? `${freq / 1000}k` : String(freq);
          return (
            <text key={freq} x={x} y={MARGIN.top - 8} textAnchor="middle" fontSize={10} fontWeight="600" fill="#374151">
              {label}
            </text>
          );
        })}

        {/* Rótulos de dB (eixo Y) — DENTRO da área, logo após a borda esquerda */}
        {dbLevels.map(db => {
          const y = dbToY(db) + MARGIN.top;
          return (
            <text key={db} x={MARGIN.left - 4} y={y + 3} textAnchor="end" fontSize={8} fill="#555">
              {db}
            </text>
          );
        })}

        {/* Título eixo Y — DENTRO da área, rotacionado na lateral esquerda */}
        <text
          x={MARGIN.left - 38}
          y={MARGIN.top + PLOT_H / 2}
          textAnchor="middle"
          fontSize={8}
          fill="#555"
          transform={`rotate(-90, ${MARGIN.left - 38}, ${MARGIN.top + PLOT_H / 2})`}
        >
          Nível de audição em decibel (dBNA)
        </text>

        {/* Grade horizontal */}
        {dbLevels.map(db => {
          const y = dbToY(db) + MARGIN.top;
          const isZero = db === 0;
          return (
            <line
              key={db}
              x1={MARGIN.left}
              y1={y}
              x2={MARGIN.left + PLOT_W}
              y2={y}
              stroke={isZero ? "#999" : "#e5e7eb"}
              strokeWidth={isZero ? 1 : 0.5}
              strokeDasharray={isZero ? "none" : "2,2"}
            />
          );
        })}

        {/* Grade vertical */}
        {FREQS_DISPLAY.map(freq => {
          const x = freqToX(freq) + MARGIN.left;
          return (
            <line
              key={freq}
              x1={x}
              y1={MARGIN.top}
              x2={x}
              y2={MARGIN.top + PLOT_H}
              stroke="#e5e7eb"
              strokeWidth={0.5}
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Borda do gráfico */}
        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={PLOT_W}
          height={PLOT_H}
          fill="none"
          stroke="#9ca3af"
          strokeWidth={1}
        />

        {/* Linha VA */}
        {vaLinePath && (
          <path
            d={vaLinePath}
            fill="none"
            stroke={corLinha}
            strokeWidth={1.5}
          />
        )}

        {/* Linha VO (tracejada) */}
        {voLinePath && (
          <path
            d={voLinePath}
            fill="none"
            stroke={corLinha}
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        )}

        {/* Símbolos VA */}
        {pontosVAValidos.map(p => {
          const x = freqToX(p.freq) + MARGIN.left;
          const y = dbToY(p.db!) + MARGIN.top;
          return renderSymbol(orelha, "VA", p.tipo, x, y);
        })}

        {/* Símbolos VO */}
        {pontosVOValidos.map(p => {
          const x = freqToX(p.freq) + MARGIN.left;
          const y = dbToY(p.db!) + MARGIN.top;
          return renderSymbol(orelha, "VO", p.tipo, x, y);
        })}

        {/* Rodapé */}
        <text
          x={MARGIN.left + PLOT_W / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          fontSize={8}
          fill="#777"
        >
          ASHA (1990)
        </text>
      </svg>
    </div>
  );
}

// ─── Legenda ASHA 1990 ────────────────────────────────────────────────────────

export function LegendaASHA() {
  const rows = [
    { label: "Presença de resposta não mascarada", od: <CircleOpen cx={12} cy={12} size={6} />, oe: <XMark cx={12} cy={12} size={6} /> },
    { label: "Presença de resposta mascarada", od: <TriangleOpen cx={12} cy={12} size={6} />, oe: <SquareOpen cx={12} cy={12} size={6} /> },
    { label: "Ausência de resposta não mascarada", od: <CircleWithBar cx={12} cy={12} size={6} />, oe: <XWithBar cx={12} cy={12} size={6} /> },
    { label: "Ausência de resposta mascarada", od: <TriangleWithBar cx={12} cy={12} size={6} />, oe: <SquareWithBar cx={12} cy={12} size={6} /> },
  ];

  const rowsVO = [
    { label: "Presença de resposta não mascarada", od: <ArrowLeft cx={12} cy={12} size={7} />, oe: <ArrowRight cx={12} cy={12} size={7} /> },
    { label: "Presença de resposta mascarada", od: <BracketLeft cx={12} cy={12} size={6} />, oe: <BracketRight cx={12} cy={12} size={6} /> },
    { label: "Ausência de resposta não mascarada", od: <ArrowLeftWithBar cx={12} cy={12} size={7} />, oe: <ArrowRightWithBar cx={12} cy={12} size={7} /> },
    { label: "Ausência de resposta mascarada", od: <BracketLeftWithBar cx={12} cy={12} size={6} />, oe: <BracketRightWithBar cx={12} cy={12} size={6} /> },
  ];

  const vaRows = [
    { label: "Pres. N.M.",  od: <CircleOpen cx={10} cy={10} size={5} />,       oe: <XMark cx={10} cy={10} size={5} /> },
    { label: "Pres. Masc.", od: <TriangleOpen cx={10} cy={10} size={5} />,     oe: <SquareOpen cx={10} cy={10} size={5} /> },
    { label: "Aus. N.M.",   od: <CircleWithBar cx={10} cy={10} size={5} />,    oe: <XWithBar cx={10} cy={10} size={5} /> },
    { label: "Aus. Masc.",  od: <TriangleWithBar cx={10} cy={10} size={5} />,  oe: <SquareWithBar cx={10} cy={10} size={5} /> },
  ];
  const voRows = [
    { label: "Pres. N.M.",  od: <ArrowLeft cx={10} cy={10} size={6} />,        oe: <ArrowRight cx={10} cy={10} size={6} /> },
    { label: "Pres. Masc.", od: <BracketLeft cx={10} cy={10} size={5} />,      oe: <BracketRight cx={10} cy={10} size={5} /> },
    { label: "Aus. N.M.",   od: <ArrowLeftWithBar cx={10} cy={10} size={6} />, oe: <ArrowRightWithBar cx={10} cy={10} size={6} /> },
    { label: "Aus. Masc.",  od: <BracketLeftWithBar cx={10} cy={10} size={5} />, oe: <BracketRightWithBar cx={10} cy={10} size={5} /> },
  ];

  const SvgCell = ({ children }: { children: React.ReactNode }) => (
    <td className="border border-gray-200 py-0.5 text-center" style={{ width: 28 }}>
      <svg width={20} height={20} viewBox="0 0 20 20">{children}</svg>
    </td>
  );

  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden text-[10px]">
      {/* Header */}
      <div className="bg-gray-700 text-white text-center font-bold py-1 text-[10px] tracking-wide">Legenda ASHA (1990)</div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-1 py-0.5 text-gray-500 font-semibold text-[9px] text-left" style={{ width: 38 }}>Via</th>
            <th className="border border-gray-200 px-1 py-0.5 text-gray-600 font-medium text-left">Descrição</th>
            <th className="border border-gray-200 py-0.5 text-center text-red-600 font-bold" style={{ width: 28 }}>OD</th>
            <th className="border border-gray-200 py-0.5 text-center text-blue-700 font-bold" style={{ width: 28 }}>OE</th>
          </tr>
        </thead>
        <tbody>
          {/* Via Aérea */}
          {vaRows.map((row, i) => (
            <tr key={`va-${i}`} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {i === 0 && (
                <td className="border border-gray-200 px-1 text-center font-bold text-gray-600 text-[9px] leading-tight" rowSpan={4}
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", width: 20 }}>
                  V.A.
                </td>
              )}
              <td className="border border-gray-200 px-1 py-0.5 text-gray-600">{row.label}</td>
              <SvgCell>{row.od}</SvgCell>
              <SvgCell>{row.oe}</SvgCell>
            </tr>
          ))}
          {/* Via Óssea */}
          {voRows.map((row, i) => (
            <tr key={`vo-${i}`} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {i === 0 && (
                <td className="border border-gray-200 px-1 text-center font-bold text-gray-600 text-[9px] leading-tight" rowSpan={4}
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", width: 20 }}>
                  V.O.
                </td>
              )}
              <td className="border border-gray-200 px-1 py-0.5 text-gray-600">{row.label}</td>
              <SvgCell>{row.od}</SvgCell>
              <SvgCell>{row.oe}</SvgCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
