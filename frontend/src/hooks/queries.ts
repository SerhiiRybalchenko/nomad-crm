import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Deal, DealStage, Reminder } from "../lib/types";

export function useCompanies() {
  return useQuery({ queryKey: ["companies"], queryFn: api.companies.list });
}

export function useContacts() {
  return useQuery({ queryKey: ["contacts"], queryFn: api.contacts.list });
}

export function useDeals() {
  return useQuery({ queryKey: ["deals"], queryFn: api.deals.list });
}

export function useReports() {
  return useQuery({ queryKey: ["reports", "summary"], queryFn: api.reports.summary });
}

export function useReminders() {
  return useQuery({ queryKey: ["reminders"], queryFn: api.reminders.list });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deals.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; patch: Parameters<typeof api.deals.update>[1] }) =>
      api.deals.update(vars.id, vars.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deals.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

/** Optimistically reorders/moves cards on the board, then reconciles with the server. */
export function useReorderDeals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deals.reorder,
    onMutate: async (columns) => {
      await qc.cancelQueries({ queryKey: ["deals"] });
      const previous = qc.getQueryData<Deal[]>(["deals"]);
      if (previous) {
        const stageByDeal = new Map<number, { stage: DealStage; position: number }>();
        for (const col of columns) {
          col.dealIds.forEach((id, idx) => stageByDeal.set(id, { stage: col.stage, position: idx }));
        }
        const next = previous.map((d) => {
          const override = stageByDeal.get(d.id);
          return override ? { ...d, stage: override.stage, position: override.position } : d;
        });
        qc.setQueryData<Deal[]>(["deals"], next);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["deals"], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.reminders.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; patch: Parameters<typeof api.reminders.update>[1] }) =>
      api.reminders.update(vars.id, vars.patch),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["reminders"] });
      const previous = qc.getQueryData<Reminder[]>(["reminders"]);
      if (previous) {
        qc.setQueryData<Reminder[]>(
          ["reminders"],
          previous.map((r) => (r.id === vars.id ? { ...r, ...vars.patch } : r))
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["reminders"], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.reminders.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}
