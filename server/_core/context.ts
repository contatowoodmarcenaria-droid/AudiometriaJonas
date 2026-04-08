import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { verifySupabaseToken } from "./supabaseAuth";
import { verifySession } from "./session";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Authenticate via Supabase Bearer token.
 * Verifies the JWT with Supabase, then upserts the user in our DB using their Supabase UUID as openId.
 */
async function authenticateWithSupabaseToken(token: string): Promise<User | null> {
  try {
    const supabaseUser = await verifySupabaseToken(token);
    if (!supabaseUser) return null;

    const openId = `supabase_${supabaseUser.id}`;

    await db.upsertUser({
      openId,
      email: supabaseUser.email ?? null,
      name: supabaseUser.name ?? null,
      loginMethod: "email",
      lastSignedIn: new Date(),
    });

    const user = await db.getUserByOpenId(openId);
    return user ?? null;
  } catch (error) {
    console.warn("[Auth] Supabase token verification failed:", error);
    return null;
  }
}

/**
 * Authenticate via session cookie (email/password login).
 */
async function authenticateWithSessionCookie(cookieHeader: string | undefined): Promise<User | null> {
  try {
    const session = await verifySession(cookieHeader);
    if (!session) return null;

    const user = await db.getUserByOpenId(session.openId);
    if (user) {
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    }
    return user ?? null;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // 1. Try Supabase Bearer token (Authorization: Bearer <token>)
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      user = await authenticateWithSupabaseToken(token);
    }

    // 2. Fall back to session cookie (email/password login)
    if (!user) {
      user = await authenticateWithSessionCookie(opts.req.headers.cookie);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
