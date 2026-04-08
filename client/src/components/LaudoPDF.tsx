import React from "react";
import { ExameAudiometrico } from "../../../drizzle/schema";

// Tipos para o laudo
export interface DadosLaudo {
  // Cabeçalho da empresa/clínica
  cabecalho?: {
    logoUrl?: string;
    nomeClinica?: string;
    endereco?: string;
    telefone?: string;
    cnpj?: string;
  };
  // Dados do exame
  exame: {
    empresa: string;
    cnpjCaepf: string;
    paciente: string;
    cpf: string;
    setor: string;
    dataNascimento: string;
    idade: number;
    funcao: string;
    sexo: string;
    audiometro: string;
    dataCalibracaoAudiometro: string;
    motivoAvaliacao: string;
    repousoAuditivo: string;
    repousoAuditivoObs?: string;
    queixa: boolean;
    queixaDescricao?: string;
    usaEpi: string;
    epiTipo?: string;
    meatoscopiaOd: string;
    meatoscopiaOe: string;
    // Limiares audiométricos
    limiares: {
      od: { [freq: string]: { va?: number; vaMasc?: number; vo?: number; voMasc?: number } };
      oe: { [freq: string]: { va?: number; vaMasc?: number; vo?: number; voMasc?: number } };
    };
    // Médias
    mediaOd: number | null;
    mediaOe: number | null;
    classificacaoOd: string;
    classificacaoOe: string;
    metodoMedia: string;
    // IRF
    irfOd?: { intensidade?: number; monossilabos?: number; dissilabos?: number; masc?: number };
    irfOe?: { intensidade?: number; monossilabos?: number; dissilabos?: number; masc?: number };
    lrfOd?: number;
    ldvOd?: number;
    mascOd?: number;
    lrfOe?: number;
    ldvOe?: number;
    mascOe?: number;
    // Mascaramento
    mascVaOdMin?: number;
    mascVaOdMax?: number;
    mascVoOdMin?: number;
    mascVoOdMax?: number;
    mascVaOeMin?: number;
    mascVaOeMax?: number;
    mascVoOeMin?: number;
    mascVoOeMax?: number;
    // Parecer
    parecerAudiologico: string;
    dataExame: string;
  };
  // Profissional
  profissional: {
    nome: string;
    titulo: string;
    crfa: string;
    assinaturaUrl?: string;
  };
}

// Frequências para o audiograma
const FREQS_VA = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
const FREQS_VO = [500, 1000, 2000, 3000, 4000];

// Símbolos ASHA 1990
const ASHA_SYMBOLS = {
  od: {
    va_nao_masc: "O",
    va_masc: "△",
    va_aus_nao_masc: "⊘",
    va_aus_masc: "△̶",
    vo_nao_masc: "<",
    vo_masc: "[",
    vo_aus_nao_masc: "⊘",
    vo_aus_masc: "⊘",
  },
  oe: {
    va_nao_masc: "X",
    va_masc: "□",
    va_aus_nao_masc: "⊗",
    va_aus_masc: "□̶",
    vo_nao_masc: ">",
    vo_masc: "]",
    vo_aus_nao_masc: "⊗",
    vo_aus_masc: "⊗",
  },
};

