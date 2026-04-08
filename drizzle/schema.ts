import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  float,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Fonoaudiólogo profile fields
  specialty: varchar("specialty", { length: 128 }),
  crfa: varchar("crfa", { length: 32 }),
  phone: varchar("phone", { length: 20 }),
  // Dados para laudo
  nomeCompleto: varchar("nomeCompleto", { length: 256 }),
  tituloLaudo: varchar("tituloLaudo", { length: 256 }),
  assinaturaUrl: text("assinaturaUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Email/password auth
  passwordHash: varchar("passwordHash", { length: 256 }),
});

export const empresas = mysqlTable("empresas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 256 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).notNull().unique(),
  responsavel: varchar("responsavel", { length: 128 }),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  endereco: text("endereco"),
  setor: varchar("setor", { length: 128 }),
  status: mysqlEnum("status", ["ativa", "inativa", "pendente", "atencao"]).default("ativa").notNull(),
  // Dados para cabeçalho do laudo
  logotipoUrl: text("logotipoUrl"),
  cep: varchar("cep", { length: 10 }),
  cidade: varchar("cidade", { length: 128 }),
  estado: varchar("estado", { length: 2 }),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const colaboradores = mysqlTable("colaboradores", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 16 }),
  nome: varchar("nome", { length: 256 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  cargo: varchar("cargo", { length: 128 }),
  setor: varchar("setor", { length: 128 }),
  empresaId: int("empresaId").notNull(),
  status: mysqlEnum("status", ["ativo", "inativo", "afastado"]).default("ativo").notNull(),
  dataNascimento: varchar("dataNascimento", { length: 10 }),
  sexo: mysqlEnum("sexo", ["M", "F", "outro"]),
  dataAdmissao: varchar("dataAdmissao", { length: 10 }),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 20 }),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela principal de exames audiométricos ocupacionais
