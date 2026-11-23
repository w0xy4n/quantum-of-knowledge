import { json } from "@/lib/api/http";

export function GET() {
  return json({
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    discord: Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
    phone: true,
    telegramBot: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || null,
  });
}
