"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { lazy, Suspense, useEffect, useState } from "react";
import useSWR from "swr";
import { AssignmentsBoard, useTabState } from "@/components/assignments/assignments-board";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAssignments } from "@/lib/data/queries";
import { authClient } from "@/lib/auth-client";
import { ASSIGNMENTS_KEY } from "@/lib/swr-keys";
import type { Assignment } from "@/lib/types";

const WeeklyView = lazy(() => import("@/components/weekly-view").then((module) => ({ default: module.WeeklyView })));
const AddAssignmentDialog = lazy(() =>
  import("@/components/add-assignment-dialog").then((module) => ({ default: module.AddAssignmentDialog })),
);

function WeeklyViewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton key={index} className="min-h-[100px]" />
      ))}
    </div>
  );
}

function AddButtonSkeleton() {
  return <Skeleton className="h-10 w-36" />;
}

interface AssignmentsListProps {
  initialData?: Assignment[];
}

export function AssignmentsList({ initialData }: AssignmentsListProps) {
  const {
    data: assignments,
    error,
    isLoading,
  } = useSWR(ASSIGNMENTS_KEY, fetchAssignments, {
    fallbackData: initialData,
    revalidateOnMount: !initialData,
    // Записи и так обновляют кэш через mutate() после каждой мутации,
    // поэтому лишний запрос на каждый возврат во вкладку не нужен.
    revalidateOnFocus: false,
  });

  const searchParams = useSearchParams();
  const [tab, setTab] = useTabState(searchParams.get("tab"));

  // Кто смотрит список — чтобы отличить свои задания от групповых.
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  useEffect(() => {
    authClient.getSession().then(({ data }) => setCurrentUserId(data?.user?.id));
  }, []);

  if (isLoading) {
    return (
      <div role="status" className="flex items-center justify-center py-12">
        <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="sr-only">Загрузка заданий</span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="text-center py-12">
        <p className="text-muted-foreground">Не удалось загрузить задания</p>
      </div>
    );
  }

  return (
    <AssignmentsBoard
      assignments={assignments || []}
      tab={tab}
      onTabChange={setTab}
      currentUserId={currentUserId}
      action={
        <Suspense fallback={<AddButtonSkeleton />}>
          <AddAssignmentDialog />
        </Suspense>
      }
      weeklyView={
        <Suspense fallback={<WeeklyViewSkeleton />}>
          <WeeklyView assignments={assignments || []} currentUserId={currentUserId} />
        </Suspense>
      }
    />
  );
}
