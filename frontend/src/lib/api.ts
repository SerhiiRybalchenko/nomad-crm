import type { Company, Contact, Deal, DealStage, Reminder, ReportSummary } from "./types";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  companies: {
    list: () => request<Company[]>("/companies"),
  },
  contacts: {
    list: () => request<Contact[]>("/contacts"),
  },
  deals: {
    list: () => request<Deal[]>("/deals"),
    create: (input: {
      title: string;
      companyId?: number | null;
      contactId?: number | null;
      stage?: DealStage;
      amount?: number;
      probability?: number;
      expectedCloseDate?: string | null;
      notes?: string | null;
    }) => request<Deal>("/deals", { method: "POST", body: JSON.stringify(input) }),
    update: (
      id: number,
      patch: Partial<{
        title: string;
        companyId: number | null;
        contactId: number | null;
        stage: DealStage;
        amount: number;
        probability: number;
        expectedCloseDate: string | null;
        notes: string | null;
        position: number;
      }>
    ) => request<Deal>(`/deals/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    reorder: (columns: { stage: DealStage; dealIds: number[] }[]) =>
      request<Deal[]>("/deals/reorder/batch", { method: "PATCH", body: JSON.stringify({ columns }) }),
    remove: (id: number) => request<void>(`/deals/${id}`, { method: "DELETE" }),
  },
  reminders: {
    list: () => request<Reminder[]>("/reminders"),
    create: (input: { dealId?: number | null; title: string; dueAt: string }) =>
      request<Reminder>("/reminders", { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, patch: Partial<{ title: string; dueAt: string; done: boolean }>) =>
      request<Reminder>(`/reminders/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id: number) => request<void>(`/reminders/${id}`, { method: "DELETE" }),
  },
  reports: {
    summary: () => request<ReportSummary>("/reports/summary"),
  },
};
