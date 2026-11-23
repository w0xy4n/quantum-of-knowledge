"use client";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api/client";

function JoinForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Загрузка...");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function join() {
      if (!token) { setStatus("Ошибка: токен не найден."); return; }
      const session = await authClient.getSession();
      if (!session.data?.user) { router.push(`/auth/login?next=${encodeURIComponent(`/join?token=${token}`)}`); return; }
      try {
        const result = await apiRequest<{ already_member: boolean; group_name: string }>("/api/groups/join", { method: "POST", body: JSON.stringify({ token }) });
        setStatus(result.already_member ? `Вы уже состоите в группе «${result.group_name}»` : `Вы успешно присоединились к группе «${result.group_name}»!`);
        setTimeout(() => router.push("/dashboard"), 1500);
      } catch (error) { setStatus(error instanceof Error ? error.message : "Не удалось вступить в группу."); }
    }
    join();
  }, [token, router]);
  return <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" /><h1 className="text-xl font-semibold">{status}</h1></div>;
}
export default function JoinPage() { return <Suspense fallback={<div>Загрузка...</div>}><JoinForm /></Suspense>; }
