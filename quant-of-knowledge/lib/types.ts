export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "completed";

export interface Assignment {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  status: Status;
  class_id: string | null;
  group_id: string | null;
  image_url: string | null;
  attachment_urls: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Class {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_token: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: "starosta" | "member";
  created_at: string;
}
