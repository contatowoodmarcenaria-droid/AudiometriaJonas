import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createExameAudiometrico,
  updateExameAudiometrico,
  getExameAudiometricoById,
  getExamesAudiometricosByColaborador,
  listExamesAudiometricos,
  deleteExameAudiometrico,
  createParecerModelo,
  updateParecerModelo,
  listPareceresModelo,
  deleteParecerModelo,
  getConfiguracaoLaudo,
  upsertConfiguracaoLaudo,
  PARECERES_PADRAO,
} from "../db-audiometria";
import { pareceresModelo } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq } from "drizzle-orm";

// Schema de limiares audiométricos
const limiarSchema = z.object({
  // Via Aérea OD
  vaOD250: z.number().nullable().optional(),
  vaOD500: z.number().nullable().optional(),
  vaOD1000: z.number().nullable().optional(),
  vaOD2000: z.number().nullable().optional(),
  vaOD3000: z.number().nullable().optional(),
  vaOD4000: z.number().nullable().optional(),
  vaOD6000: z.number().nullable().optional(),
  vaOD8000: z.number().nullable().optional(),
  vaMascOD250: z.number().nullable().optional(),
  vaMascOD500: z.number().nullable().optional(),
  vaMascOD1000: z.number().nullable().optional(),
  vaMascOD2000: z.number().nullable().optional(),
  vaMascOD3000: z.number().nullable().optional(),
  vaMascOD4000: z.number().nullable().optional(),
  vaMascOD6000: z.number().nullable().optional(),
  vaMascOD8000: z.number().nullable().optional(),
  vaTipoOD250: z.string().nullable().optional(),
  vaTipoOD500: z.string().nullable().optional(),
  vaTipoOD1000: z.string().nullable().optional(),
  vaTipoOD2000: z.string().nullable().optional(),
  vaTipoOD3000: z.string().nullable().optional(),
  vaTipoOD4000: z.string().nullable().optional(),
  vaTipoOD6000: z.string().nullable().optional(),
  vaTipoOD8000: z.string().nullable().optional(),
  // Via Aérea OE
  vaOE250: z.number().nullable().optional(),
  vaOE500: z.number().nullable().optional(),
  vaOE1000: z.number().nullable().optional(),
  vaOE2000: z.number().nullable().optional(),
  vaOE3000: z.number().nullable().optional(),
  vaOE4000: z.number().nullable().optional(),
  vaOE6000: z.number().nullable().optional(),
  vaOE8000: z.number().nullable().optional(),
  vaMascOE250: z.number().nullable().optional(),
  vaMascOE500: z.number().nullable().optional(),
  vaMascOE1000: z.number().nullable().optional(),
  vaMascOE2000: z.number().nullable().optional(),
  vaMascOE3000: z.number().nullable().optional(),
  vaMascOE4000: z.number().nullable().optional(),
  vaMascOE6000: z.number().nullable().optional(),
  vaMascOE8000: z.number().nullable().optional(),
  vaTipoOE250: z.string().nullable().optional(),
  vaTipoOE500: z.string().nullable().optional(),
  vaTipoOE1000: z.string().nullable().optional(),
  vaTipoOE2000: z.string().nullable().optional(),
  vaTipoOE3000: z.string().nullable().optional(),
  vaTipoOE4000: z.string().nullable().optional(),
  vaTipoOE6000: z.string().nullable().optional(),
  vaTipoOE8000: z.string().nullable().optional(),
  // Via Óssea OD
  voOD500: z.number().nullable().optional(),
  voOD1000: z.number().nullable().optional(),
  voOD2000: z.number().nullable().optional(),
  voOD3000: z.number().nullable().optional(),
  voOD4000: z.number().nullable().optional(),
  voMascOD500: z.number().nullable().optional(),
  voMascOD1000: z.number().nullable().optional(),
  voMascOD2000: z.number().nullable().optional(),
  voMascOD3000: z.number().nullable().optional(),
  voMascOD4000: z.number().nullable().optional(),
  voTipoOD500: z.string().nullable().optional(),
  voTipoOD1000: z.string().nullable().optional(),
  voTipoOD2000: z.string().nullable().optional(),
  voTipoOD3000: z.string().nullable().optional(),
  voTipoOD4000: z.string().nullable().optional(),
  // Via Óssea OE
  voOE500: z.number().nullable().optional(),
  voOE1000: z.number().nullable().optional(),
  voOE2000: z.number().nullable().optional(),
  voOE3000: z.number().nullable().optional(),
  voOE4000: z.number().nullable().optional(),
  voMascOE500: z.number().nullable().optional(),
  voMascOE1000: z.number().nullable().optional(),
  voMascOE2000: z.number().nullable().optional(),
  voMascOE3000: z.number().nullable().optional(),
  voMascOE4000: z.number().nullable().optional(),
  voTipoOE500: z.string().nullable().optional(),
  voTipoOE1000: z.string().nullable().optional(),
  voTipoOE2000: z.string().nullable().optional(),
  voTipoOE3000: z.string().nullable().optional(),
  voTipoOE4000: z.string().nullable().optional(),
});

