import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession().catch(() => null);
  redirect(session ? "/dashboard" : "/preview");
}
