import {
  serial,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  numeric,
  boolean,
  jsonb,
  real,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const empresaStatusEnum = pgEnum("empresa_status", ["ativa", "inativa", "pendente", "atencao"]);

export const colaboradorStatusEnum = pgEnum("colaborador_status", ["ativo", "inativo", "afastado"]);

export const sexoEnum = pgEnum("sexo", ["M", "F", "outro"]);

export const motivoAvaliacaoEnum = pgEnum("motivo_avaliacao", [
  "admissional",
  "periodico",
  "retorno_trabalho",
  "demissional",
  "mudanca_riscos",
  "monitoracao_pontual",
  "consulta_medica",
]);

export const repousoAuditivoEnum = pgEnum("repouso_auditivo", ["maior_igual_14h", "menor_14h", "nao_informado"]);

export const epiUsoEnum = pgEnum("epi_uso", ["nao", "sim", "plug", "concha"]);

export const meatoscopiaEnum = pgEnum("meatoscopia", ["normal", "obstrucao_parcial", "obstrucao_total"]);

export const tipoMediaEnum = pgEnum("tipo_media", ["tritonal", "quadritonal"]);

export const resultadoAudiometricoEnum = pgEnum("resultado_audiometrico", [
  "normal", "alteracao_leve", "alteracao_moderada", "alteracao_severa", "alteracao_profunda",
]);

export const statusExameAudiometricoEnum = pgEnum("status_exame_audiometrico", ["rascunho", "finalizado", "laudo_emitido"]);

export const tipoExameEnum = pgEnum("tipo_exame", ["audiometria_ocupacional", "avaliacao_audiologica", "meatoscopia", "imitanciometria"]);

export const resultadoExameEnum = pgEnum("resultado_exame", ["normal", "alteracao", "perda_leve", "perda_moderada", "perda_severa"]);

export const statusExameEnum = pgEnum("status_exame", ["realizado", "pendente", "vencido", "agendado"]);

export const tipoAlertaEnum = pgEnum("tipo_alerta", ["exame_vencido", "exame_vencer", "pendencia", "novo_colaborador"]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  // Fonoaudiólogo profile fields
  specialty: varchar("specialty", { length: 128 }),
  crfa: varchar("crfa", { length: 32 }),
  phone: varchar("phone", { length: 20 }),
  // Dados para laudo
  nomeCompleto: varchar("nomeCompleto", { length: 256 }),
  tituloLaudo: varchar("tituloLaudo", { length: 256 }),
  assinaturaUrl: text("assinaturaUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Email/password auth
  passwordHash: varchar("passwordHash", { length: 256 }),
});

export const empresas = pgTable("empresas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 256 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).notNull().unique(),
  responsavel: varchar("responsavel", { length: 128 }),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  endereco: text("endereco"),
  setor: varchar("setor", { length: 128 }),
  status: empresaStatusEnum("status").default("ativa").notNull(),
  // Dados para cabeçalho do laudo
  logotipoUrl: text("logotipoUrl"),
  cep: varchar("cep", { length: 10 }),
  cidade: varchar("cidade", { length: 128 }),
  estado: varchar("estado", { length: 2 }),
  userId: integer("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const colaboradores = pgTable("colaboradores", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 16 }),
  nome: varchar("nome", { length: 256 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  cargo: varchar("cargo", { length: 128 }),
  setor: varchar("setor", { length: 128 }),
  empresaId: integer("empresaId").notNull(),
  status: colaboradorStatusEnum("status").default("ativo").notNull(),
  dataNascimento: varchar("dataNascimento", { length: 10 }),
  sexo: sexoEnum("sexo"),
  dataAdmissao: varchar("dataAdmissao", { length: 10 }),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 20 }),
  userId: integer("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Tabela principal de exames audiométricos ocupacionais
export const examesAudiometricos = pgTable("exames_audiometricos", {
  id: serial("id").primaryKey(),
  colaboradorId: integer("colaboradorId").notNull(),
  empresaId: integer("empresaId").notNull(),
  userId: integer("userId").notNull(),

  // 1. Identificação
  audiometro: varchar("audiometro", { length: 128 }),
  dataCalibracaoAudiometro: varchar("dataCalibracaoAudiometro", { length: 10 }),
  dataRealizacao: varchar("dataRealizacao", { length: 10 }).notNull(),

  // 2. Motivo da Avaliação
  motivoAvaliacao: motivoAvaliacaoEnum("motivoAvaliacao").default("admissional").notNull(),

  // Repouso auditivo
  repousoAuditivo: repousoAuditivoEnum("repousoAuditivo").default("nao_informado"),
  repousoHoras: varchar("repousoHoras", { length: 10 }),

  // Queixa
  queixa: boolean("queixa").default(false),
  queixaDescricao: text("queixaDescricao"),

  // EPI
  epiUso: epiUsoEnum("epiUso").default("nao"),

  // 3. Meatoscopia
  meatoscopiaOD: meatoscopiaEnum("meatoscopiaOD").default("normal"),
  meatoscopiaOE: meatoscopiaEnum("meatoscopiaOE").default("normal"),

  // 4. Audiometria Tonal - Via Aérea Orelha Direita (dBNA)
  vaOD250: integer("vaOD250"),
  vaOD500: integer("vaOD500"),
  vaOD1000: integer("vaOD1000"),
  vaOD2000: integer("vaOD2000"),
  vaOD3000: integer("vaOD3000"),
  vaOD4000: integer("vaOD4000"),
  vaOD6000: integer("vaOD6000"),
  vaOD8000: integer("vaOD8000"),

  // Via Aérea OD - Mascaramento
  vaMascOD250: integer("vaMascOD250"),
  vaMascOD500: integer("vaMascOD500"),
  vaMascOD1000: integer("vaMascOD1000"),
  vaMascOD2000: integer("vaMascOD2000"),
  vaMascOD3000: integer("vaMascOD3000"),
  vaMascOD4000: integer("vaMascOD4000"),
  vaMascOD6000: integer("vaMascOD6000"),
  vaMascOD8000: integer("vaMascOD8000"),

  // Via Aérea OD - Tipo de resposta
  vaTipoOD250: varchar("vaTipoOD250", { length: 20 }),
  vaTipoOD500: varchar("vaTipoOD500", { length: 20 }),
  vaTipoOD1000: varchar("vaTipoOD1000", { length: 20 }),
  vaTipoOD2000: varchar("vaTipoOD2000", { length: 20 }),
  vaTipoOD3000: varchar("vaTipoOD3000", { length: 20 }),
  vaTipoOD4000: varchar("vaTipoOD4000", { length: 20 }),
  vaTipoOD6000: varchar("vaTipoOD6000", { length: 20 }),
  vaTipoOD8000: varchar("vaTipoOD8000", { length: 20 }),

  // Via Aérea Orelha Esquerda (dBNA)
  vaOE250: integer("vaOE250"),
  vaOE500: integer("vaOE500"),
  vaOE1000: integer("vaOE1000"),
  vaOE2000: integer("vaOE2000"),
  vaOE3000: integer("vaOE3000"),
  vaOE4000: integer("vaOE4000"),
  vaOE6000: integer("vaOE6000"),
  vaOE8000: integer("vaOE8000"),

  // Via Aérea OE - Mascaramento
  vaMascOE250: integer("vaMascOE250"),
  vaMascOE500: integer("vaMascOE500"),
  vaMascOE1000: integer("vaMascOE1000"),
  vaMascOE2000: integer("vaMascOE2000"),
  vaMascOE3000: integer("vaMascOE3000"),
  vaMascOE4000: integer("vaMascOE4000"),
  vaMascOE6000: integer("vaMascOE6000"),
  vaMascOE8000: integer("vaMascOE8000"),

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
  voOD500: integer("voOD500"),
  voOD1000: integer("voOD1000"),
  voOD2000: integer("voOD2000"),
  voOD3000: integer("voOD3000"),
  voOD4000: integer("voOD4000"),

  // Via Óssea OD - Mascaramento
  voMascOD500: integer("voMascOD500"),
  voMascOD1000: integer("voMascOD1000"),
  voMascOD2000: integer("voMascOD2000"),
  voMascOD3000: integer("voMascOD3000"),
  voMascOD4000: integer("voMascOD4000"),

  // Via Óssea OD - Tipo de resposta
  voTipoOD500: varchar("voTipoOD500", { length: 20 }),
  voTipoOD1000: varchar("voTipoOD1000", { length: 20 }),
  voTipoOD2000: varchar("voTipoOD2000", { length: 20 }),
  voTipoOD3000: varchar("voTipoOD3000", { length: 20 }),
  voTipoOD4000: varchar("voTipoOD4000", { length: 20 }),

  // Via Óssea Orelha Esquerda (dBNA)
  voOE500: integer("voOE500"),
  voOE1000: integer("voOE1000"),
  voOE2000: integer("voOE2000"),
  voOE3000: integer("voOE3000"),
  voOE4000: integer("voOE4000"),

  // Via Óssea OE - Mascaramento
  voMascOE500: integer("voMascOE500"),
  voMascOE1000: integer("voMascOE1000"),
  voMascOE2000: integer("voMascOE2000"),
  voMascOE3000: integer("voMascOE3000"),
  voMascOE4000: integer("voMascOE4000"),

  // Via Óssea OE - Tipo de resposta
  voTipoOE500: varchar("voTipoOE500", { length: 20 }),
  voTipoOE1000: varchar("voTipoOE1000", { length: 20 }),
  voTipoOE2000: varchar("voTipoOE2000", { length: 20 }),
  voTipoOE3000: varchar("voTipoOE3000", { length: 20 }),
  voTipoOE4000: varchar("voTipoOE4000", { length: 20 }),

  // Médias calculadas (armazenadas para histórico)
  mediaOD: numeric("mediaOD", { precision: 5, scale: 2 }),
  mediaOE: numeric("mediaOE", { precision: 5, scale: 2 }),
  metodoMedia: varchar("metodoMedia", { length: 64 }),
  tipoMedia: tipoMediaEnum("tipoMedia"),

  // Classificação da perda auditiva
  classificacaoOD: varchar("classificacaoOD", { length: 128 }),
  classificacaoOE: varchar("classificacaoOE", { length: 128 }),

  // LRF, LDV, MASC
  lrfOD: integer("lrfOD"),
  ldvOD: integer("ldvOD"),
  mascOD: integer("mascOD"),
  lrfOE: integer("lrfOE"),
  ldvOE: integer("ldvOE"),
  mascOE: integer("mascOE"),

  // 5. Índice de Reconhecimento de Fala (IRF)
  irfIntensidadeOD: integer("irfIntensidadeOD"),
  irfMonossilabosOD: integer("irfMonossilabosOD"),
  irfDissilabosOD: integer("irfDissilabosOD"),
  irfMascOD: integer("irfMascOD"),
  irfIntensidadeOE: integer("irfIntensidadeOE"),
  irfMonossilabosOE: integer("irfMonossilabosOE"),
  irfDissilabosOE: integer("irfDissilabosOE"),
  irfMascOE: integer("irfMascOE"),

  // Mascaramento em dB (Min/Max) para VA e VO
  mascVAMinOD: integer("mascVAMinOD"),
  mascVAMaxOD: integer("mascVAMaxOD"),
  mascVOMinOD: integer("mascVOMinOD"),
  mascVOMaxOD: integer("mascVOMaxOD"),
  mascVAMinOE: integer("mascVAMinOE"),
  mascVAMaxOE: integer("mascVAMaxOE"),
  mascVOMinOE: integer("mascVOMinOE"),
  mascVOMaxOE: integer("mascVOMaxOE"),

  // 6. Parecer Audiológico
  parecerAudiologico: text("parecerAudiologico"),

  // Status geral do exame
  resultado: resultadoAudiometricoEnum("resultado").default("normal"),
  status: statusExameAudiometricoEnum("status").default("rascunho").notNull(),

  // URL do laudo PDF gerado
  laudoUrl: text("laudoUrl"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Tabela de modelos de parecer audiológico (personalizáveis pelo profissional)
export const pareceresModelo = pgTable("pareceres_modelo", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  titulo: varchar("titulo", { length: 256 }).notNull(),
  texto: text("texto").notNull(),
  categoria: varchar("categoria", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Tabela de configurações do profissional para laudos
export const configuracoesLaudo = pgTable("configuracoes_laudo", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Manter tabela legada de exames para compatibilidade
export const exames = pgTable("exames", {
  id: serial("id").primaryKey(),
  colaboradorId: integer("colaboradorId").notNull(),
  empresaId: integer("empresaId").notNull(),
  tipo: tipoExameEnum("tipo").default("audiometria_ocupacional").notNull(),
  dataRealizacao: varchar("dataRealizacao", { length: 10 }).notNull(),
  dataVencimento: varchar("dataVencimento", { length: 10 }),
  resultado: resultadoExameEnum("resultado").default("normal"),
  status: statusExameEnum("status").default("realizado").notNull(),
  observacoes: text("observacoes"),
  dadosAudiometria: jsonb("dadosAudiometria"),
  laudoUrl: text("laudoUrl"),
  exameAudiometricoId: integer("exameAudiometricoId"),
  userId: integer("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const alertas = pgTable("alertas", {
  id: serial("id").primaryKey(),
  tipo: tipoAlertaEnum("tipo").notNull(),
  titulo: varchar("titulo", { length: 256 }).notNull(),
  descricao: text("descricao"),
  empresaId: integer("empresaId"),
  colaboradorId: integer("colaboradorId"),
  exameId: integer("exameId"),
  lido: boolean("lido").default(false).notNull(),
  userId: integer("userId").notNull(),
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
