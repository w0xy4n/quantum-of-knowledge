"use client";

import type { AppUser } from "@/lib/auth-user";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { ExportDataButton } from "@/components/export-data-button";
import { ProfileCard } from "@/components/settings/profile-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Settings → General: who you are, getting your data out, and deleting the lot.
 */
export function GeneralTab({ user }: { user: AppUser }) {
  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : "U";
  const displayName =
    user.user_metadata?.nickname ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Пользователь";

  return (
    <>
      <ProfileCard user={user} />

      <Card>
        <CardHeader>
          <CardTitle>Информация об аккаунте</CardTitle>
          <CardDescription>Данные вашего аккаунта и профиля</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined} alt={displayName} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{displayName}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <Detail label="Адрес электронной почты" value={user.email || "Не указан"} />
            <Detail label="Отображаемое имя" value={displayName} />
            <Detail label="Аккаунт создан" value={formatDate(user.created_at)} />
            <Detail label="Телефон" value={user.phone || "Не указан"} />
            <Detail label="Способ входа" value={user.app_metadata?.provider || "Email"} capitalize />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ваши данные</CardTitle>
          <CardDescription>
            Скачайте всё, что Квант-знаний хранит о вас, — данные аккаунта и каждое задание — одним JSON-файлом.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExportDataButton />
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Опасная зона</CardTitle>
          <CardDescription>
            Удаление аккаунта сотрёт ваш профиль и все сохранённые задания. Это действие нельзя отменить.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog email={user.email || ""} />
        </CardContent>
      </Card>
    </>
  );
}

/**
 * One read-only field. A `<Label>` with no control is not a label, so this is a
 * plain caption over its value rather than five repeats of a broken association.
 */
function Detail({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium${capitalize ? " capitalize" : ""}`}>{value}</p>
    </div>
  );
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return "Нет данных";
  return new Date(dateString).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
}
