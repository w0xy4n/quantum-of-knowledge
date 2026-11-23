import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AssignmentsList } from "@/components/assignments-list";
import { Header } from "@/components/header";
import { TimeZoneProvider } from "@/components/timezone-provider";
import { getCurrentUser } from "@/lib/auth-user";
import { fetchDashboardData } from "@/lib/data/dashboard";
import { proSection } from "@/lib/pro";
import { proClientSection } from "@/lib/pro/client";
import { getTimeZone } from "@/lib/timezone-server";

export const dynamic = "force-dynamic";

function AssignmentsLoading() {
  return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const dashboardData = await fetchDashboardData(user.id);
  const timeZone = await getTimeZone();
  const AccountType = proSection("header-account-type");
  const OnLoad = proClientSection("dashboardOnLoad");

  return (
    <div className="min-h-dvh bg-background">
      <Header user={user} accountType={AccountType ? <AccountType /> : null} />
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 md:px-10 lg:px-16 lg:py-10">
        <Suspense fallback={<AssignmentsLoading />}>
          <TimeZoneProvider initialTimeZone={timeZone}>
            <AssignmentsList initialData={dashboardData.assignments} />
            {OnLoad ? <OnLoad /> : null}
          </TimeZoneProvider>
        </Suspense>
      </main>
    </div>
  );
}
