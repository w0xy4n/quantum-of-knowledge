"use client";

import { ArrowRight, CalendarDays, CheckCircle2, ListChecks, Loader2, Orbit, Phone, Send } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import DiscordIcon from "@/components/icons/DiscordIcon";
import GitHubIcon from "@/components/icons/GitHubIcon";
import GoogleIcon from "@/components/icons/GoogleIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function safeNext(value: string | null): string { return value && /^\/(?!\/)/.test(value) ? value : "/dashboard"; }
function Brand() {
  return <Link href="/preview" className="relative inline-flex w-fit items-center gap-2.5 rounded-xl" aria-label="Квант-знаний — открыть демо"><span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Orbit className="size-5" /></span><span className="text-lg font-extrabold tracking-[-0.035em]">Квант<span className="text-primary">·</span>знаний</span></Link>;
}
interface Providers { google: boolean; github: boolean; discord: boolean; telegramBot: string | null }
interface TelegramUser { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string; auth_date: number; hash: string }

function LoginForm() {
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+7");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [providers, setProviders] = useState<Providers>({ google: false, github: false, discord: false, telegramBot: null });
  const telegramRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const fail = (error: unknown) => { setMessageIsError(true); setMessage(error instanceof Error ? error.message : "Произошла ошибка"); };
  const finish = () => { router.push(next); router.refresh(); };
  useEffect(() => { fetch("/api/auth-config").then((response) => response.json()).then(setProviders).catch(() => undefined); }, []);

  useEffect(() => {
    if (!providers.telegramBot || !telegramRef.current) return;
    const callback = async (telegramUser: TelegramUser) => {
      setLoading(true); setMessage("");
      try {
        const response = await fetch("/api/auth/telegram/sign-in", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(telegramUser) });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message || body?.error || "Не удалось войти через Telegram.");
        finish();
      } catch (error) { fail(error); } finally { setLoading(false); }
    };
    (window as unknown as { onTelegramAuth: typeof callback }).onTelegramAuth = callback;
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.dataset.telegramLogin = providers.telegramBot;
    script.dataset.size = "large";
    script.dataset.userpic = "false";
    script.dataset.onauth = "onTelegramAuth(user)";
    script.dataset.requestAccess = "write";
    telegramRef.current.replaceChildren(script);
    return () => { script.remove(); };
  }, [providers.telegramBot]);

  const handleEmail = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setMessage(""); setMessageIsError(false);
    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({ email, password, name: email.split("@")[0], callbackURL: next });
        if (result.error) throw new Error(result.error.message);
        if (result.data?.token) finish();
        else setMessage("Проверьте почту: мы отправили ссылку для подтверждения регистрации.");
      } else {
        const result = await authClient.signIn.email({ email, password, callbackURL: next });
        if (result.error) throw new Error(result.error.message);
        finish();
      }
    } catch (error) { fail(error); } finally { setLoading(false); }
  };
  const sendCode = async (event?: React.FormEvent) => {
    event?.preventDefault(); setLoading(true); setMessage(""); setMessageIsError(false);
    try {
      const result = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
      if (result.error) throw new Error(result.error.message);
      setCodeSent(true); setMessage("Код отправлен. В режиме разработки без SMS-провайдера он выводится в консоль сервера.");
    } catch (error) { fail(error); } finally { setLoading(false); }
  };
  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setMessage(""); setMessageIsError(false);
    try {
      const result = await authClient.phoneNumber.verify({ phoneNumber: phone, code });
      if (result.error) throw new Error(result.error.message);
      finish();
    } catch (error) { fail(error); } finally { setLoading(false); }
  };
  const social = async (provider: "google" | "github" | "discord") => {
    setLoading(true); setMessage("");
    const result = await authClient.signIn.social({ provider, callbackURL: next });
    if (result.error) { fail(result.error); setLoading(false); }
  };

  return <div className="min-h-dvh bg-background"><div className="mx-auto grid min-h-dvh w-full max-w-[1440px] lg:grid-cols-[1.05fr_0.95fr]">
    <section className="relative hidden flex-col justify-between overflow-hidden px-12 py-12 lg:flex xl:px-16 xl:py-16"><Orbit strokeWidth={0.7} className="pointer-events-none absolute -right-28 -top-28 size-[26rem] text-primary/10 blur-2xl" /><Brand /><div className="relative max-w-2xl py-12"><p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-primary">Учёба без хаоса</p><h1 className="max-w-xl text-5xl font-extrabold leading-[1.08] tracking-[-0.055em] xl:text-6xl">Просто. Лаконично. Удобно</h1><p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">Задания, дедлайны и приоритеты собраны в одном месте.</p><div className="mt-10 grid max-w-xl grid-cols-3 gap-3"><div className="rounded-2xl border bg-card p-4"><CalendarDays className="mb-5 size-5 text-primary" /><p className="text-sm font-bold">Неделя под контролем</p></div><div className="rounded-2xl border bg-card p-4"><ListChecks className="mb-5 size-5 text-primary" /><p className="text-sm font-bold">Понятные приоритеты</p></div><div className="rounded-2xl border bg-card p-4"><CheckCircle2 className="mb-5 size-5 text-primary" /><p className="text-sm font-bold">Видимый прогресс</p></div></div></div><p className="relative text-sm text-muted-foreground">Планируйте спокойно. Выполняйте уверенно.</p></section>
    <section className="relative flex items-center justify-center overflow-hidden border-border/70 px-4 py-8 sm:px-8 lg:border-l lg:bg-card/40 lg:px-12"><div className="relative w-full max-w-md"><div className="mb-8 lg:hidden"><Brand /></div>
      <Card className="gap-5 rounded-3xl py-7 shadow-xl shadow-primary/5 sm:py-8"><CardHeader className="gap-2 px-6 sm:px-8"><CardTitle className="text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">{isSignUp && mode === "email" ? "Создать аккаунт" : "С возвращением"}</CardTitle><CardDescription>Выберите удобный способ входа</CardDescription></CardHeader>
        <CardContent className="px-6 sm:px-8">
          <div className="mb-5 grid grid-cols-2 rounded-xl bg-muted p-1"><Button variant={mode === "email" ? "default" : "ghost"} onClick={() => { setMode("email"); setMessage(""); }}>Почта</Button><Button variant={mode === "phone" ? "default" : "ghost"} onClick={() => { setMode("phone"); setMessage(""); }}><Phone className="size-4" />Телефон</Button></div>
          {mode === "email" ? <form onSubmit={handleEmail} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Электронная почта</Label><Input id="email" type="email" placeholder="name@example.com" autoComplete="email" className="h-11 rounded-xl bg-background" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="password">Пароль</Label><Input id="password" type="password" placeholder="Минимум 6 символов" autoComplete={isSignUp ? "new-password" : "current-password"} className="h-11 rounded-xl bg-background" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></div><Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>{loading && <Loader2 className="size-4 animate-spin" />}{isSignUp ? "Зарегистрироваться" : "Войти"}<ArrowRight className="size-4" /></Button></form> :
            <form onSubmit={codeSent ? verifyCode : sendCode} className="space-y-4"><div className="space-y-2"><Label htmlFor="phone">Номер телефона</Label><Input id="phone" type="tel" placeholder="+79991234567" autoComplete="tel" className="h-11 rounded-xl bg-background" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={codeSent} required /></div>{codeSent && <div className="space-y-2"><Label htmlFor="code">Код из SMS</Label><Input id="code" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className="h-11 rounded-xl bg-background" value={code} onChange={(e) => setCode(e.target.value)} required /></div>}<Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>{loading && <Loader2 className="size-4 animate-spin" />}{codeSent ? "Подтвердить и войти" : "Получить код"}</Button>{codeSent && <Button type="button" variant="link" className="w-full" onClick={() => { setCodeSent(false); setCode(""); }}>Изменить номер</Button>}</form>}
          {message && <p role="alert" className={`mt-4 rounded-xl border px-3 py-2.5 text-sm ${messageIsError ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"}`}>{message}</p>}
          {mode === "email" && <Button variant="link" className="mt-3 w-full" onClick={() => { setIsSignUp(!isSignUp); setMessage(""); }}>{isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}</Button>}
          {(providers.google || providers.github || providers.discord) && <div className="mt-5 space-y-2 border-t pt-5"><p className="text-center text-xs text-muted-foreground">Или через сервис</p>{providers.google && <Button variant="outline" className="w-full" disabled={loading} onClick={() => social("google")}><GoogleIcon />Google</Button>}{providers.github && <Button variant="outline" className="w-full" disabled={loading} onClick={() => social("github")}><GitHubIcon />GitHub</Button>}{providers.discord && <Button variant="outline" className="w-full" disabled={loading} onClick={() => social("discord")}><DiscordIcon />Discord</Button>}</div>}
          {providers.telegramBot && <div className="mt-5 border-t pt-5"><p className="mb-3 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><Send className="size-3" />Вход через Telegram</p><div ref={telegramRef} className="flex min-h-10 justify-center" /></div>}
          <div className="mt-5 border-t pt-5 text-center"><Button variant="ghost" asChild><Link href="/preview">Сначала посмотреть демо</Link></Button></div>
        </CardContent>
      </Card>
    </div></section>
  </div></div>;
}
export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }
