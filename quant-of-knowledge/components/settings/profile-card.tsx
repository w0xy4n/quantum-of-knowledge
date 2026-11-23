"use client";

import type { AppUser } from "@/lib/auth-user";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api/client";

/** Имя и никнейм хранятся в нашей таблице пользователей. */
export function ProfileCard({ user }: { user: AppUser }) {
  const router = useRouter();
  const { toast } = useToast();

  const [fullName, setFullName] = useState<string>(user.user_metadata?.full_name ?? "");
  const [nickname, setNickname] = useState<string>(user.user_metadata?.nickname ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest("/api/account/profile", {
        method: "PATCH",
        body: JSON.stringify({ fullName: fullName.trim(), nickname: nickname.trim() }),
      });
    } catch {
      setSaving(false);
      toast({
        variant: "destructive",
        title: "Не удалось сохранить профиль",
        description: "Попробуйте ещё раз.",
      });
      return;
    }
    setSaving(false);

    toast({ title: "Профиль обновлён" });
    // Серверные компоненты (шапка, эта страница) перечитывают сессию.
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Профиль</CardTitle>
        <CardDescription>Как вас видно в приложении: ФИО и никнейм</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="profile-full-name">ФИО</Label>
          <Input
            id="profile-full-name"
            placeholder="Иванов Иван Иванович"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={200}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="profile-nickname">Никнейм</Label>
          <Input
            id="profile-nickname"
            placeholder="Например, kvant"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">Показывается вместо имени, если заполнен.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
          Сохранить
        </Button>
      </CardContent>
    </Card>
  );
}
