import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { APIError, type BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";

const telegramPayload = z.object({
  id: z.number().int().positive(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(),
  username: z.string().max(100).optional(),
  photo_url: z.string().url().max(2048).optional(),
  auth_date: z.number().int().positive(),
  hash: z.string().regex(/^[a-f0-9]{64}$/i),
});

function verifyTelegram(payload: z.infer<typeof telegramPayload>, botToken: string) {
  if (Math.abs(Date.now() / 1000 - payload.auth_date) > 10 * 60) return false;
  const values: Record<string, string | number | undefined> = { ...payload };
  delete values.hash;
  const checkString = Object.entries(values)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = createHash("sha256").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(checkString).digest("hex");
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(payload.hash, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function telegramAuth(): BetterAuthPlugin {
  return {
    id: "telegram-auth",
    endpoints: {
      telegramSignIn: createAuthEndpoint("/telegram/sign-in", { method: "POST", body: telegramPayload }, async (ctx) => {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) throw new APIError("NOT_FOUND", { message: "Вход через Telegram не настроен." });
        if (!verifyTelegram(ctx.body, botToken)) throw new APIError("UNAUTHORIZED", { message: "Подпись Telegram недействительна или устарела." });
        const telegramId = String(ctx.body.id);
        const existing = await db.select().from(account).where(and(eq(account.providerId, "telegram"), eq(account.accountId, telegramId))).limit(1);
        let userId = existing[0]?.userId;
        if (!userId) {
          const name = [ctx.body.first_name, ctx.body.last_name].filter(Boolean).join(" ");
          const created = await ctx.context.internalAdapter.createOAuthUser(
            {
              name,
              email: `telegram_${telegramId}@telegram.local`,
              emailVerified: false,
              image: ctx.body.photo_url || null,
            },
            { providerId: "telegram", accountId: telegramId },
          );
          userId = created.user.id;
        }
        const session = await ctx.context.internalAdapter.createSession(userId);
        const users = await ctx.context.internalAdapter.listUsers(1, 0, { field: "id", direction: "asc" }, [{ field: "id", value: userId, operator: "eq" }]);
        if (!users[0]) throw new APIError("INTERNAL_SERVER_ERROR", { message: "Не удалось загрузить пользователя." });
        await setSessionCookie(ctx, { session, user: users[0] });
        return ctx.json({ user: users[0], session });
      }),
    },
  };
}
