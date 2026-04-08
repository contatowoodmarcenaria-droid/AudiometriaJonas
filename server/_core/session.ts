import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

export type SessionPayload = {
  openId: string;
  name: string;
};

function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  if (!cookieHeader) return new Map();
  const parsed = parseCookieHeader(cookieHeader);
  return new Map(Object.entries(parsed));
}

/**
 * Create a signed JWT session token for a user.
 */
export async function createSessionToken(
  openId: string,
  options: { expiresInMs?: number; name?: string } = {}
): Promise<string> {
  const expiresInMs = options.expiresInMs ?? 1000 * 60 * 60 * 24 * 365;
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);
  const secretKey = getSessionSecret();

  return new SignJWT({
    openId,
    name: options.name || "",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

/**
 * Verify a session from cookie header string.
 * Returns the session payload or null.
 */
export async function verifySession(
  cookieHeader: string | undefined
): Promise<SessionPayload | null> {
  const cookies = parseCookies(cookieHeader);
  const cookieValue = cookies.get(COOKIE_NAME);
  if (!cookieValue) return null;

  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(cookieValue, secretKey, {
      algorithms: ["HS256"],
    });
    const { openId, name } = payload as Record<string, unknown>;

    if (typeof openId !== "string" || openId.length === 0) return null;

    return {
      openId,
      name: typeof name === "string" ? name : "",
    };
  } catch {
    return null;
  }
}