// Componente SVG do audiograma para o PDF
function AudiogramaSVG({
  lado,
  limiares,
  cor,
}: {
  lado: "od" | "oe";
  limiares: DadosLaudo["exame"]["limiares"]["od"];
  cor: string;
}) {
  const freqs = FREQS_VA;
  const width = 280;
  const height = 200;
  const marginLeft = 40;
  const marginTop = 20;
  const marginRight = 10;
  const marginBottom = 20;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const dBMin = -10;
  const dBMax = 120;
  const dBRange = dBMax - dBMin;

  const xPos = (freq: number) => {
    const idx = freqs.indexOf(freq);
    if (idx === -1) return 0;
    return marginLeft + (idx / (freqs.length - 1)) * plotWidth;
  };

  const yPos = (db: number) => {
    return marginTop + ((db - dBMin) / dBRange) * plotHeight;
  };

  // Construir path para via aérea
  const vaPoints: { x: number; y: number; freq: number }[] = [];
  freqs.forEach((freq) => {
    const val = limiares[freq]?.va;
    if (val !== undefined && val !== null) {
      vaPoints.push({ x: xPos(freq), y: yPos(val), freq });
    }
  });

  const vaPath =
    vaPoints.length > 1
      ? vaPoints
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ")
      : "";

  // Construir path para via óssea
  const voPoints: { x: number; y: number; freq: number }[] = [];
  FREQS_VO.forEach((freq) => {
    const val = limiares[freq]?.vo;
    if (val !== undefined && val !== null) {
      voPoints.push({ x: xPos(freq), y: yPos(val), freq });
    }
  });

  const voPath =
    voPoints.length > 1
      ? voPoints
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ")
      : "";

  const dBLevels = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
  const freqLabels = ["250", "500", "1k", "2k", "3k", "4k", "6k", "8k"];

  return (
    <svg width={width} height={height} style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Grade horizontal */}
      {dBLevels.map((db) => (
        <line
          key={db}
          x1={marginLeft}
          y1={yPos(db)}
          x2={width - marginRight}
          y2={yPos(db)}
          stroke={db === 0 ? "#666" : "#ddd"}
          strokeWidth={db === 0 ? 1 : 0.5}
          strokeDasharray={db === 0 ? "none" : "2,2"}
        />
      ))}

      {/* Grade vertical */}
      {freqs.map((freq, i) => (
        <line
          key={freq}
          x1={xPos(freq)}
          y1={marginTop}
          x2={xPos(freq)}
          y2={height - marginBottom}
          stroke="#ddd"
          strokeWidth={0.5}
          strokeDasharray="2,2"
        />
      ))}

      {/* Eixo Y (dB) */}
      <line
        x1={marginLeft}
        y1={marginTop}
        x2={marginLeft}
        y2={height - marginBottom}
        stroke="#333"
        strokeWidth={1}
      />

      {/* Eixo X (Hz) */}
      <line
        x1={marginLeft}
        y1={height - marginBottom}
        x2={width - marginRight}
        y2={height - marginBottom}
        stroke="#333"
        strokeWidth={1}
      />

      {/* Labels dB */}
      {dBLevels.map((db) => (
        <text
          key={db}
          x={marginLeft - 4}
          y={yPos(db) + 3}
          textAnchor="end"
          fontSize={7}
          fill="#555"
        >
          {db}
        </text>
      ))}

      {/* Labels Hz */}
      {freqs.map((freq, i) => (
        <text
          key={freq}
          x={xPos(freq)}
          y={marginTop - 5}
          textAnchor="middle"
          fontSize={7}
          fill="#555"
        >
          {freqLabels[i]}
        </text>
      ))}

      {/* Path Via Aérea */}
      {vaPath && (
        <path d={vaPath} fill="none" stroke={cor} strokeWidth={1.5} />
      )}

      {/* Símbolos Via Aérea */}
      {vaPoints.map((p) => (
        <text
          key={`va-${p.freq}`}
          x={p.x}
          y={p.y + 4}
          textAnchor="middle"
          fontSize={10}
          fill={cor}
          fontWeight="bold"
        >
          {lado === "od" ? "O" : "X"}
        </text>
      ))}

      {/* Path Via Óssea */}
      {voPath && (
        <path d={voPath} fill="none" stroke={cor} strokeWidth={1} strokeDasharray="4,2" />
      )}

      {/* Símbolos Via Óssea */}
      {voPoints.map((p) => (
        <text
          key={`vo-${p.freq}`}
          x={p.x}
          y={p.y + 4}
          textAnchor="middle"
          fontSize={10}
          fill={cor}
          fontWeight="bold"
        >
          {lado === "od" ? "<" : ">"}
        </text>
      ))}
    </svg>
  );
}