const exameBaseSchema = z.object({
  colaboradorId: z.number(),
  empresaId: z.number(),
  audiometro: z.string().nullable().optional(),
  dataCalibracaoAudiometro: z.string().nullable().optional(),
  dataRealizacao: z.string(),
  motivoAvaliacao: z.enum(["admissional", "periodico", "retorno_trabalho", "demissional", "mudanca_riscos", "monitoracao_pontual", "consulta_medica"]).default("admissional"),
  repousoAuditivo: z.enum(["maior_igual_14h", "menor_14h", "nao_informado"]).nullable().optional(),
  repousoHoras: z.string().nullable().optional(),
  queixa: z.boolean().nullable().optional(),
  queixaDescricao: z.string().nullable().optional(),
  epiUso: z.enum(["nao", "sim", "plug", "concha"]).nullable().optional(),
  meatoscopiaOD: z.enum(["normal", "obstrucao_parcial", "obstrucao_total"]).nullable().optional(),
  meatoscopiaOE: z.enum(["normal", "obstrucao_parcial", "obstrucao_total"]).nullable().optional(),
  mediaOD: z.string().nullable().optional(),
  mediaOE: z.string().nullable().optional(),
  metodoMedia: z.string().nullable().optional(),
  tipoMedia: z.enum(["tritonal", "quadritonal"]).nullable().optional(),
  classificacaoOD: z.string().nullable().optional(),
  classificacaoOE: z.string().nullable().optional(),
  lrfOD: z.number().nullable().optional(),
  ldvOD: z.number().nullable().optional(),
  mascOD: z.number().nullable().optional(),
  lrfOE: z.number().nullable().optional(),
  ldvOE: z.number().nullable().optional(),
  mascOE: z.number().nullable().optional(),
  irfIntensidadeOD: z.number().nullable().optional(),
  irfMonossilabosOD: z.number().nullable().optional(),
  irfDissilabosOD: z.number().nullable().optional(),
  irfMascOD: z.number().nullable().optional(),
  irfIntensidadeOE: z.number().nullable().optional(),
  irfMonossilabosOE: z.number().nullable().optional(),
  irfDissilabosOE: z.number().nullable().optional(),
  irfMascOE: z.number().nullable().optional(),
  mascVAMinOD: z.number().nullable().optional(),
  mascVAMaxOD: z.number().nullable().optional(),
  mascVOMinOD: z.number().nullable().optional(),
  mascVOMaxOD: z.number().nullable().optional(),
  mascVAMinOE: z.number().nullable().optional(),
  mascVAMaxOE: z.number().nullable().optional(),
  mascVOMinOE: z.number().nullable().optional(),
  mascVOMaxOE: z.number().nullable().optional(),
  parecerAudiologico: z.string().nullable().optional(),
  resultado: z.enum(["normal", "alteracao_leve", "alteracao_moderada", "alteracao_severa", "alteracao_profunda"]).nullable().optional(),
  status: z.enum(["rascunho", "finalizado", "laudo_emitido"]).default("rascunho"),
  laudoUrl: z.string().nullable().optional(),
}).merge(limiarSchema);

