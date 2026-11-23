"use client";
import useSWR from "swr";
import { apiRequest } from "@/lib/api/client";

const GROUP_NAMES_KEY = "group-names";
interface Membership { group_id: string; groups: { id: string; name: string } | null }
async function fetchGroupNames(): Promise<Record<string, string>> {
  const result = await apiRequest<{ memberships: Membership[] }>("/api/groups");
  return Object.fromEntries(result.memberships.filter((row) => row.groups).map((row) => [row.group_id, row.groups?.name ?? ""]));
}
export function useGroupNames(): Record<string, string> {
  const { data } = useSWR(GROUP_NAMES_KEY, fetchGroupNames);
  return data ?? {};
}
