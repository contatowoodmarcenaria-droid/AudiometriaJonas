import { eq, and, desc, like, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  examesAudiometricos,
  pareceresModelo,
  configuracoesLaudo,
  colaboradores,
  empresas,
  exames,
  InsertExameAudiometrico,
  InsertParecerModelo,
  InsertConfiguracaoLaudo,
} from "../drizzle/schema";

// ─── Exames Audiométricos ──────────────────────────────────────────────────

export async function createExameAudiometrico(data: InsertExameAudiometrico) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(examesAudiometricos).values(data);
  return result;
}

export async function updateExameAudiometrico(id: number, userId: number, data: Partial<InsertExameAudiometrico>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(examesAudiometricos)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(examesAudiometricos.id, id), eq(examesAudiometricos.userId, userId)));
}

export async function getExameAudiometricoById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(examesAudiometricos)
    .where(and(eq(examesAudiometricos.id, id), eq(examesAudiometricos.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

export async function getExamesAudiometricosByColaborador(colaboradorId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(examesAudiometricos)
    .where(and(eq(examesAudiometricos.colaboradorId, colaboradorId), eq(examesAudiometricos.userId, userId)))
    .orderBy(desc(examesAudiometricos.dataRealizacao));
}

export async function getExamesAudiometricosByEmpresa(empresaId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      exame: examesAudiometricos,
      colaboradorNome: colaboradores.nome,
      colaboradorCpf: colaboradores.cpf,
      colaboradorCargo: colaboradores.cargo,
      colaboradorSetor: colaboradores.setor,
    })
    .from(examesAudiometricos)
    .leftJoin(colaboradores, eq(examesAudiometricos.colaboradorId, colaboradores.id))
    .where(and(eq(examesAudiometricos.empresaId, empresaId), eq(examesAudiometricos.userId, userId)))
    .orderBy(desc(examesAudiometricos.dataRealizacao));
}

export async function listExamesAudiometricos(userId: number, filters?: {
  empresaId?: number;
  colaboradorId?: number;
  status?: string;
  resultado?: string;
  motivo?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(examesAudiometricos.userId, userId)];
  if (filters?.empresaId) conditions.push(eq(examesAudiometricos.empresaId, filters.empresaId));
  if (filters?.colaboradorId) conditions.push(eq(examesAudiometricos.colaboradorId, filters.colaboradorId));
  if (filters?.status) conditions.push(eq(examesAudiometricos.status, filters.status as any));
  if (filters?.resultado) conditions.push(eq(examesAudiometricos.resultado, filters.resultado as any));
  if (filters?.motivo) conditions.push(eq(examesAudiometricos.motivoAvaliacao, filters.motivo as any));

  return db
    .select({
      exame: examesAudiometricos,
      colaboradorNome: colaboradores.nome,
      colaboradorCpf: colaboradores.cpf,
      colaboradorCargo: colaboradores.cargo,
      empresaNome: empresas.nome,
      empresaCnpj: empresas.cnpj,
    })
    .from(examesAudiometricos)
    .leftJoin(colaboradores, eq(examesAudiometricos.colaboradorId, colaboradores.id))
    .leftJoin(empresas, eq(examesAudiometricos.empresaId, empresas.id))
    .where(and(...conditions))
    .orderBy(desc(examesAudiometricos.dataRealizacao));
}

export async function deleteExameAudiometrico(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(examesAudiometricos)
    .where(and(eq(examesAudiometricos.id, id), eq(examesAudiometricos.userId, userId)));
}

// ─── Pareceres Modelo ──────────────────────────────────────────────────────

export async function createParecerModelo(data: InsertParecerModelo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(pareceresModelo).values(data);
  return result;
}

export async function updateParecerModelo(id: number, userId: number, data: Partial<InsertParecerModelo>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(pareceresModelo)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(pareceresModelo.id, id), eq(pareceresModelo.userId, userId)));
}

export async function listPareceresModelo(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(pareceresModelo)
    .where(eq(pareceresModelo.userId, userId))
    .orderBy(pareceresModelo.titulo);
}

export async function deleteParecerModelo(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(pareceresModelo)
    .where(and(eq(pareceresModelo.id, id), eq(pareceresModelo.userId, userId)));
}

// ─── Configurações de Laudo ────────────────────────────────────────────────

