import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import type { Company, Contact, Deal, DealStage } from "../lib/types";
import { STAGE_ORDER, STAGE_META } from "../lib/stages";
import { useCreateDeal, useDeleteDeal, useUpdateDeal } from "../hooks/queries";
import { useToast } from "./Toast";
import { IconTrash, IconX } from "./icons";
import { formatShortDate } from "../lib/format";

interface DealModalProps {
  mode: "create" | "edit";
  deal?: Deal;
  defaultStage?: DealStage;
  companies: Company[];
  contacts: Contact[];
  onClose: () => void;
}

export function DealModal({ mode, deal, defaultStage = "lead", companies, contacts, onClose }: DealModalProps) {
  const { show } = useToast();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();

  const [title, setTitle] = useState(deal?.title ?? "");
  const [companyId, setCompanyId] = useState<string>(deal?.company_id ? String(deal.company_id) : "");
  const [contactId, setContactId] = useState<string>(deal?.contact_id ? String(deal.contact_id) : "");
  const [stage, setStage] = useState<DealStage>(deal?.stage ?? defaultStage);
  const [amount, setAmount] = useState<string>(deal?.amount ?? "");
  const [probability, setProbability] = useState<number>(deal?.probability ?? 20);
  const [expectedClose, setExpectedClose] = useState<string>(
    deal?.expected_close_date ? deal.expected_close_date.slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(deal?.notes ?? "");

  // Keep contact list scoped to the selected company once one is chosen.
  const filteredContacts = companyId
    ? contacts.filter((c) => String(c.company_id) === companyId)
    : contacts;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const busy = createDeal.isPending || updateDeal.isPending || deleteDeal.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      companyId: companyId ? Number(companyId) : null,
      contactId: contactId ? Number(contactId) : null,
      stage,
      amount: amount ? Number(amount) : 0,
      probability,
      expectedCloseDate: expectedClose || null,
      notes: notes.trim() || null,
    };

    try {
      if (mode === "create") {
        await createDeal.mutateAsync(payload);
        show("Deal added to the pipeline", "success");
      } else if (deal) {
        await updateDeal.mutateAsync({ id: deal.id, patch: payload });
        show("Deal updated", "success");
      }
      onClose();
    } catch {
      show("Something went wrong — try again", "danger");
    }
  }

  async function handleDelete() {
    if (!deal) return;
    try {
      await deleteDeal.mutateAsync(deal.id);
      show("Deal removed", "info");
      onClose();
    } catch {
      show("Couldn't delete that deal", "danger");
    }
  }

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="modal-panel"
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <div className="modal-head">
          <div>
            <h3>{mode === "create" ? "New deal" : "Edit deal"}</h3>
            <p>{mode === "create" ? "Add it to the board." : `Created ${formatShortDate(deal?.created_at ?? null)}`}</p>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
            <IconX width={16} height={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="deal-title">
            Title
          </label>
          <input
            id="deal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Website redesign package"
            required
            autoFocus
            style={{ width: "100%", marginBottom: 12 }}
          />

          <div className="field-row" style={{ marginBottom: 12 }}>
            <div>
              <label className="field-label" htmlFor="deal-company">
                Company
              </label>
              <select
                id="deal-company"
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setContactId("");
                }}
                style={{ width: "100%" }}
              >
                <option value="">No company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="deal-contact">
                Contact
              </label>
              <select
                id="deal-contact"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">No contact</option>
                {filteredContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-row" style={{ marginBottom: 12 }}>
            <div>
              <label className="field-label" htmlFor="deal-amount">
                Amount (USD)
              </label>
              <input
                id="deal-amount"
                type="number"
                min={0}
                step={50}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="deal-stage">
                Stage
              </label>
              <select id="deal-stage" value={stage} onChange={(e) => setStage(e.target.value as DealStage)} style={{ width: "100%" }}>
                {STAGE_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_META[s].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-row" style={{ marginBottom: 12 }}>
            <div>
              <label className="field-label" htmlFor="deal-probability">
                Probability — {probability}%
              </label>
              <input
                id="deal-probability"
                type="range"
                min={0}
                max={100}
                step={5}
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                style={{ width: "100%", padding: 0 }}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="deal-close">
                Expected close
              </label>
              <input
                id="deal-close"
                type="date"
                value={expectedClose}
                onChange={(e) => setExpectedClose(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <label className="field-label" htmlFor="deal-notes">
            Notes
          </label>
          <textarea
            id="deal-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional context for the next follow-up…"
            style={{ width: "100%", resize: "vertical" }}
          />

          <div className="modal-actions">
            {mode === "edit" && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleDelete}
                disabled={busy}
                style={{ marginRight: "auto", color: "var(--danger)" }}
              >
                <IconTrash width={14} height={14} />
                Delete
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !title.trim()}>
              {mode === "create" ? "Add deal" : "Save changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
