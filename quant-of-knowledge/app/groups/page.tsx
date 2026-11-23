"use client";

import { Check, Copy, Loader2, LogOut, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api/client";

interface Membership { group_id: string; role: string; groups: { id: string; name: string; invite_token: string; created_by: string } | null }
interface MemberInfo { user_id: string; role: string; email: string; full_name: string | null; nickname: string | null; joined_at: string }
interface Directory { userId: string; memberships: Membership[]; members: Record<string, MemberInfo[]> }

export default function GroupsPage() {
  const [groups, setGroups] = useState<Membership[]>([]);
  const [members, setMembers] = useState<Record<string, MemberInfo[]>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<Membership | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Membership | null>(null);
  const [acting, setActing] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const result = await apiRequest<Directory>("/api/groups?includeMembers=1");
      setUserId(result.userId); setGroups(result.memberships); setMembers(result.members);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось загрузить группы."); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const createGroup = async () => {
    const name = groupName.trim(); if (!name) return;
    setCreating(true); setError(null);
    try { await apiRequest("/api/groups", { method: "POST", body: JSON.stringify({ name }) }); setCreateOpen(false); setGroupName(""); await fetchData(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось создать группу."); }
    setCreating(false);
  };
  const leaveGroup = async () => {
    if (!leaveTarget) return; setActing(true);
    try { await apiRequest(`/api/groups/${leaveTarget.group_id}/leave`, { method: "POST" }); setLeaveTarget(null); await fetchData(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось выйти из группы."); }
    setActing(false);
  };
  const deleteGroup = async () => {
    if (!deleteTarget) return; setActing(true);
    try { await apiRequest(`/api/groups/${deleteTarget.group_id}`, { method: "DELETE" }); setDeleteTarget(null); await fetchData(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось удалить группу."); }
    setActing(false);
  };
  const copyInviteLink = async (membership: Membership) => {
    if (!membership.groups) return;
    await navigator.clipboard.writeText(`${window.location.origin}/join?token=${membership.groups.invite_token}`);
    setCopiedId(membership.group_id); setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="container max-w-2xl py-8 px-4 mx-auto">
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">Мои группы</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button><Users className="mr-2 h-4 w-4" />Создать группу</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Новая группа</DialogTitle><DialogDescription>Вы станете старостой и сможете отправлять задания всем участникам.</DialogDescription></DialogHeader>
            <div className="grid gap-2 py-2"><Label htmlFor="group-name">Название группы</Label><Input id="group-name" placeholder="Например, ИВТ-21" value={groupName} onChange={(e) => setGroupName(e.target.value)} maxLength={100} autoFocus onKeyDown={(e) => { if (e.key === "Enter") createGroup(); }} /></div>
            <DialogFooter><Button onClick={createGroup} disabled={creating || !groupName.trim()}>{creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Создать</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      {groups.length === 0 ? <div className="text-center py-12 border rounded-lg bg-muted/50"><p className="text-muted-foreground">Вы пока не состоите ни в одной группе. Создайте свою или попросите ссылку у старосты.</p></div> :
        <div className="grid gap-4">{groups.map((member) => <Card key={member.group_id}>
          <CardHeader><CardTitle className="flex justify-between items-center gap-2"><span className="truncate">{member.groups?.name}</span>{member.role !== "starosta" && <span className="text-xs font-normal px-2 py-1 bg-muted text-muted-foreground rounded-full">Участник</span>}</CardTitle><CardDescription>Ссылка для приглашения одногруппников:</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-3"><code className="bg-muted p-2 rounded text-xs break-all w-full">{`${typeof window !== "undefined" ? window.location.origin : ""}/join?token=${member.groups?.invite_token}`}</code>
            {(members[member.group_id]?.length ?? 0) > 0 && <div className="rounded-md border"><p className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">Участники ({members[member.group_id].length})</p><ul className="divide-y">
              {members[member.group_id].map((m) => { const isOwner = m.user_id === member.groups?.created_by; const displayName = m.nickname || m.full_name || m.email; return <li key={m.user_id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm"><span className="min-w-0"><span className="block truncate">{displayName}{m.user_id === userId && <span className="text-muted-foreground"> (вы)</span>}</span>{displayName !== m.email && <span className="block truncate text-xs text-muted-foreground">{m.email}</span>}</span><span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${isOwner ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{isOwner ? "Староста" : "Участник"}</span></li>; })}
            </ul></div>}
            <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => copyInviteLink(member)}>{copiedId === member.group_id ? <><Check className="mr-2 h-4 w-4" />Скопировано</> : <><Copy className="mr-2 h-4 w-4" />Скопировать ссылку</>}</Button>
              {member.role === "starosta" ? <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(member)}><Trash2 className="mr-2 h-4 w-4" />Удалить группу</Button> : <Button variant="outline" size="sm" onClick={() => setLeaveTarget(member)}><LogOut className="mr-2 h-4 w-4" />Выйти из группы</Button>}
            </div>
          </CardContent></Card>)}
        </div>}
      <Link href="/dashboard" className="text-sm text-primary mt-6 block hover:underline">← Вернуться к заданиям</Link>
      <AlertDialog open={!!leaveTarget} onOpenChange={(open) => !open && !acting && setLeaveTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Выйти из группы?</AlertDialogTitle><AlertDialogDescription>Вы перестанете видеть задания группы {leaveTarget?.groups?.name}.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={acting}>Отмена</AlertDialogCancel><Button variant="destructive" disabled={acting} onClick={leaveGroup}>Выйти</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !acting && setDeleteTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Удалить группу безвозвратно?</AlertDialogTitle><AlertDialogDescription>Участники потеряют доступ, а ваши групповые задания останутся личными.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={acting}>Отмена</AlertDialogCancel><Button variant="destructive" disabled={acting} onClick={deleteGroup}>Удалить</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
