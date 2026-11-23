// Kept as SQL as well as Drizzle definitions so a fresh self-hosted instance can
// bootstrap without generating types or connecting a separate migration service.
export const initialMigration = `
CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  phone_number text UNIQUE,
  phone_number_verified boolean,
  nickname text
);
CREATE TABLE IF NOT EXISTS session (
  id text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS account (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_user_id_idx ON account(user_id);
CREATE TABLE IF NOT EXISTS verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS classes_user_name_unique ON classes(user_id, lower(name));
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_token text NOT NULL UNIQUE,
  created_by text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS group_members (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('starosta', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(group_id, user_id)
);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members(user_id);
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text NOT NULL,
  description text,
  due_date text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  image_url text,
  attachment_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS assignments_user_id_idx ON assignments(user_id);
CREATE INDEX IF NOT EXISTS assignments_group_id_idx ON assignments(group_id);
CREATE TABLE IF NOT EXISTS schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES "user"(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  day_of_week integer NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
  start_time text NOT NULL,
  end_time text,
  location text,
  note text,
  color text CHECK(color IS NULL OR color IN ('blue','emerald','amber','rose','violet')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK((user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS schedule_entries_user_id_idx ON schedule_entries(user_id);
CREATE INDEX IF NOT EXISTS schedule_entries_group_id_idx ON schedule_entries(group_id);
CREATE TABLE IF NOT EXISTS retention_settings (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  delete_after_days integer NOT NULL DEFAULT 30 CHECK(delete_after_days BETWEEN 1 AND 3650),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;
