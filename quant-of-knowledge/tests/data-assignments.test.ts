import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

interface Call { path: string; init: RequestInit }
let calls: Call[] = [];
let failure: Error | null = null;
mock.module("@/lib/api/client", () => ({
  apiRequest: async (path: string, init: RequestInit = {}) => {
    calls.push({ path, init });
    if (failure) throw failure;
    return { ok: true };
  },
}));
let data: typeof import("@/lib/data/assignments");
beforeAll(async () => { data = await import("@/lib/data/assignments"); });
beforeEach(() => { calls = []; failure = null; });
const DRAFT = { title: "Essay", subject: "History", description: null, due_date: null, priority: "high" } as const;

describe("assignment API writes", () => {
  test("creates one assignment without trusting a user id from the caller", async () => {
    await data.createAssignment(DRAFT);
    expect(calls[0].path).toBe("/api/assignments");
    expect(calls[0].init.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init.body))).toEqual(DRAFT);
  });
  test("creates an import in one batch request", async () => {
    await data.createAssignments([DRAFT, { ...DRAFT, title: "Lab" }]);
    expect(calls).toHaveLength(1);
    expect(JSON.parse(String(calls[0].init.body))).toHaveLength(2);
  });
  test("an empty import costs no request", async () => {
    await data.createAssignments([]);
    expect(calls).toHaveLength(0);
  });
  test("updates only supplied fields", async () => {
    await data.updateAssignment("a-1", { title: "Renamed" });
    expect(calls[0].path).toBe("/api/assignments/a-1");
    expect(calls[0].init.method).toBe("PATCH");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ title: "Renamed" });
  });
  test("completion and reopening send status only", async () => {
    await data.setAssignmentStatus("a-1", "completed");
    await data.setAssignmentStatus("a-1", "pending");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ status: "completed" });
    expect(JSON.parse(String(calls[1].init.body))).toEqual({ status: "pending" });
  });
  test("deletes the selected assignment", async () => {
    await data.deleteAssignment("a-1");
    expect(calls[0].path).toBe("/api/assignments/a-1");
    expect(calls[0].init.method).toBe("DELETE");
  });
  test("every rejected write throws a readable AssignmentWriteError", async () => {
    failure = new Error("Сервер отклонил запрос");
    const writes = [
      () => data.createAssignment(DRAFT),
      () => data.createAssignments([DRAFT]),
      () => data.updateAssignment("a", { title: "x" }),
      () => data.setAssignmentStatus("a", "completed"),
      () => data.deleteAssignment("a"),
    ];
    for (const write of writes) {
      await expect(write()).rejects.toBeInstanceOf(data.AssignmentWriteError);
      await expect(write()).rejects.toThrow("Сервер отклонил запрос");
    }
  });
});
