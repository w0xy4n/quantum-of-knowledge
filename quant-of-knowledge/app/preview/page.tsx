import { addDays, subDays } from "date-fns";
import { Header } from "@/components/header";
import { PreviewAssignmentsList } from "@/components/preview-assignments-list";
import { TimeZoneProvider } from "@/components/timezone-provider";
import { getTimeZone } from "@/lib/timezone-server";
import type { Assignment } from "@/lib/types";

// Reading the visitor's timezone renders this page per request, which also keeps
// the mock due dates below relative to "now" instead of freezing them at build time.

function createMockAssignments(): Assignment[] {
  const now = new Date();

  return [
    {
      id: "1",
      user_id: "preview-user",
      class_id: null,
      group_id: null,
      image_url: null,
      attachment_urls: [],
      title: "Домашняя работа, глава 5",
      subject: "Математика",
      description: "Решить упражнения 1–20 на квадратные уравнения",
      due_date: addDays(now, 2).toISOString(),
      priority: "high",
      status: "pending",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      completed_at: null,
    },
    {
      id: "2",
      user_id: "preview-user",
      class_id: null,
      group_id: null,
      image_url: null,
      attachment_urls: [],
      title: "Эссе по истории",
      subject: "История",
      description: "Написать 1000 слов о промышленной революции",
      due_date: addDays(now, 5).toISOString(),
      priority: "medium",
      status: "pending",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      completed_at: null,
    },
    {
      id: "3",
      user_id: "preview-user",
      class_id: null,
      group_id: null,
      image_url: null,
      attachment_urls: [],
      title: "Лабораторная по физике",
      subject: "Физика",
      description: "Оформить результаты опыта с маятником",
      due_date: subDays(now, 1).toISOString(),
      priority: "high",
      status: "pending",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      completed_at: null,
    },
    {
      id: "4",
      user_id: "preview-user",
      class_id: null,
      group_id: null,
      image_url: null,
      attachment_urls: [],
      title: "Чтение по английскому",
      subject: "Английский язык",
      description: "Прочитать главы 10–15 «Убить пересмешника»",
      due_date: addDays(now, 1).toISOString(),
      priority: "low",
      status: "completed",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      // Recent, so the preview shows a completed card rather than one the
      // retention sweep would have taken. Nothing is deleted here — there is no
      // account and no database — but the sample should look like what a real
      // list holds.
      completed_at: subDays(now, 1).toISOString(),
    },
    {
      id: "5",
      user_id: "preview-user",
      class_id: null,
      group_id: null,
      image_url: null,
      attachment_urls: [],
      title: "Подготовка к контрольной",
      subject: "Химия",
      description: "Выучить таблицу Менделеева и химические связи",
      due_date: addDays(now, 3).toISOString(),
      priority: "medium",
      status: "pending",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      completed_at: null,
    },
    {
      id: "6",
      user_id: "preview-user",
      class_id: null,
      group_id: null,
      image_url: null,
      attachment_urls: [],
      title: "Эскиз проекта",
      subject: "Искусство",
      description: "Сделать черновые наброски к итоговому проекту",
      due_date: addDays(now, 6).toISOString(),
      priority: "low",
      status: "pending",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      completed_at: null,
    },
  ];
}

export default async function PreviewPage() {
  const mockUser = {
    id: "preview-user",
    email: "student@example.com",
    name: "Студент",
    image: null,
    phone: null,
    created_at: new Date(0).toISOString(),
    user_metadata: { full_name: "Студент", name: "Студент", avatar_url: null },
    app_metadata: { provider: "email", providers: ["email"] },
  };

  return (
    <div className="min-h-dvh bg-background">
      <Header user={mockUser} isPreview />
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 md:px-10 lg:px-16 lg:py-10">
        <TimeZoneProvider initialTimeZone={await getTimeZone()}>
          <PreviewAssignmentsList initialAssignments={createMockAssignments()} />
        </TimeZoneProvider>
      </main>
    </div>
  );
}
