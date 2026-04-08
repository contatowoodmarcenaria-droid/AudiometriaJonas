import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifySupabaseToken } from "./supabaseAuth";
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

    // Use Supabase UUID as the openId in our system
    const openId = `supabase_${supabaseUser.id}`;

    // Upsert user in our DB — include name from Supabase user_metadata if available
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

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // 1. Try Supabase Bearer token first (Authorization: Bearer <token>)
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      user = await authenticateWithSupabaseToken(token);
    }

    // 2. Fall back to existing session cookie (Manus OAuth or email/password)
    if (!user) {
      user = await sdk.authenticateRequest(opts.req);
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