// Componente principal do laudo para impressão/PDF
export function LaudoPDF({ dados }: { dados: DadosLaudo }) {
  const { exame, profissional, cabecalho } = dados;

  const freqsVA = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
  const freqsVO = [500, 1000, 2000, 3000, 4000];

  return (
    <div
      id="laudo-pdf"
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        color: "#000",
        backgroundColor: "#fff",
        width: "210mm",
        minHeight: "297mm",
        padding: "10mm",
        boxSizing: "border-box",
        margin: "0 auto",
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #333",
          paddingBottom: "8px",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {cabecalho?.logoUrl && (
            <img
              src={cabecalho.logoUrl}
              alt="Logo"
              style={{ height: "50px", objectFit: "contain" }}
            />
          )}
          <div>
            {cabecalho?.nomeClinica && (
              <div style={{ fontWeight: "bold", fontSize: "12px" }}>
                {cabecalho.nomeClinica}
              </div>
            )}
            {cabecalho?.endereco && (
              <div style={{ fontSize: "9px" }}>{cabecalho.endereco}</div>
            )}
            {cabecalho?.telefone && (
              <div style={{ fontSize: "9px" }}>Tel: {cabecalho.telefone}</div>
            )}
            {cabecalho?.cnpj && (
              <div style={{ fontSize: "9px" }}>CNPJ: {cabecalho.cnpj}</div>
            )}
          </div>
        </div>
        <div
          style={{
            border: "2px solid #333",
            padding: "6px 12px",
            fontWeight: "bold",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          AVALIAÇÃO AUDIOLÓGICA
        </div>
      </div>

      {/* Seção 1: Identificação */}
      <div style={{ marginBottom: "6px" }}>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "10px",
            marginBottom: "4px",
            borderBottom: "1px solid #ccc",
          }}
        >
          1 - Identificação
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #999", padding: "2px 4px", width: "60%" }}>
                <strong>Empresa:</strong> {exame.empresa}
              </td>
              <td style={{ border: "1px solid #999", padding: "2px 4px" }}>
                <strong>CNPJ/CAEPF:</strong> {exame.cnpjCaepf}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #999", padding: "2px 4px" }}>
                <strong>Paciente:</strong> {exame.paciente}
              </td>
              <td style={{ border: "1px solid #999", padding: "2px 4px" }}>
                <strong>CPF:</strong> {exame.cpf}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #999", padding: "2px 4px" }}>
                <strong>Setor:</strong> {exame.setor}
              </td>
              <td style={{ border: "1px solid #999", padding: "2px 4px" }}>
                <strong>Data de Nascimento:</strong> {exame.dataNascimento} &nbsp;&nbsp;
                <strong>Idade:</strong> {exame.idade} anos
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #999", padding: "2px 4px" }}>
                <strong>Função:</strong> {exame.funcao}
              </td>
              <td style={{ border: "1px solid #999", padding: "2px 4px" }}>
                <strong>Sexo:</strong> {exame.sexo}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #999", padding: "2px 4px" }}>
                <strong>Audiômetro:</strong> {exame.audiometro}
              </td>
              <td style={{ border: "1px solid #999", padding: "2px 4px" }}>
                <strong>Data da Calibração:</strong> {exame.dataCalibracaoAudiometro}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Seção 2: Motivo da Avaliação */}
      <div style={{ marginBottom: "6px" }}>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "10px",
            marginBottom: "4px",
            borderBottom: "1px solid #ccc",
          }}
        >
          2 - Motivo da Avaliação
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #999", padding: "3px 6px", fontWeight: "bold" }}>
                    {exame.motivoAvaliacao}
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: "4px", fontSize: "9px" }}>
              <strong>Repouso Auditivo:</strong>{" "}
              {exame.repousoAuditivo === "maior_14h"
                ? "☑ Maior ou igual a 14 Horas  ☐ Menor de 14 Horas"
                : "☐ Maior ou igual a 14 Horas  ☑ Menor de 14 Horas"}{" "}
              {exame.repousoAuditivoObs && ` — ${exame.repousoAuditivoObs}`}
            </div>
            <div style={{ marginTop: "2px", fontSize: "9px" }}>
              <strong>Queixa:</strong>{" "}
              {exame.queixa ? `☑ Nega  ${exame.queixaDescricao || ""}` : "☑ Nega"}
            </div>
            <div style={{ marginTop: "2px", fontSize: "9px" }}>
              <strong>FAZ USO DE EPI:</strong>{" "}
              {exame.usaEpi === "nao"
                ? "☑ NÃO  ☐ SIM"
                : `☐ NÃO  ☑ SIM  QUAL: ${exame.epiTipo === "plug" ? "☑ PLUG  ☐ CONCHA" : "☐ PLUG  ☑ CONCHA"}`}
            </div>
          </div>
          <div>
            <table style={{ borderCollapse: "collapse", fontSize: "9px" }}>
              <thead>
                <tr>
                  <th
                    colSpan={2}
                    style={{
                      border: "1px solid #999",
                      padding: "2px 6px",
                      backgroundColor: "#e8e8e8",
                      textAlign: "center",
                    }}
                  >
                    MEATOSCOPIA
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #999", padding: "2px 6px", fontWeight: "bold" }}>
                    OD
                  </td>
                  <td
                    style={{
                      border: "1px solid #999",
                      padding: "2px 12px",
                      color:
                        exame.meatoscopiaOd === "NORMAL"
                          ? "#cc0000"
                          : "#cc6600",
                      fontWeight: "bold",
                    }}
                  >
                    {exame.meatoscopiaOd}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #999", padding: "2px 6px", fontWeight: "bold" }}>
                    OE
                  </td>
                  <td
                    style={{
                      border: "1px solid #999",
                      padding: "2px 12px",
                      color:
                        exame.meatoscopiaOe === "NORMAL"
                          ? "#cc0000"
                          : "#cc6600",
                      fontWeight: "bold",
                    }}
                  >
                    {exame.meatoscopiaOe}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Seção 3: Audiometria Tonal */}
      <div style={{ marginBottom: "6px" }}>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "10px",
            marginBottom: "4px",
            borderBottom: "1px solid #ccc",
            backgroundColor: "#e8e8e8",
            padding: "2px 4px",
          }}
        >
          AUDIOMETRIA TONAL
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}>
          {/* Audiograma OD */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                textAlign: "center",
                fontWeight: "bold",
                color: "#cc0000",
                fontSize: "11px",
                marginBottom: "4px",
              }}
            >
              Orelha Direita
            </div>
            <AudiogramaSVG lado="od" limiares={exame.limiares.od} cor="#cc0000" />
            <div style={{ fontSize: "9px", marginTop: "4px" }}>
              <strong>Média:</strong>{" "}
              {exame.mediaOd !== null ? `${exame.mediaOd.toFixed(2)} dB` : "—"} &nbsp;
              <em style={{ color: "#155dfc" }}>{exame.classificacaoOd}</em>
            </div>
            <div style={{ fontSize: "8px", color: "#555" }}>
              LRF: {exame.lrfOd ?? "—"} &nbsp; LDV: {exame.ldvOd ?? "—"} &nbsp; MASC:{" "}
              {exame.mascOd ?? "—"}
            </div>
          </div>

          {/* Legenda ASHA */}
          <div style={{ width: "160px" }}>
            <table
              style={{
                borderCollapse: "collapse",
                fontSize: "8px",
                width: "100%",
                marginTop: "20px",
              }}
            >
              <thead>
                <tr>
                  <th
                    colSpan={3}
                    style={{
                      border: "1px solid #999",
                      padding: "2px",
                      textAlign: "center",
                      backgroundColor: "#f0f0f0",
                    }}
                  >
                    Legenda ASHA (1990)
                  </th>
                  <th style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    OD
                  </th>
                  <th style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    OE
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "VIA AÉREA",
                    rows: [
                      { desc: "Presença de resposta não mascarada", od: "O", oe: "X" },
                      { desc: "Presença de resposta mascarada", od: "△", oe: "□" },
                      { desc: "Ausência de resposta não mascarada", od: "⊘", oe: "⊗" },
                      { desc: "Ausência de resposta mascarada", od: "△̶", oe: "□̶" },
                    ],
                  },
                  {
                    label: "VIA ÓSSEA",
                    rows: [
                      { desc: "Presença de resposta não mascarada", od: "<", oe: ">" },
                      { desc: "Presença de resposta mascarada", od: "[", oe: "]" },
                      { desc: "Ausência de resposta não mascarada", od: "⊘", oe: "⊗" },
                      { desc: "Ausência de resposta mascarada", od: "⊘", oe: "⊗" },
                    ],
                  },
                ].map((section) =>
                  section.rows.map((row, i) => (
                    <tr key={`${section.label}-${i}`}>
                      {i === 0 && (
                        <td
                          rowSpan={section.rows.length}
                          style={{
                            border: "1px solid #999",
                            padding: "2px",
                            fontWeight: "bold",
                            fontSize: "7px",
                            verticalAlign: "middle",
                            textAlign: "center",
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                          }}
                        >
                          {section.label}
                        </td>
                      )}
                      <td style={{ border: "1px solid #999", padding: "1px 2px", fontSize: "7px" }}>
                        {row.desc}
                      </td>
                      <td
                        style={{
                          border: "1px solid #999",
                          padding: "1px 4px",
                          textAlign: "center",
                          color: "#cc0000",
                          fontWeight: "bold",
                        }}
                      >
                        {row.od}
                      </td>
                      <td
                        style={{
                          border: "1px solid #999",
                          padding: "1px 4px",
                          textAlign: "center",
                          color: "#0000cc",
                          fontWeight: "bold",
                        }}
                      >
                        {row.oe}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Audiograma OE */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                textAlign: "center",
                fontWeight: "bold",
                color: "#0000cc",
                fontSize: "11px",
                marginBottom: "4px",
              }}
            >
              Orelha Esquerda
            </div>
            <AudiogramaSVG lado="oe" limiares={exame.limiares.oe} cor="#0000cc" />
            <div style={{ fontSize: "9px", marginTop: "4px" }}>
              <strong>Média:</strong>{" "}
              {exame.mediaOe !== null ? `${exame.mediaOe.toFixed(2)} dB` : "—"} &nbsp;
              <em style={{ color: "#155dfc" }}>{exame.classificacaoOe}</em>
            </div>
            <div style={{ fontSize: "8px", color: "#555" }}>
              LRF: {exame.lrfOe ?? "—"} &nbsp; LDV: {exame.ldvOe ?? "—"} &nbsp; MASC:{" "}
              {exame.mascOe ?? "—"}
            </div>
          </div>
        </div>

        {/* Tabela de limiares numéricos */}
        <div style={{ marginTop: "8px" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {/* OD */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "#cc0000",
                  fontSize: "9px",
                  marginBottom: "2px",
                }}
              >
                Orelha Direita
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8px" }}>
                <thead>
                  <tr>
                    <td
                      style={{
                        border: "1px solid #999",
                        padding: "1px 2px",
                        backgroundColor: "#cc0000",
                        color: "#fff",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      F. Hz
                    </td>
                    {freqsVA.map((f) => (
                      <td
                        key={f}
                        style={{
                          border: "1px solid #999",
                          padding: "1px 2px",
                          backgroundColor: "#cc0000",
                          color: "#fff",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {f >= 1000 ? `${f / 1000}k` : f}
                      </td>
                    ))}
                    <td
                      style={{
                        border: "1px solid #999",
                        padding: "1px 2px",
                        backgroundColor: "#cc0000",
                        color: "#fff",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Logo
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #999", padding: "1px 2px", fontWeight: "bold" }}>
                      VO
                    </td>
                    {freqsVA.map((f) => (
                      <td
                        key={f}
                        style={{ border: "1px solid #999", padding: "1px 2px", textAlign: "center" }}
                      >
                        {freqsVO.includes(f) ? (exame.limiares.od[f]?.vo ?? "") : ""}
                      </td>
                    ))}
                    <td style={{ border: "1px solid #999", padding: "1px 2px" }}></td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #999", padding: "1px 2px", fontWeight: "bold" }}>
                      VA
                    </td>
                    {freqsVA.map((f) => (
                      <td
                        key={f}
                        style={{ border: "1px solid #999", padding: "1px 2px", textAlign: "center" }}
                      >
                        {exame.limiares.od[f]?.va ?? ""}
                      </td>
                    ))}
                    <td style={{ border: "1px solid #999", padding: "1px 2px" }}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* OE */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "#0000cc",
                  fontSize: "9px",
                  marginBottom: "2px",
                }}
              >
                Orelha Esquerda
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8px" }}>
                <thead>
                  <tr>
                    {freqsVA.map((f) => (
                      <td
                        key={f}
                        style={{
                          border: "1px solid #999",
                          padding: "1px 2px",
                          backgroundColor: "#0000cc",
                          color: "#fff",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {f >= 1000 ? `${f / 1000}k` : f}
                      </td>
                    ))}
                    <td
                      style={{
                        border: "1px solid #999",
                        padding: "1px 2px",
                        backgroundColor: "#0000cc",
                        color: "#fff",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Logo
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {freqsVA.map((f) => (
                      <td
                        key={f}
                        style={{ border: "1px solid #999", padding: "1px 2px", textAlign: "center" }}
                      >
                        {freqsVO.includes(f) ? (exame.limiares.oe[f]?.vo ?? "") : ""}
                      </td>
                    ))}
                    <td style={{ border: "1px solid #999", padding: "1px 2px" }}></td>
                  </tr>
                  <tr>
                    {freqsVA.map((f) => (
                      <td
                        key={f}
                        style={{ border: "1px solid #999", padding: "1px 2px", textAlign: "center" }}
                      >
                        {exame.limiares.oe[f]?.va ?? ""}
                      </td>
                    ))}
                    <td style={{ border: "1px solid #999", padding: "1px 2px" }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 4: IRF e Mascaramento */}
      <div style={{ marginBottom: "6px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {/* IRF */}
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
              <thead>
                <tr>
                  <th
                    colSpan={5}
                    style={{
                      border: "1px solid #999",
                      padding: "2px",
                      textAlign: "center",
                      backgroundColor: "#f0f0f0",
                    }}
                  >
                    Índice de Reconhecimento de Fala
                  </th>
                </tr>
                <tr>
                  <th style={{ border: "1px solid #999", padding: "2px" }}></th>
                  <th style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    Intensidade
                  </th>
                  <th style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    Monossílabos
                  </th>
                  <th style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    Dissílabos
                  </th>
                  <th style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    Masc.
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #999", padding: "2px", fontWeight: "bold" }}>
                    OD
                  </td>
                  <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    {exame.irfOd?.intensidade ?? ""}
                  </td>
                  <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    {exame.irfOd?.monossilabos ?? ""}
                  </td>
                  <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    {exame.irfOd?.dissilabos ?? ""}
                  </td>
                  <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    {exame.irfOd?.masc ?? ""}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #999", padding: "2px", fontWeight: "bold" }}>
                    OE
                  </td>
                  <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    {exame.irfOe?.intensidade ?? ""}
                  </td>
                  <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    {exame.irfOe?.monossilabos ?? ""}
                  </td>
                  <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    {exame.irfOe?.dissilabos ?? ""}
                  </td>
                  <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                    {exame.irfOe?.masc ?? ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mascaramento */}
          <div>
            <div style={{ display: "flex", gap: "4px" }}>
              <table style={{ borderCollapse: "collapse", fontSize: "8px" }}>
                <thead>
                  <tr>
                    <th
                      colSpan={3}
                      style={{
                        border: "1px solid #999",
                        padding: "2px 4px",
                        backgroundColor: "#cc0000",
                        color: "#fff",
                        textAlign: "center",
                      }}
                    >
                      OD
                    </th>
                  </tr>
                  <tr>
                    <th style={{ border: "1px solid #999", padding: "2px" }}></th>
                    <th
                      style={{
                        border: "1px solid #999",
                        padding: "2px",
                        backgroundColor: "#cc0000",
                        color: "#fff",
                      }}
                    >
                      Min
                    </th>
                    <th
                      style={{
                        border: "1px solid #999",
                        padding: "2px",
                        backgroundColor: "#cc0000",
                        color: "#fff",
                      }}
                    >
                      Max
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #999", padding: "2px", fontWeight: "bold" }}>
                      VA
                    </td>
                    <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                      {exame.mascVaOdMin ?? ""}
                    </td>
                    <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                      {exame.mascVaOdMax ?? ""}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #999", padding: "2px", fontWeight: "bold" }}>
                      VO
                    </td>
                    <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                      {exame.mascVoOdMin ?? ""}
                    </td>
                    <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                      {exame.mascVoOdMax ?? ""}
                    </td>
                  </tr>
                </tbody>
              </table>

              <table style={{ borderCollapse: "collapse", fontSize: "8px" }}>
                <thead>
                  <tr>
                    <th
                      colSpan={3}
                      style={{
                        border: "1px solid #999",
                        padding: "2px 4px",
                        backgroundColor: "#0000cc",
                        color: "#fff",
                        textAlign: "center",
                      }}
                    >
                      OE
                    </th>
                  </tr>
                  <tr>
                    <th style={{ border: "1px solid #999", padding: "2px" }}></th>
                    <th
                      style={{
                        border: "1px solid #999",
                        padding: "2px",
                        backgroundColor: "#0000cc",
                        color: "#fff",
                      }}
                    >
                      Min
                    </th>
                    <th
                      style={{
                        border: "1px solid #999",
                        padding: "2px",
                        backgroundColor: "#0000cc",
                        color: "#fff",
                      }}
                    >
                      Max
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #999", padding: "2px", fontWeight: "bold" }}>
                      VA
                    </td>
                    <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                      {exame.mascVaOeMin ?? ""}
                    </td>
                    <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                      {exame.mascVaOeMax ?? ""}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #999", padding: "2px", fontWeight: "bold" }}>
                      VO
                    </td>
                    <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                      {exame.mascVoOeMin ?? ""}
                    </td>
                    <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }}>
                      {exame.mascVoOeMax ?? ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 5: Parecer Audiológico */}
      <div style={{ marginBottom: "8px" }}>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "10px",
            marginBottom: "4px",
          }}
        >
          Parecer Audiológico:
        </div>
        <div
          style={{
            border: "1px solid #999",
            padding: "6px",
            minHeight: "60px",
            fontSize: "9px",
            lineHeight: "1.5",
            whiteSpace: "pre-wrap",
          }}
        >
          {exame.parecerAudiologico}
        </div>
      </div>

      {/* Seção 6: Assinaturas */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: "16px",
          borderTop: "1px solid #ccc",
          paddingTop: "8px",
        }}
      >
        {/* Assinatura do paciente */}
        <div style={{ flex: 1, borderRight: "1px solid #ccc", paddingRight: "16px" }}>
          <div
            style={{
              borderTop: "1px solid #333",
              marginTop: "40px",
              paddingTop: "4px",
              fontSize: "9px",
              textAlign: "center",
            }}
          >
            Assinatura do(a) Paciente
          </div>
          <div style={{ marginTop: "8px", fontSize: "9px" }}>
            <strong>Data de realização do exame:</strong> {exame.dataExame}
          </div>
        </div>

        {/* Assinatura do profissional */}
        <div style={{ flex: 1, paddingLeft: "16px", textAlign: "center" }}>
          {profissional.assinaturaUrl ? (
            <img
              src={profissional.assinaturaUrl}
              alt="Assinatura"
              style={{ maxHeight: "50px", maxWidth: "150px", objectFit: "contain" }}
            />
          ) : (
            <div style={{ height: "40px" }}></div>
          )}
          <div
            style={{
              borderTop: "1px solid #333",
              paddingTop: "4px",
              fontSize: "10px",
              fontWeight: "bold",
            }}
          >
            {profissional.nome}
          </div>
          <div style={{ fontSize: "9px" }}>{profissional.titulo}</div>
          <div style={{ fontSize: "9px" }}>CRFa {profissional.crfa}</div>
          <div style={{ marginTop: "4px", fontSize: "8px", color: "#555" }}>
            Fonoaudiólogo(a): {profissional.nome}
          </div>
          <div style={{ fontSize: "8px", color: "#555" }}>CRFA: {profissional.crfa}</div>
        </div>
      </div>
    </div>
  );
}

export default LaudoPDF;
