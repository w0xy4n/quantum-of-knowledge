import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { contentSecurityPolicy, generateNonce } from "@/lib/security-headers";

const TOUCHED = ["NODE_ENV", "TELEGRAM_BOT_TOKEN", "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME"];
let saved: Record<string, string | undefined> = {};
function setEnv(name: string, value: string | undefined) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
beforeEach(() => {
  saved = Object.fromEntries(TOUCHED.map((name) => [name, process.env[name]]));
  for (const name of TOUCHED) if (name !== "NODE_ENV") setEnv(name, undefined);
});
afterEach(() => { for (const [name, value] of Object.entries(saved)) setEnv(name, value); });
function directive(policy: string, name: string): string[] {
  const found = policy.split("; ").find((part) => part === name || part.startsWith(`${name} `));
  return found ? found.split(" ").slice(1) : [];
}

describe("generateNonce", () => {
  test("is 16 random bytes encoded as base64", () => {
    const nonce = generateNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(atob(nonce).length).toBe(16);
  });
  test("never repeats", () => expect(new Set(Array.from({ length: 500 }, generateNonce)).size).toBe(500));
});
describe("contentSecurityPolicy", () => {
  test("carries one nonce and strict-dynamic", () => {
    const policy = contentSecurityPolicy("Rk9PQkFSRk9PQkFSRk8=");
    expect(directive(policy, "script-src")).toContain("'nonce-Rk9PQkFSRk9PQkFSRk8='");
    expect(policy.match(/'nonce-/g)?.length).toBe(1);
    expect(directive(policy, "script-src")).toContain("'strict-dynamic'");
  });
  test("locks down embedding and connections to our own origin", () => {
    const policy = contentSecurityPolicy("abc");
    expect(directive(policy, "default-src")).toEqual(["'self'"]);
    expect(directive(policy, "object-src")).toEqual(["'none'"]);
    expect(directive(policy, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(policy, "frame-src")).toEqual(["'none'"]);
    expect(directive(policy, "connect-src")).toEqual(["'self'", "https://va.vercel-scripts.com"]);
  });
  test("allows Telegram frames only when Telegram login is fully configured", () => {
    setEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "example_bot");
    setEnv("TELEGRAM_BOT_TOKEN", "secret");
    expect(directive(contentSecurityPolicy("abc"), "frame-src")).toEqual(["https://oauth.telegram.org"]);
  });
  test("is a single well-formed header", () => {
    const policy = contentSecurityPolicy("abc");
    expect(policy).not.toContain("\n");
    expect(policy.endsWith(";")).toBe(false);
    expect(policy).not.toContain("undefined");
  });
  test("uses eval only for the development bundler", () => {
    setEnv("NODE_ENV", "production");
    expect(directive(contentSecurityPolicy("abc"), "script-src")).not.toContain("'unsafe-eval'");
    setEnv("NODE_ENV", "development");
    expect(directive(contentSecurityPolicy("abc"), "script-src")).toContain("'unsafe-eval'");
  });
});
