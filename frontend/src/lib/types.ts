export type DealStage = "lead" | "contacted" | "proposal" | "won" | "lost";

export const DEAL_STAGES: DealStage[] = ["lead", "contacted", "proposal", "won", "lost"];

export const STAGE_LABELS: Record<DealStage, string> = {
  lead: "Lead",
  contacted: "Contacted",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

export interface Company {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  logo_hue: number;
  created_at: string;
}

export interface Contact {
  id: number;
  company_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
}

export interface Deal {
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

export interface Reminder {
  id: number;
  deal_id: number | null;
  title: string;
  due_at: string;
  done: boolean;
  created_at: string;
  deal_title?: string | null;
}

export interface ReportSummary {
  byStage: { stage: DealStage; count: number; amount: number }[];
  revenueOverTime: { month: string; revenue: number; deals: number }[];
  totals: {
    won: number;
    lost: number;
    open: number;
    pipelineValue: number;
    wonValue: number;
    conversionRate: number;
  };
}