export const examesAudiometricos = mysqlTable("exames_audiometricos", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  empresaId: int("empresaId").notNull(),
  userId: int("userId").notNull(),

  // 1. Identificação
  audiometro: varchar("audiometro", { length: 128 }),
  dataCalibracaoAudiometro: varchar("dataCalibracaoAudiometro", { length: 10 }),
  dataRealizacao: varchar("dataRealizacao", { length: 10 }).notNull(),

  // 2. Motivo da Avaliação
  motivoAvaliacao: mysqlEnum("motivoAvaliacao", [
    "admissional",
    "periodico",
    "retorno_trabalho",
    "demissional",
    "mudanca_riscos",
    "monitoracao_pontual",
    "consulta_medica",
  ]).default("admissional").notNull(),

  // Repouso auditivo
  repousoAuditivo: mysqlEnum("repousoAuditivo", ["maior_igual_14h", "menor_14h", "nao_informado"]).default("nao_informado"),
  repousoHoras: varchar("repousoHoras", { length: 10 }),

  // Queixa
  queixa: boolean("queixa").default(false),
  queixaDescricao: text("queixaDescricao"),

  // EPI
  epiUso: mysqlEnum("epiUso", ["nao", "sim", "plug", "concha"]).default("nao"),

  // 3. Meatoscopia
  meatoscopiaOD: mysqlEnum("meatoscopiaOD", ["normal", "obstrucao_parcial", "obstrucao_total"]).default("normal"),
  meatoscopiaOE: mysqlEnum("meatoscopiaOE", ["normal", "obstrucao_parcial", "obstrucao_total"]).default("normal"),

  // 4. Audiometria Tonal - Via Aérea Orelha Direita (dBNA)
  // Frequências: 250, 500, 1000, 2000, 3000, 4000, 6000, 8000 Hz
  vaOD250: int("vaOD250"),
  vaOD500: int("vaOD500"),
  vaOD1000: int("vaOD1000"),
  vaOD2000: int("vaOD2000"),
  vaOD3000: int("vaOD3000"),
  vaOD4000: int("vaOD4000"),
  vaOD6000: int("vaOD6000"),
  vaOD8000: int("vaOD8000"),

  // Via Aérea OD - Mascaramento
  vaMascOD250: int("vaMascOD250"),
  vaMascOD500: int("vaMascOD500"),
  vaMascOD1000: int("vaMascOD1000"),
  vaMascOD2000: int("vaMascOD2000"),
  vaMascOD3000: int("vaMascOD3000"),
  vaMascOD4000: int("vaMascOD4000"),
  vaMascOD6000: int("vaMascOD6000"),
  vaMascOD8000: int("vaMascOD8000"),

  // Via Aérea OD - Tipo de resposta (ausência não mascarada, ausência mascarada, etc.)
  vaTipoOD250: varchar("vaTipoOD250", { length: 20 }),
  vaTipoOD500: varchar("vaTipoOD500", { length: 20 }),
  vaTipoOD1000: varchar("vaTipoOD1000", { length: 20 }),
  vaTipoOD2000: varchar("vaTipoOD2000", { length: 20 }),
  vaTipoOD3000: varchar("vaTipoOD3000", { length: 20 }),
  vaTipoOD4000: varchar("vaTipoOD4000", { length: 20 }),
  vaTipoOD6000: varchar("vaTipoOD6000", { length: 20 }),
  vaTipoOD8000: varchar("vaTipoOD8000", { length: 20 }),

  // Via Aérea Orelha Esquerda (dBNA)
  vaOE250: int("vaOE250"),
  vaOE500: int("vaOE500"),
  vaOE1000: int("vaOE1000"),
  vaOE2000: int("vaOE2000"),
  vaOE3000: int("vaOE3000"),
  vaOE4000: int("vaOE4000"),
  vaOE6000: int("vaOE6000"),
  vaOE8000: int("vaOE8000"),

  // Via Aérea OE - Mascaramento
  vaMascOE250: int("vaMascOE250"),
  vaMascOE500: int("vaMascOE500"),
  vaMascOE1000: int("vaMascOE1000"),
  vaMascOE2000: int("vaMascOE2000"),
  vaMascOE3000: int("vaMascOE3000"),
  vaMascOE4000: int("vaMascOE4000"),
  vaMascOE6000: int("vaMascOE6000"),
  vaMascOE8000: int("vaMascOE8000"),

  // Via Aérea OE - Tipo de resposta
  vaTipoOE250: varchar("vaTipoOE250", { length: 20 }),
  vaTipoOE500: varchar("vaTipoOE500", { length: 20 }),
  vaTipoOE1000: varchar("vaTipoOE1000", { length: 20 }),
  vaTipoOE2000: varchar("vaTipoOE2000", { length: 20 }),
  vaTipoOE3000: varchar("vaTipoOE3000", { length: 20 }),
  vaTipoOE4000: varchar("vaTipoOE4000", { length: 20 }),
  vaTipoOE6000: varchar("vaTipoOE6000", { length: 20 }),
  vaTipoOE8000: varchar("vaTipoOE8000", { length: 20 }),

  // Via Óssea Orelha Direita (dBNA) - Frequências: 500, 1000, 2000, 3000, 4000 Hz
  voOD500: int("voOD500"),
  voOD1000: int("voOD1000"),
  voOD2000: int("voOD2000"),
  voOD3000: int("voOD3000"),
  voOD4000: int("voOD4000"),

  // Via Óssea OD - Mascaramento
  voMascOD500: int("voMascOD500"),
  voMascOD1000: int("voMascOD1000"),
  voMascOD2000: int("voMascOD2000"),
  voMascOD3000: int("voMascOD3000"),
  voMascOD4000: int("voMascOD4000"),

  // Via Óssea OD - Tipo de resposta
  voTipoOD500: varchar("voTipoOD500", { length: 20 }),
  voTipoOD1000: varchar("voTipoOD1000", { length: 20 }),
  voTipoOD2000: varchar("voTipoOD2000", { length: 20 }),
  voTipoOD3000: varchar("voTipoOD3000", { length: 20 }),
  voTipoOD4000: varchar("voTipoOD4000", { length: 20 }),

  // Via Óssea Orelha Esquerda (dBNA)
  voOE500: int("voOE500"),
  voOE1000: int("voOE1000"),
  voOE2000: int("voOE2000"),
  voOE3000: int("voOE3000"),
  voOE4000: int("voOE4000"),

  // Via Óssea OE - Mascaramento
  voMascOE500: int("voMascOE500"),
  voMascOE1000: int("voMascOE1000"),
  voMascOE2000: int("voMascOE2000"),
  voMascOE3000: int("voMascOE3000"),
  voMascOE4000: int("voMascOE4000"),

  // Via Óssea OE - Tipo de resposta
  voTipoOE500: varchar("voTipoOE500", { length: 20 }),
  voTipoOE1000: varchar("voTipoOE1000", { length: 20 }),
  voTipoOE2000: varchar("voTipoOE2000", { length: 20 }),
  voTipoOE3000: varchar("voTipoOE3000", { length: 20 }),
  voTipoOE4000: varchar("voTipoOE4000", { length: 20 }),

  // Médias calculadas (armazenadas para histórico)
  mediaOD: decimal("mediaOD", { precision: 5, scale: 2 }),
  mediaOE: decimal("mediaOE", { precision: 5, scale: 2 }),
  metodoMedia: varchar("metodoMedia", { length: 64 }),
  tipoMedia: mysqlEnum("tipoMedia", ["tritonal", "quadritonal"]),

  // Classificação da perda auditiva
  classificacaoOD: varchar("classificacaoOD", { length: 128 }),
  classificacaoOE: varchar("classificacaoOE", { length: 128 }),

  // LRF, LDV, MASC
  lrfOD: int("lrfOD"),
  ldvOD: int("ldvOD"),
  mascOD: int("mascOD"),
  lrfOE: int("lrfOE"),
  ldvOE: int("ldvOE"),
  mascOE: int("mascOE"),

  // 5. Índice de Reconhecimento de Fala (IRF)
  irfIntensidadeOD: int("irfIntensidadeOD"),
  irfMonossilabosOD: int("irfMonossilabosOD"),
  irfDissilabosOD: int("irfDissilabosOD"),
  irfMascOD: int("irfMascOD"),
  irfIntensidadeOE: int("irfIntensidadeOE"),
  irfMonossilabosOE: int("irfMonossilabosOE"),
  irfDissilabosOE: int("irfDissilabosOE"),
  irfMascOE: int("irfMascOE"),

  // Mascaramento em dB (Min/Max) para VA e VO
  mascVAMinOD: int("mascVAMinOD"),
  mascVAMaxOD: int("mascVAMaxOD"),
  mascVOMinOD: int("mascVOMinOD"),
  mascVOMaxOD: int("mascVOMaxOD"),
  mascVAMinOE: int("mascVAMinOE"),
  mascVAMaxOE: int("mascVAMaxOE"),
  mascVOMinOE: int("mascVOMinOE"),
  mascVOMaxOE: int("mascVOMaxOE"),

  // 6. Parecer Audiológico
  parecerAudiologico: text("parecerAudiologico"),

  // Status geral do exame
  resultado: mysqlEnum("resultado", ["normal", "alteracao_leve", "alteracao_moderada", "alteracao_severa", "alteracao_profunda"]).default("normal"),
  status: mysqlEnum("status", ["rascunho", "finalizado", "laudo_emitido"]).default("rascunho").notNull(),

  // URL do laudo PDF gerado
  laudoUrl: text("laudoUrl"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela de modelos de parecer audiológico (personalizáveis pelo profissional)
export const pareceresModelo = mysqlTable("pareceres_modelo", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  titulo: varchar("titulo", { length: 256 }).notNull(),
  texto: text("texto").notNull(),
  categoria: varchar("categoria", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela de configurações do profissional para laudos
export const configuracoesLaudo = mysqlTable("configuracoes_laudo", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Cabeçalho do laudo
  nomeClinica: varchar("nomeClinica", { length: 256 }),
  enderecoClinica: text("enderecoClinica"),
  telefoneClinica: varchar("telefoneClinica", { length: 20 }),
  emailClinica: varchar("emailClinica", { length: 320 }),
  cnpjClinica: varchar("cnpjClinica", { length: 18 }),
  logotipoUrl: text("logotipoUrl"),
  // Dados do profissional
  nomeProfissional: varchar("nomeProfissional", { length: 256 }),
  titulosProfissional: varchar("titulosProfissional", { length: 256 }),
  crfa: varchar("crfa", { length: 32 }),
  assinaturaUrl: text("assinaturaUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Manter tabela legada de exames para compatibilidade
export const exames = mysqlTable("exames", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  empresaId: int("empresaId").notNull(),
  tipo: mysqlEnum("tipo", ["audiometria_ocupacional", "avaliacao_audiologica", "meatoscopia", "imitanciometria"]).default("audiometria_ocupacional").notNull(),
  dataRealizacao: varchar("dataRealizacao", { length: 10 }).notNull(),
  dataVencimento: varchar("dataVencimento", { length: 10 }),
  resultado: mysqlEnum("resultado", ["normal", "alteracao", "perda_leve", "perda_moderada", "perda_severa"]).default("normal"),
  status: mysqlEnum("status", ["realizado", "pendente", "vencido", "agendado"]).default("realizado").notNull(),
  observacoes: text("observacoes"),
  dadosAudiometria: json("dadosAudiometria"),
  laudoUrl: text("laudoUrl"),
  exameAudiometricoId: int("exameAudiometricoId"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const alertas = mysqlTable("alertas", {
  id: int("id").autoincrement().primaryKey(),
  tipo: mysqlEnum("tipo", ["exame_vencido", "exame_vencer", "pendencia", "novo_colaborador"]).notNull(),
  titulo: varchar("titulo", { length: 256 }).notNull(),
  descricao: text("descricao"),
  empresaId: int("empresaId"),
  colaboradorId: int("colaboradorId"),
  exameId: int("exameId"),
  lido: boolean("lido").default(false).notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Empresa = typeof empresas.$inferSelect;
export type InsertEmpresa = typeof empresas.$inferInsert;
export type Colaborador = typeof colaboradores.$inferSelect;
export type InsertColaborador = typeof colaboradores.$inferInsert;
export type ExameAudiometrico = typeof examesAudiometricos.$inferSelect;
export type InsertExameAudiometrico = typeof examesAudiometricos.$inferInsert;
export type ParecerModelo = typeof pareceresModelo.$inferSelect;
export type InsertParecerModelo = typeof pareceresModelo.$inferInsert;
export type ConfiguracaoLaudo = typeof configuracoesLaudo.$inferSelect;
export type InsertConfiguracaoLaudo = typeof configuracoesLaudo.$inferInsert;
export type Exame = typeof exames.$inferSelect;
export type InsertExame = typeof exames.$inferInsert;
export type Alerta = typeof alertas.$inferSelect;
export type InsertAlerta = typeof alertas.$inferInsert;
