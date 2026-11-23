import { describe, expect, test } from "bun:test";
import { initialMigration } from "@/lib/db/migration";

describe("fresh self-hosted schema", () => {
  test("contains authentication and application tables", () => {
    for (const table of ["user", "session", "account", "verification", "assignments", "classes", "groups", "group_members", "schedule_entries", "retention_settings"]) {
      expect(initialMigration).toContain(`CREATE TABLE IF NOT EXISTS ${table === "user" ? '"user"' : table}`);
    }
  });
  test("keeps account and group cleanup in the database", () => {
    expect(initialMigration).toContain("ON DELETE CASCADE");
    expect(initialMigration).toContain("group_id uuid REFERENCES groups(id) ON DELETE SET NULL");
  });
  test("enforces assignment and schedule values", () => {
    expect(initialMigration).toContain("priority IN ('low', 'medium', 'high')");
    expect(initialMigration).toContain("status IN ('pending', 'completed')");
    expect(initialMigration).toContain("day_of_week BETWEEN 1 AND 7");
  });
});
