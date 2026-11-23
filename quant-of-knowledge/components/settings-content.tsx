"use client";

import type { AppUser } from "@/lib/auth-user";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { AppearanceTab } from "@/components/settings/appearance-tab";
import { ClassesManager } from "@/components/settings/classes-manager";
import { GeneralTab } from "@/components/settings/general-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = ["general", "assignments", "appearance"] as const;
type SettingsTab = (typeof TABS)[number];

function asTab(value: string | null): SettingsTab {
  return (TABS as readonly string[]).includes(value ?? "") ? (value as SettingsTab) : "general";
}

interface SettingsContentProps {
  user: AppUser;
  extraGeneralPanel?: ReactNode;
  retentionPanel: ReactNode;
  extraAssignmentsPanel?: ReactNode;
}

export function SettingsContent({
  user,
  extraGeneralPanel,
  retentionPanel,
  extraAssignmentsPanel,
}: SettingsContentProps) {
  const searchParams = useSearchParams();

  return (
    <Tabs defaultValue={asTab(searchParams.get("tab"))} className="w-full">
      <TabsList aria-label="Разделы настроек" className="w-full">
        <TabsTrigger value="general" className="flex-1">
          Общие
        </TabsTrigger>
        <TabsTrigger value="assignments" className="flex-1">
          Задания
        </TabsTrigger>
        <TabsTrigger value="appearance" className="flex-1">
          Внешний вид
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-6 space-y-6">
        <GeneralTab user={user} />
        {extraGeneralPanel}
      </TabsContent>

      <TabsContent value="assignments" className="mt-6 space-y-6">
        <ClassesManager userId={user.id} />
        {retentionPanel}
        {extraAssignmentsPanel}
      </TabsContent>

      <TabsContent value="appearance" className="mt-6 space-y-6">
        <AppearanceTab />
      </TabsContent>

      <p className="mt-10 text-center text-sm text-muted-foreground/70">
        Совет: нажмите на логотип «Квант-знаний», чтобы вернуться на главную!
      </p>
    </Tabs>
  );
}
