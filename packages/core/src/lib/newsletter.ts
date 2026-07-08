import { createHmac, timingSafeEqual } from "crypto";

type UnsubscribePayload = {
  u: string;
  e: string;
  exp: number;
};

function getSecret() {
  return process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET || "krausz-newsletter-secret";
}

function signPayload(payloadBase64: string) {
  return createHmac("sha256", getSecret()).update(payloadBase64).digest("base64url");
}

export function createUnsubscribeToken(userId: string, email: string) {
  const payload: UnsubscribePayload = {
    u: userId,
    e: email.toLowerCase(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyUnsubscribeToken(token: string): { userId: string; email: string } | null {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  const expected = signPayload(payloadBase64);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as UnsubscribePayload;
    if (!payload?.u || !payload?.e || !payload?.exp) return null;
    if (payload.exp < Date.now()) return null;
    return { userId: payload.u, email: payload.e };
  } catch {
    return null;
  }
}
