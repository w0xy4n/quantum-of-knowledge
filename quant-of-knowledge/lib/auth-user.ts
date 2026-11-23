import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ensureDatabase } from "@/lib/db";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  phone: string | null;
  created_at: string;
  user_metadata: {
    full_name: string;
    name: string;
    nickname?: string | null;
    avatar_url?: string | null;
    picture?: string | null;
  };
  app_metadata: {
    provider: string;
    providers: string[];
  };
}

export async function getSession(headersValue?: HeadersInit) {
  await ensureDatabase();
  const requestHeaders = headersValue ? new Headers(headersValue) : await headers();
  return auth.api.getSession({ headers: requestHeaders });
}

export async function getCurrentUser(headersValue?: HeadersInit): Promise<AppUser | null> {
  const result = await getSession(headersValue);
  if (!result) return null;

  const current = result.user;
  const accounts = await auth.api.listUserAccounts({
    headers: headersValue ? new Headers(headersValue) : await headers(),
  });
  const providers = accounts.map((item) => item.providerId);
  return {
    id: current.id,
    email: current.email,
    name: current.name,
    image: current.image ?? null,
    phone: "phoneNumber" in current ? ((current.phoneNumber as string | null) ?? null) : null,
    created_at: current.createdAt.toISOString(),
    user_metadata: {
      full_name: current.name,
      name: current.name,
      nickname: "nickname" in current ? ((current.nickname as string | null) ?? null) : null,
      avatar_url: current.image ?? null,
      picture: current.image ?? null,
    },
    app_metadata: {
      provider: providers[0] || "email",
      providers,
    },
  };
}
