export type DealStage = "lead" | "contacted" | "proposal" | "won" | "lost";

export const DEAL_STAGES: DealStage[] = ["lead", "contacted", "proposal", "won", "lost"];

export interface CompanyRow {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  logo_hue: number;
  created_at: string;
}

export interface ContactRow {
  id: number;
  company_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
}

export interface DealRow {
  id: number;
  title: string;
  company_id: number | null;
  contact_id: number | null;
  stage: DealStage;
  amount: string;
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  company_name?: string | null;
  contact_name?: string | null;
}

export interface ReminderRow {
  id: number;
  deal_id: number | null;
  title: string;
  due_at: string;
  done: boolean;
  created_at: string;
  deal_title?: string | null;
}