export async function getConfiguracaoLaudo(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(configuracoesLaudo)
    .where(eq(configuracoesLaudo.userId, userId))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertConfiguracaoLaudo(userId: number, data: Partial<InsertConfiguracaoLaudo>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getConfiguracaoLaudo(userId);
  if (existing) {
    await db
      .update(configuracoesLaudo)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(configuracoesLaudo.userId, userId));
  } else {
    await db.insert(configuracoesLaudo).values({ ...data, userId });
  }
}

// ─── Seed de pareceres padrão ──────────────────────────────────────────────

export const PARECERES_PADRAO = [
  {
    titulo: "Audição normal bilateral",
    texto: "Limiares auditivos dentro do padrão de normalidade bilateralmente.",
    categoria: "Normal",
  },
  {
    titulo: "Audição normal OD",
    texto: "Limiares auditivos dentro do padrão de normalidade para OD (Orelha Direita).",
    categoria: "Normal",
  },
  {
    titulo: "Audição normal OE",
    texto: "Limiares auditivos dentro do padrão de normalidade para OE (Orelha Esquerda).",
    categoria: "Normal",
  },
  {
    titulo: "Perda condutiva leve bilateral",
    texto: "Perda auditiva do tipo condutiva, de grau leve, bilateralmente.",
    categoria: "Condutiva",
  },
  {
    titulo: "Perda condutiva leve OD",
    texto: "Perda auditiva do tipo condutiva, de grau leve, na orelha direita.",
    categoria: "Condutiva",
  },
  {
    titulo: "Perda condutiva leve OE",
    texto: "Perda auditiva do tipo condutiva, de grau leve, na orelha esquerda.",
    categoria: "Condutiva",
  },
  {
    titulo: "Perda condutiva moderada bilateral",
    texto: "Perda auditiva do tipo condutiva, de grau moderado, bilateralmente.",
    categoria: "Condutiva",
  },
  {
    titulo: "Perda condutiva moderada OD",
    texto: "Perda auditiva do tipo condutiva, de grau moderado, na orelha direita.",
    categoria: "Condutiva",
  },
  {
    titulo: "Perda condutiva moderada OE",
    texto: "Perda auditiva do tipo condutiva, de grau moderado, na orelha esquerda.",
    categoria: "Condutiva",
  },
  {
    titulo: "Perda condutiva moderadamente severa bilateral",
    texto: "Perda auditiva do tipo condutiva, de grau moderadamente severo, bilateralmente.",
    categoria: "Condutiva",
  },
  {
    titulo: "Perda condutiva moderadamente severa OD",
    texto: "Perda auditiva do tipo condutiva, de grau moderadamente severo, na orelha direita.",
    categoria: "Condutiva",
  },
  {
    titulo: "Perda condutiva moderadamente severa OE",
    texto: "Perda auditiva do tipo condutiva, de grau moderadamente severo, na orelha esquerda.",
    categoria: "Condutiva",
  },
  {
    titulo: "Perda sensorioneural leve bilateral",
    texto: "Perda auditiva do tipo sensorioneural, de grau leve, bilateralmente.",
    categoria: "Sensorioneural",
  },
  {
    titulo: "Perda sensorioneural leve OD",
    texto: "Perda auditiva do tipo sensorioneural, de grau leve, na orelha direita.",
    categoria: "Sensorioneural",
  },
  {
    titulo: "Perda sensorioneural leve OE",
    texto: "Perda auditiva do tipo sensorioneural, de grau leve, na orelha esquerda.",
    categoria: "Sensorioneural",
  },
  {
    titulo: "Perda sensorioneural moderada bilateral",
    texto: "Perda auditiva do tipo sensorioneural, de grau moderado, bilateralmente.",
    categoria: "Sensorioneural",
  },
  {
    titulo: "Perda sensorioneural moderada OD",
    texto: "Perda auditiva do tipo sensorioneural, de grau moderado, na orelha direita.",
    categoria: "Sensorioneural",
  },
  {
    titulo: "Perda sensorioneural moderada OE",
    texto: "Perda auditiva do tipo sensorioneural, de grau moderado, na orelha esquerda.",
    categoria: "Sensorioneural",
  },
  {
    titulo: "Perda mista leve bilateral",
    texto: "Perda auditiva do tipo mista, de grau leve, bilateralmente.",
    categoria: "Mista",
  },
  {
    titulo: "PAIR - Perda Auditiva Induzida por Ruído",
    texto: "Perda auditiva do tipo sensorioneural, de grau leve a moderado, com entalhe audiométrico nas frequências de 3000, 4000 e/ou 6000 Hz, compatível com Perda Auditiva Induzida por Ruído (PAIR).",
    categoria: "Ocupacional",
  },
];
