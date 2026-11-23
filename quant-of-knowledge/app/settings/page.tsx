import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { MoreCapabilities } from "@/components/settings/more-capabilities";
import { RetentionCard } from "@/components/settings/retention-card";
import { SettingsContent } from "@/components/settings-content";
import { TimeZoneProvider } from "@/components/timezone-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth-user";
import { readRetentionPolicy } from "@/lib/data/retention";
import { capabilities, proSection } from "@/lib/pro";
import { getTimeZone } from "@/lib/timezone-server";

export const dynamic = "force-dynamic";
function SettingsLoading() {
  return <div className="space-y-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-72 w-full" /></div>;
}
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const ApiTokens = proSection("settings-api-tokens");
  const Retention = proSection("settings-retention");
  const CalendarFeed = proSection("settings-calendar-feed");
  const Reminders = proSection("settings-reminders");
  const AccountType = proSection("header-account-type");
  const available = await capabilities(user.id);
  return (
    <div className="min-h-screen bg-background">
      <Header user={user} accountType={AccountType ? <AccountType /> : null} />
      <main className="w-full py-6 px-6 md:px-10 lg:px-16"><div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Настройки</h1>
        <Suspense fallback={<SettingsLoading />}><TimeZoneProvider initialTimeZone={await getTimeZone()}>
          <SettingsContent user={user}
            extraGeneralPanel={<>{ApiTokens ? <ApiTokens /> : null}<MoreCapabilities capabilities={available} /></>}
            retentionPanel={Retention ? <Retention /> : <RetentionCard policy={await readRetentionPolicy(user.id)} />}
            extraAssignmentsPanel={<>{Reminders ? <Reminders /> : null}{CalendarFeed ? <CalendarFeed /> : null}</>}
          />
        </TimeZoneProvider></Suspense>
      </div></main>
    </div>
  );
}
