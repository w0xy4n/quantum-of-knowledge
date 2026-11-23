import type { AppUser } from "@/lib/auth-user";
import { getCurrentUser } from "@/lib/auth-user";
import { isSameOriginRequest } from "@/lib/security/origin";
import { clientAddress, rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { ApiError, problem } from "./http";

export interface UserContext<P = unknown> {
  readonly user: AppUser;
  readonly params: P;
}
export interface Limit {
  readonly limit: number;
  readonly windowMs: number;
}
export interface WithUserOptions {
  readonly name: string;
  readonly perAddress?: Limit;
  readonly perUser?: Limit;
}
const DEFAULT_PER_ADDRESS: Limit = { limit: 240, windowMs: 60_000 };
const DEFAULT_PER_USER: Limit = { limit: 120, windowMs: 60_000 };
export type UserHandler<P = unknown> = (request: Request, context: UserContext<P>) => Promise<Response>;
export interface RouteContext<P> {
  params: Promise<P>;
}

export function withUser<P = unknown>(options: WithUserOptions, handler: UserHandler<P>) {
  const perAddress = options.perAddress ?? DEFAULT_PER_ADDRESS;
  const perUser = options.perUser ?? DEFAULT_PER_USER;
  return async function route(request: Request, routeContext: RouteContext<P>): Promise<Response> {
    if (!isSameOriginRequest(request)) return problem(403, "Запрос пришёл не из приложения");
    const byAddress = rateLimit(`${options.name}:addr:${clientAddress(request)}`, perAddress.limit, perAddress.windowMs);
    if (!byAddress.allowed) return tooManyRequests(byAddress, "Too many requests. Please wait a moment and try again.");

    try {
      const user = await getCurrentUser(request.headers);
      if (!user) return problem(401, "You are not signed in.");
      const byUser = rateLimit(`${options.name}:user:${user.id}`, perUser.limit, perUser.windowMs);
      if (!byUser.allowed) return tooManyRequests(byUser, "Too many requests. Please wait a moment and try again.");
      const params = (routeContext ? await routeContext.params : undefined) as P;
      return await handler(request, { user, params });
    } catch (thrown) {
      if (thrown instanceof ApiError) return problem(thrown.status, thrown.message);
      console.error(`Unhandled error in ${options.name}:`, thrown);
      return problem(500, "Something went wrong on our end. Please try again.");
    }
  };
}
