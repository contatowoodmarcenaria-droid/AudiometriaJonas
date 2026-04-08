import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { audiometriaRouter } from "./routers/audiometria";
import bcrypt from 'bcryptjs';
import {
  createAlerta,
  createColaborador,
  getNextCodigoColaborador,
  createEmpresa,
  createExame,
  createUserWithPassword,
  deleteColaborador,
  deleteEmpresa,
  deleteExame,
  getAlertas,
  getColaboradorById,
  getColaboradores,
  getColaboradoresStats,
  getDashboardStats,
  getEmpresaById,
  getEmpresas,
  getEmpresasComColaboradoresEExames,
  getEmpresasStats,
  getExameById,
  getExames,
  getExamesStats,
  getRecentExames,
  getUserByEmail,
  marcarAlertaLido,
  updateColaborador,
  updateEmpresa,
  updateExame,
  updateUserProfile,
  getExamesPorMes,
  getDistribuicaoResultados,
  getEmpresasParaRelatorio,
  getComparativoMensal,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // Email/password login
    loginWithEmail: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou senha incorretos' });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou senha incorretos' });
        }
        const { createSessionToken } = await import('./_core/session');
        const { ONE_YEAR_MS } = await import('@shared/const');
        const { getSessionCookieOptions } = await import('./_core/cookies');
        const sessionToken = await createSessionToken(user.openId, { name: user.name || '', expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user: { id: user.id, name: user.name, email: user.email } };
      }),

    // Email/password signup
    signupWithEmail: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Este email já está cadastrado' });
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await createUserWithPassword({ name: input.name, email: input.email, passwordHash });
        if (!user) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao criar conta' });
        const { createSessionToken } = await import('./_core/session');
        const { ONE_YEAR_MS } = await import('@shared/const');
        const { getSessionCookieOptions } = await import('./_core/cookies');
        const sessionToken = await createSessionToken(user.openId, { name: user.name || '', expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user: { id: user.id, name: user.name, email: user.email } };
      }),
  }),

  // ---- Dashboard ----
  dashboard: router({
    stats: protectedProcedure.query(({ ctx }) => getDashboardStats(ctx.user.id)),
    recentExames: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ ctx, input }) => getRecentExames(ctx.user.id, input.limit)),
    comparativoMensal: protectedProcedure.query(({ ctx }) => getComparativoMensal(ctx.user.id)),
  }),

  // ---- Empresas ----
  empresas: router({
    list: protectedProcedure
      .input(
        z.object({
          nome: z.string().optional(),
          cnpj: z.string().optional(),
          responsavel: z.string().optional(),
          status: z.string().optional(),
          setor: z.string().optional(),
        }).optional()
      )
      .query(({ ctx, input }) => getEmpresas(ctx.user.id, input)),

    listWithStats: protectedProcedure.query(({ ctx }) => getEmpresasComColaboradoresEExames(ctx.user.id)),

    stats: protectedProcedure.query(({ ctx }) => getEmpresasStats(ctx.user.id)),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => getEmpresaById(input.id, ctx.user.id)),

    create: protectedProcedure
      .input(
        z.object({
          nome: z.string().min(1),
          cnpj: z.string().min(1),
          responsavel: z.string().optional(),
          telefone: z.string().optional(),
          email: z.string().optional(),
          endereco: z.string().optional(),
          setor: z.string().optional(),
          status: z.enum(["ativa", "inativa", "pendente", "atencao"]).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createEmpresa({ ...input, userId: ctx.user.id })
      ),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          cnpj: z.string().optional(),
          responsavel: z.string().optional(),
          telefone: z.string().optional(),
          email: z.string().optional(),
          endereco: z.string().optional(),
          setor: z.string().optional(),
          status: z.enum(["ativa", "inativa", "pendente", "atencao"]).optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateEmpresa(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteEmpresa(input.id, ctx.user.id)),
  }),

  // ---- Colaboradores ----
  colaboradores: router({
    list: protectedProcedure
      .input(
        z.object({
          nome: z.string().optional(),
          empresaId: z.number().optional(),
          status: z.string().optional(),
          cargo: z.string().optional(),
          busca: z.string().optional(),
        }).optional()
      )
      .query(({ ctx, input }) => getColaboradores(ctx.user.id, input)),

    stats: protectedProcedure.query(({ ctx }) => getColaboradoresStats(ctx.user.id)),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => getColaboradorById(input.id, ctx.user.id)),

    create: protectedProcedure
      .input(
        z.object({
          nome: z.string().min(1),
          cpf: z.string().optional(),
          cargo: z.string().optional(),
          setor: z.string().optional(),
          empresaId: z.number(),
          status: z.enum(["ativo", "inativo", "afastado"]).optional(),
          dataNascimento: z.string().optional(),
          dataAdmissao: z.string().optional(),
          email: z.string().optional(),
          telefone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const codigo = await getNextCodigoColaborador(ctx.user.id);
        return createColaborador({ ...input, codigo, userId: ctx.user.id });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          cpf: z.string().optional(),
          cargo: z.string().optional(),
          setor: z.string().optional(),
          empresaId: z.number().optional(),
          status: z.enum(["ativo", "inativo", "afastado"]).optional(),
          dataNascimento: z.string().optional(),
          dataAdmissao: z.string().optional(),
          email: z.string().optional(),
          telefone: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateColaborador(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteColaborador(input.id, ctx.user.id)),

    buscarRapido: protectedProcedure
      .input(z.object({ q: z.string() }))
      .query(({ ctx, input }) =>
        getColaboradores(ctx.user.id, { busca: input.q })
          .then((rows) =>
            rows.slice(0, 8).map((c: any) => ({
              id: c.id,
              nome: c.nome,
              codigo: c.codigo ?? null,
              email: c.email ?? null,
            }))
          )
      ),
  }),

  // ---- Exames ----
  exames: router({
    list: protectedProcedure
      .input(
        z.object({
          colaboradorId: z.number().optional(),
          empresaId: z.number().optional(),
          status: z.string().optional(),
          resultado: z.string().optional(),
          tipo: z.string().optional(),
        }).optional()
      )
      .query(({ ctx, input }) => getExames(ctx.user.id, input)),

    stats: protectedProcedure.query(({ ctx }) => getExamesStats(ctx.user.id)),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => getExameById(input.id, ctx.user.id)),

    create: protectedProcedure
      .input(
        z.object({
          colaboradorId: z.number(),
          empresaId: z.number(),
          tipo: z.enum(["audiometria_ocupacional", "avaliacao_audiologica", "meatoscopia", "imitanciometria"]).optional(),
          dataRealizacao: z.string(),
          dataVencimento: z.string().optional(),
          resultado: z.enum(["normal", "alteracao", "perda_leve", "perda_moderada", "perda_severa"]).optional(),
          status: z.enum(["realizado", "pendente", "vencido", "agendado"]).optional(),
          observacoes: z.string().optional(),
          dadosAudiometria: z.any().optional(),
          laudoUrl: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createExame({ ...input, userId: ctx.user.id })
      ),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          tipo: z.enum(["audiometria_ocupacional", "avaliacao_audiologica", "meatoscopia", "imitanciometria"]).optional(),
          dataRealizacao: z.string().optional(),
          dataVencimento: z.string().optional(),
          resultado: z.enum(["normal", "alteracao", "perda_leve", "perda_moderada", "perda_severa"]).optional(),
          status: z.enum(["realizado", "pendente", "vencido", "agendado"]).optional(),
          observacoes: z.string().optional(),
          dadosAudiometria: z.any().optional(),
          laudoUrl: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateExame(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteExame(input.id, ctx.user.id)),
  }),

  // ---- Audiometria Ocupacional ----
  audiometria: audiometriaRouter,

  // ---- Alertas ----
  alertas: router({
    list: protectedProcedure
      .input(z.object({ lido: z.boolean().optional() }).optional())
      .query(({ ctx, input }) => getAlertas(ctx.user.id, input?.lido)),

    marcarLido: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => marcarAlertaLido(input.id, ctx.user.id)),
  }),

  // ---- Relatórios ----
  relatorios: router({
    examesPorMes: protectedProcedure
      .input(z.object({ meses: z.number().optional() }).optional())
      .query(({ ctx, input }) => getExamesPorMes(ctx.user.id, input?.meses ?? 6)),

    distribuicaoResultados: protectedProcedure
      .query(({ ctx }) => getDistribuicaoResultados(ctx.user.id)),

    empresasRelatorio: protectedProcedure
      .query(({ ctx }) => getEmpresasParaRelatorio(ctx.user.id)),
  }),

  // ---- Perfil do Usuário ----
  perfil: router({
    update: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          specialty: z.string().optional(),
          crfa: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)),
  }),
});

export type AppRouter = typeof appRouter;
