import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  alertas,
  colaboradores,
  empresas,
  exames,
  users,
  type InsertAlerta,
  type InsertColaborador,
  type InsertEmpresa,
  type InsertExame,
  type InsertUser,
} from "../drizzle/schema";

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ---- Users ----
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    // For name: on conflict, only fill if the existing DB value is NULL.
    // This prevents external auth providers (Supabase) from overwriting
    // a name the user explicitly set via updateUserProfile.
    const conflictSet: Record<string, unknown> = { ...updateSet };
    if ("name" in conflictSet && values.name !== undefined) {
      conflictSet.name = sql`COALESCE(${users.name}, ${values.name as string | null})`;
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: conflictSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: { name: string; email: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const openId = `email_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: 'email',
    lastSignedIn: new Date(),
  });
  const created = await getUserByEmail(data.email);
  return created;
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: { name?: string; specialty?: string; crfa?: string; phone?: string; email?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

// ---- Empresas ----
export async function getEmpresas(userId: number, filters?: { nome?: string; cnpj?: string; responsavel?: string; status?: string; setor?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(empresas.userId, userId)];
  if (filters?.nome) conditions.push(like(empresas.nome, `%${filters.nome}%`));
  if (filters?.cnpj) conditions.push(like(empresas.cnpj, `%${filters.cnpj}%`));
  if (filters?.responsavel) conditions.push(like(empresas.responsavel, `%${filters.responsavel}%`));
  if (filters?.status) conditions.push(eq(empresas.status, filters.status as any));
  if (filters?.setor) conditions.push(like(empresas.setor, `%${filters.setor}%`));
  return db.select().from(empresas).where(and(...conditions)).orderBy(desc(empresas.updatedAt));
}

export async function getEmpresaById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(empresas).where(and(eq(empresas.id, id), eq(empresas.userId, userId))).limit(1);
  return result[0];
}

export async function createEmpresa(data: InsertEmpresa) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(empresas).values(data).returning({ id: empresas.id });
  return result[0];
}

export async function updateEmpresa(id: number, userId: number, data: Partial<InsertEmpresa>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(empresas).set(data).where(and(eq(empresas.id, id), eq(empresas.userId, userId)));
}

export async function deleteEmpresa(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(empresas).where(and(eq(empresas.id, id), eq(empresas.userId, userId)));
}

export async function getEmpresasStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, comPendencias: 0, examesAVencer: 0, audiometriasPendentes: 0 };
  const total = await db.select({ count: sql<number>`count(*)` }).from(empresas).where(eq(empresas.userId, userId));
  const comPendencias = await db.select({ count: sql<number>`count(*)` }).from(empresas).where(and(eq(empresas.userId, userId), eq(empresas.status, "pendente")));
  const atencao = await db.select({ count: sql<number>`count(*)` }).from(empresas).where(and(eq(empresas.userId, userId), eq(empresas.status, "atencao")));
  return {
    total: Number(total[0]?.count ?? 0),
    comPendencias: Number(comPendencias[0]?.count ?? 0),
    examesAVencer: Number(atencao[0]?.count ?? 0),
    audiometriasPendentes: 0,
  };
}

// ---- Colaboradores ----
export async function getColaboradores(userId: number, filters?: { nome?: string; empresaId?: number; status?: string; cargo?: string; busca?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(colaboradores.userId, userId)];
  if (filters?.nome) conditions.push(like(colaboradores.nome, `%${filters.nome}%`));
  if (filters?.empresaId) conditions.push(eq(colaboradores.empresaId, filters.empresaId));
  if (filters?.status) conditions.push(eq(colaboradores.status, filters.status as any));
  if (filters?.cargo) conditions.push(like(colaboradores.cargo, `%${filters.cargo}%`));
  if (filters?.busca) {
    conditions.push(
      or(
        like(colaboradores.nome, `%${filters.busca}%`),
        like(colaboradores.codigo, `%${filters.busca}%`)
      )!
    );
  }
  return db.select().from(colaboradores).where(and(...conditions)).orderBy(desc(colaboradores.updatedAt));
}

export async function getNextCodigoColaborador(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) return "COL-0001";
  const result = await db
    .select({ codigo: colaboradores.codigo })
    .from(colaboradores)
    .where(and(eq(colaboradores.userId, userId), sql`${colaboradores.codigo} IS NOT NULL`))
    .orderBy(desc(colaboradores.codigo))
    .limit(1);
  let seq = 1;
  if (result.length > 0 && result[0].codigo) {
    const num = parseInt(result[0].codigo.replace("COL-", ""), 10);
    if (!Number.isNaN(num)) seq = num + 1;
  }
  return "COL-" + String(seq).padStart(4, "0");
}

export async function getColaboradorById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(colaboradores).where(and(eq(colaboradores.id, id), eq(colaboradores.userId, userId))).limit(1);
  return result[0];
}

export async function createColaborador(data: InsertColaborador) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(colaboradores).values(data).returning({ id: colaboradores.id });
}

export async function updateColaborador(id: number, userId: number, data: Partial<InsertColaborador>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(colaboradores).set(data).where(and(eq(colaboradores.id, id), eq(colaboradores.userId, userId)));
}

export async function deleteColaborador(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(colaboradores).where(and(eq(colaboradores.id, id), eq(colaboradores.userId, userId)));
}

export async function getColaboradoresStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, ativos: 0, inativos: 0, afastados: 0 };
  const total = await db.select({ count: sql<number>`count(*)` }).from(colaboradores).where(eq(colaboradores.userId, userId));
  const ativos = await db.select({ count: sql<number>`count(*)` }).from(colaboradores).where(and(eq(colaboradores.userId, userId), eq(colaboradores.status, "ativo")));
  return {
    total: Number(total[0]?.count ?? 0),
    ativos: Number(ativos[0]?.count ?? 0),
    inativos: 0,
    afastados: 0,
  };
}

// ---- Exames ----
export async function getExames(userId: number, filters?: { colaboradorId?: number; empresaId?: number; status?: string; resultado?: string; tipo?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(exames.userId, userId)];
  if (filters?.colaboradorId) conditions.push(eq(exames.colaboradorId, filters.colaboradorId));
  if (filters?.empresaId) conditions.push(eq(exames.empresaId, filters.empresaId));
  if (filters?.status) conditions.push(eq(exames.status, filters.status as any));
  if (filters?.resultado) conditions.push(eq(exames.resultado, filters.resultado as any));
  if (filters?.tipo) conditions.push(eq(exames.tipo, filters.tipo as any));
  return db.select().from(exames).where(and(...conditions)).orderBy(desc(exames.dataRealizacao));
}

export async function getExameById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(exames).where(and(eq(exames.id, id), eq(exames.userId, userId))).limit(1);
  return result[0];
}

export async function createExame(data: InsertExame) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(exames).values(data).returning({ id: exames.id });
}

export async function updateExame(id: number, userId: number, data: Partial<InsertExame>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(exames).set(data).where(and(eq(exames.id, id), eq(exames.userId, userId)));
}

export async function deleteExame(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(exames).where(and(eq(exames.id, id), eq(exames.userId, userId)));
}

export async function getExamesStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, realizados: 0, alteracoes: 0, vencidos: 0, pendentes: 0 };
  const total = await db.select({ count: sql<number>`count(*)` }).from(exames).where(eq(exames.userId, userId));
  const realizados = await db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.userId, userId), eq(exames.status, "realizado")));
  const alteracoes = await db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.userId, userId), eq(exames.resultado, "alteracao")));
  const vencidos = await db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.userId, userId), eq(exames.status, "vencido")));
  const pendentes = await db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.userId, userId), eq(exames.status, "pendente")));
  return {
    total: Number(total[0]?.count ?? 0),
    realizados: Number(realizados[0]?.count ?? 0),
    alteracoes: Number(alteracoes[0]?.count ?? 0),
    vencidos: Number(vencidos[0]?.count ?? 0),
    pendentes: Number(pendentes[0]?.count ?? 0),
  };
}

// ---- Alertas ----
export async function getAlertas(userId: number, lido?: boolean) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(alertas.userId, userId)];
  if (lido !== undefined) conditions.push(eq(alertas.lido, lido));
  return db.select().from(alertas).where(and(...conditions)).orderBy(desc(alertas.createdAt)).limit(20);
}

export async function marcarAlertaLido(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alertas).set({ lido: true }).where(and(eq(alertas.id, id), eq(alertas.userId, userId)));
}

export async function createAlerta(data: InsertAlerta) {
  const db = await getDb();
  if (!db) return;
  await db.insert(alertas).values(data);
}

// ---- Dashboard Stats ----
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { empresas: 0, colaboradores: 0, examesRealizados: 0, examesVencidos: 0, examesPendentes: 0, alteracoes: 0 };
  const [empTotal, colTotal, exTotal, exVencidos, exPendentes, exAlteracoes] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(empresas).where(eq(empresas.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(colaboradores).where(eq(colaboradores.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(exames).where(eq(exames.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.userId, userId), eq(exames.status, "vencido"))),
    db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.userId, userId), eq(exames.status, "pendente"))),
    db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.userId, userId), eq(exames.resultado, "alteracao"))),
  ]);
  return {
    empresas: Number(empTotal[0]?.count ?? 0),
    colaboradores: Number(colTotal[0]?.count ?? 0),
    examesRealizados: Number(exTotal[0]?.count ?? 0),
    examesVencidos: Number(exVencidos[0]?.count ?? 0),
    examesPendentes: Number(exPendentes[0]?.count ?? 0),
    alteracoes: Number(exAlteracoes[0]?.count ?? 0),
  };
}

export async function getRecentExames(userId: number, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: exames.id,
      tipo: exames.tipo,
      dataRealizacao: exames.dataRealizacao,
      dataVencimento: exames.dataVencimento,
      resultado: exames.resultado,
      status: exames.status,
      colaboradorNome: colaboradores.nome,
      empresaNome: empresas.nome,
    })
    .from(exames)
    .leftJoin(colaboradores, eq(exames.colaboradorId, colaboradores.id))
    .leftJoin(empresas, eq(exames.empresaId, empresas.id))
    .where(eq(exames.userId, userId))
    .orderBy(desc(exames.dataRealizacao))
    .limit(limit);
}

export async function getEmpresasComColaboradoresEExames(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const empList = await db.select().from(empresas).where(eq(empresas.userId, userId)).orderBy(desc(empresas.updatedAt));
  const result = await Promise.all(
    empList.map(async (emp) => {
      const [colCount, exCount, pendCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(colaboradores).where(and(eq(colaboradores.empresaId, emp.id), eq(colaboradores.userId, userId))),
        db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.empresaId, emp.id), eq(exames.userId, userId))),
        db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.empresaId, emp.id), eq(exames.userId, userId), eq(exames.status, "vencido"))),
      ]);
      return {
        ...emp,
        totalColaboradores: Number(colCount[0]?.count ?? 0),
        totalExames: Number(exCount[0]?.count ?? 0),
        examesPendentes: Number(pendCount[0]?.count ?? 0),
      };
    })
  );
  return result;
}

// ---- Relatórios ----

export async function getExamesPorMes(userId: number, meses = 6) {
  const db = await getDb();
  if (!db) return [];

  const dataInicio = new Date();
  dataInicio.setMonth(dataInicio.getMonth() - meses + 1);
  dataInicio.setDate(1);
  const dataInicioStr = dataInicio.toISOString().slice(0, 10);

  const rows = await db
    .select({
      dataRealizacao: exames.dataRealizacao,
      resultado: exames.resultado,
      status: exames.status,
    })
    .from(exames)
    .where(and(eq(exames.userId, userId), sql`${exames.dataRealizacao} >= ${dataInicioStr}`))
    .orderBy(exames.dataRealizacao);

  const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const agrupado: Record<string, { mes: string; realizados: number; alteracoes: number }> = {};

  for (let i = 0; i < meses; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (meses - 1) + i);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    agrupado[chave] = { mes: mesesNomes[d.getMonth()], realizados: 0, alteracoes: 0 };
  }

  for (const row of rows) {
    if (!row.dataRealizacao) continue;
    const chave = row.dataRealizacao.slice(0, 7);
    if (agrupado[chave]) {
      agrupado[chave].realizados++;
      if (row.resultado === "alteracao" || row.resultado === "perda_leve" || row.resultado === "perda_moderada" || row.resultado === "perda_severa") {
        agrupado[chave].alteracoes++;
      }
    }
  }

  return Object.values(agrupado);
}

export async function getDistribuicaoResultados(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      resultado: exames.resultado,
      count: sql<number>`count(*)`,
    })
    .from(exames)
    .where(eq(exames.userId, userId))
    .groupBy(exames.resultado);

  const total = rows.reduce((acc, r) => acc + Number(r.count), 0);
  if (total === 0) return [];

  const labelMap: Record<string, { name: string; color: string }> = {
    normal: { name: "Normal", color: "#00a63e" },
    alteracao: { name: "Alteração", color: "#f59e0b" },
    perda_leve: { name: "Perda Leve", color: "#ef4444" },
    perda_moderada: { name: "Perda Moderada", color: "#dc2626" },
    perda_severa: { name: "Perda Severa", color: "#991b1b" },
  };

  return rows.map((r) => {
    const key = r.resultado ?? "normal";
    const meta = labelMap[key] ?? { name: key, color: "#6a7282" };
    return {
      name: meta.name,
      value: Math.round((Number(r.count) / total) * 100),
      color: meta.color,
      count: Number(r.count),
    };
  });
}

export async function getEmpresasParaRelatorio(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const empList = await db.select().from(empresas).where(eq(empresas.userId, userId)).orderBy(desc(empresas.updatedAt));

  const result = await Promise.all(
    empList.map(async (emp) => {
      const [colCount, exCount, altCount, pendCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(colaboradores).where(and(eq(colaboradores.empresaId, emp.id), eq(colaboradores.userId, userId))),
        db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.empresaId, emp.id), eq(exames.userId, userId))),
        db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.empresaId, emp.id), eq(exames.userId, userId), or(eq(exames.resultado, "alteracao"), eq(exames.resultado, "perda_leve"), eq(exames.resultado, "perda_moderada"), eq(exames.resultado, "perda_severa")))),
        db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.empresaId, emp.id), eq(exames.userId, userId), eq(exames.status, "vencido"))),
      ]);

      const totalColaboradores = Number(colCount[0]?.count ?? 0);
      const totalExames = Number(exCount[0]?.count ?? 0);
      const totalAlteracoes = Number(altCount[0]?.count ?? 0);
      const examesPendentes = Number(pendCount[0]?.count ?? 0);

      let status = "Regular";
      if (examesPendentes > 0) status = "Com Pendências";
      else if (totalAlteracoes > 0) status = "Atenção";

      return { id: emp.id, nome: emp.nome, totalColaboradores, totalExames, totalAlteracoes, examesPendentes, status };
    })
  );

  return result;
}

export async function getComparativoMensal(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const inicioMesAtual = new Date(now.getFullYear(), now.getMonth(), 1);
  const inicioMesAtualStr = inicioMesAtual.toISOString().slice(0, 10);
  const inicioMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const inicioMesAnteriorStr = inicioMesAnterior.toISOString().slice(0, 10);
  const fimMesAnterior = new Date(now.getFullYear(), now.getMonth(), 0);
  const fimMesAnteriorStr = fimMesAnterior.toISOString().slice(0, 10);

  const [
    empresasMesAtual, empresasMesAnterior,
    colaboradoresMesAtual, colaboradoresMesAnterior,
    examesMesAtual, examesMesAnterior,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(empresas).where(and(eq(empresas.userId, userId), sql`DATE(${empresas.createdAt}) >= ${inicioMesAtualStr}`)),
    db.select({ count: sql<number>`count(*)` }).from(empresas).where(and(eq(empresas.userId, userId), sql`DATE(${empresas.createdAt}) >= ${inicioMesAnteriorStr}`, sql`DATE(${empresas.createdAt}) <= ${fimMesAnteriorStr}`)),
    db.select({ count: sql<number>`count(*)` }).from(colaboradores).where(and(eq(colaboradores.userId, userId), sql`DATE(${colaboradores.createdAt}) >= ${inicioMesAtualStr}`)),
    db.select({ count: sql<number>`count(*)` }).from(colaboradores).where(and(eq(colaboradores.userId, userId), sql`DATE(${colaboradores.createdAt}) >= ${inicioMesAnteriorStr}`, sql`DATE(${colaboradores.createdAt}) <= ${fimMesAnteriorStr}`)),
    db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.userId, userId), sql`${exames.dataRealizacao} >= ${inicioMesAtualStr}`)),
    db.select({ count: sql<number>`count(*)` }).from(exames).where(and(eq(exames.userId, userId), sql`${exames.dataRealizacao} >= ${inicioMesAnteriorStr}`, sql`${exames.dataRealizacao} <= ${fimMesAnteriorStr}`)),
  ]);

  const calcVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return null;
    const variacao = Math.round(((atual - anterior) / anterior) * 100);
    return { valor: variacao, positivo: variacao >= 0 };
  };

  return {
    empresas: calcVariacao(Number(empresasMesAtual[0]?.count ?? 0), Number(empresasMesAnterior[0]?.count ?? 0)),
    colaboradores: calcVariacao(Number(colaboradoresMesAtual[0]?.count ?? 0), Number(colaboradoresMesAnterior[0]?.count ?? 0)),
    exames: calcVariacao(Number(examesMesAtual[0]?.count ?? 0), Number(examesMesAnterior[0]?.count ?? 0)),
  };
}
