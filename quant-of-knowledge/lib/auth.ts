import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { telegramAuth } from "@/lib/telegram-auth";

const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function deliverEmail(to: string, subject: string, text: string, html: string) {
  if (!process.env.SMTP_URL) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP_URL must be configured to deliver email");
    }
    console.info(`[development email] To: ${to}\nSubject: ${subject}\n${text}`);
    return;
  }

  const transport = nodemailer.createTransport(process.env.SMTP_URL);
  await transport.sendMail({
    from: process.env.EMAIL_FROM || "Evermind <noreply@localhost>",
    to,
    subject,
    text,
    html,
  });
}

async function deliverPhoneCode(phoneNumberValue: string, code: string) {
  if (process.env.SMS_WEBHOOK_URL) {
    const response = await fetch(process.env.SMS_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.SMS_WEBHOOK_SECRET
          ? { authorization: `Bearer ${process.env.SMS_WEBHOOK_SECRET}` }
          : {}),
      },
      body: JSON.stringify({ phoneNumber: phoneNumberValue, code }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`SMS provider returned ${response.status}`);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SMS_WEBHOOK_URL must be configured for phone sign-in");
  }
  console.info(`[development SMS] ${phoneNumberValue}: ${code}`);
}

const google = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const github = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;
const discord = process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET;

export const auth = betterAuth({
  appName: "Квант-знаний",
  baseURL: appUrl,
  secret:
    process.env.BETTER_AUTH_SECRET ||
    (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build"
      ? undefined
      : "evermind-local-development-secret-change-me"),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
    sendResetPassword: async ({ user, url }) => {
      await deliverEmail(
        user.email,
        "Сброс пароля — Квант-знаний",
        `Перейдите по ссылке, чтобы задать новый пароль: ${url}`,
        `<p><a href="${url}">Задать новый пароль</a></p>`,
      );
    },
  },
  emailVerification: {
    sendOnSignUp: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await deliverEmail(
        user.email,
        "Подтверждение почты — Квант-знаний",
        `Подтвердите адрес электронной почты: ${url}`,
        `<p><a href="${url}">Подтвердить электронную почту</a></p>`,
      );
    },
  },
  socialProviders: {
    ...(google
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          },
        }
      : {}),
    ...(github
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
          },
        }
      : {}),
    ...(discord
      ? {
          discord: {
            clientId: process.env.DISCORD_CLIENT_ID as string,
            clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
          },
        }
      : {}),
  },
  plugins: [
    phoneNumber({
      requireVerification: true,
      sendOTP: async ({ phoneNumber: number, code }) => deliverPhoneCode(number, code),
      signUpOnVerification: {
        getTempEmail: (number) => `phone_${number.replace(/\D/g, "")}@phone.local`,
        getTempName: (number) => number,
      },
    }),
    telegramAuth(),
  ],
  user: {
    additionalFields: {
      nickname: { type: "string", required: false, input: true },
    },
  },
  trustedOrigins: [
    appUrl,
    ...(process.env.NODE_ENV === "production"
      ? []
      : [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "http://localhost:7100",
          "http://127.0.0.1:7100",
        ]),
  ],
});

export type Auth = typeof auth;
