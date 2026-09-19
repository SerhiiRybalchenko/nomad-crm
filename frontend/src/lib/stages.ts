import type { DealStage } from "./types";

export interface StageMeta {
  stage: DealStage;
  label: string;
  color: string;
  soft: string;
}

export const STAGE_META: Record<DealStage, StageMeta> = {
  lead: { stage: "lead", label: "Lead", color: "var(--stage-lead)", soft: "var(--stage-lead-soft)" },
  contacted: { stage: "contacted", label: "Contacted", color: "var(--stage-contacted)", soft: "var(--stage-contacted-soft)" },
  proposal: { stage: "proposal", label: "Proposal", color: "var(--stage-proposal)", soft: "var(--stage-proposal-soft)" },
  won: { stage: "won", label: "Won", color: "var(--stage-won)", soft: "var(--stage-won-soft)" },
  lost: { stage: "lost", label: "Lost", color: "var(--stage-lost)", soft: "var(--stage-lost-soft)" },
};

export const STAGE_ORDER: DealStage[] = ["lead", "contacted", "proposal", "won", "lost"];