export const audiometriaRouter = router({
  // ─── Exames ────────────────────────────────────────────────────────────
  create: protectedProcedure
    .input(exameBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await createExameAudiometrico({
        ...input,
        userId: ctx.user.id,
        mediaOD: input.mediaOD ? input.mediaOD.toString() : null,
        mediaOE: input.mediaOE ? input.mediaOE.toString() : null,
      });
      return { id: result!.id };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(exameBaseSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateExameAudiometrico(id, ctx.user.id, {
        ...data,
        mediaOD: data.mediaOD ? data.mediaOD.toString() : undefined,
        mediaOE: data.mediaOE ? data.mediaOE.toString() : undefined,
      } as any);
      return { success: true };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return getExameAudiometricoById(input.id, ctx.user.id);
    }),

  listByColaborador: protectedProcedure
    .input(z.object({ colaboradorId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getExamesAudiometricosByColaborador(input.colaboradorId, ctx.user.id);
    }),

  list: protectedProcedure
    .input(z.object({
      empresaId: z.number().optional(),
      colaboradorId: z.number().optional(),
      status: z.string().optional(),
      resultado: z.string().optional(),
      motivo: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return listExamesAudiometricos(ctx.user.id, input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteExameAudiometrico(input.id, ctx.user.id);
      return { success: true };
    }),

  // ─── Pareceres Modelo ──────────────────────────────────────────────────
  listPareceresModelo: protectedProcedure
    .query(async ({ ctx }) => {
      return listPareceresModelo(ctx.user.id);
    }),

  createParecerModelo: protectedProcedure
    .input(z.object({
      titulo: z.string().min(1),
      texto: z.string().min(1),
      categoria: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createParecerModelo({ ...input, userId: ctx.user.id });
      return { id: result!.id };
    }),

  updateParecerModelo: protectedProcedure
    .input(z.object({
      id: z.number(),
      titulo: z.string().min(1).optional(),
      texto: z.string().min(1).optional(),
      categoria: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateParecerModelo(id, ctx.user.id, data);
      return { success: true };
    }),

  deleteParecerModelo: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteParecerModelo(input.id, ctx.user.id);
      return { success: true };
    }),

  seedPareceresModelo: protectedProcedure
    .mutation(async ({ ctx }) => {
      const existing = await listPareceresModelo(ctx.user.id);
      if (existing.length > 0) return { skipped: true, count: existing.length };
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(pareceresModelo).values(
        PARECERES_PADRAO.map(p => ({ ...p, userId: ctx.user.id }))
      );
      return { success: true, count: PARECERES_PADRAO.length };
    }),

  // ─── Configurações de Laudo ────────────────────────────────────────────
  getConfiguracaoLaudo: protectedProcedure
    .query(async ({ ctx }) => {
      return getConfiguracaoLaudo(ctx.user.id);
    }),

  saveConfiguracaoLaudo: protectedProcedure
    .input(z.object({
      nomeClinica: z.string().optional(),
      enderecoClinica: z.string().optional(),
      telefoneClinica: z.string().optional(),
      emailClinica: z.string().optional(),
      cnpjClinica: z.string().optional(),
      logotipoUrl: z.string().optional(),
      nomeProfissional: z.string().optional(),
      titulosProfissional: z.string().optional(),
      crfa: z.string().optional(),
      assinaturaUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await upsertConfiguracaoLaudo(ctx.user.id, input);
      return { success: true };
    }),
});
