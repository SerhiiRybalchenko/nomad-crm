import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useCompanies, useContacts, useDeals } from "../hooks/queries";
import { KanbanBoard } from "../components/KanbanBoard";
import { DealModal } from "../components/DealModal";
import { BoardSkeleton } from "../components/Skeleton";
import { IconPlus } from "../components/icons";
import { formatCurrency } from "../lib/format";
import type { Deal, DealStage } from "../lib/types";
import "../styles/kanban.css";
import "../styles/modal.css";

export function PipelinePage() {
  const dealsQuery = useDeals();
  const companiesQuery = useCompanies();
  const contactsQuery = useContacts();

  const [modal, setModal] = useState<
    | { mode: "create"; stage: DealStage }
    | { mode: "edit"; deal: Deal }
    | null
  >(null);

  const deals = dealsQuery.data ?? [];
  const companies = companiesQuery.data ?? [];
  const contacts = contactsQuery.data ?? [];

  const stats = useMemo(() => {
    const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const pipelineValue = open.reduce((sum, d) => sum + Number(d.amount), 0);
    const won = deals.filter((d) => d.stage === "won");
    const wonValue = won.reduce((sum, d) => sum + Number(d.amount), 0);
    return { openCount: open.length, pipelineValue, wonValue };
  }, [deals]);

  const loading = dealsQuery.isLoading || companiesQuery.isLoading || contactsQuery.isLoading;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Sales pipeline</span>
          <h1>Deal board</h1>
          <p className="subtitle">Drag cards across stages as conversations move forward.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ mode: "create", stage: "lead" })}>
          <IconPlus width={15} height={15} />
          New deal
        </button>
      </div>

      <div className="board-toolbar">
        <div className="board-stats">
          <div className="board-stat">
            <span className="value">{stats.openCount}</span>
            <span className="label">Open deals</span>
          </div>
          <div className="board-stat">
            <span className="value">{formatCurrency(stats.pipelineValue, true)}</span>
            <span className="label">Open pipeline value</span>
          </div>
          <div className="board-stat">
            <span className="value" style={{ color: "var(--stage-won)" }}>
              {formatCurrency(stats.wonValue, true)}
            </span>
            <span className="label">Won to date</span>
          </div>
        </div>
      </div>

      {loading ? (
        <BoardSkeleton />
      ) : (
        <KanbanBoard
          deals={deals}
          companies={companies}
          contacts={contacts}
          onCardClick={(deal) => setModal({ mode: "edit", deal })}
          onAddClick={(stage) => setModal({ mode: "create", stage })}
        />
      )}

      <AnimatePresence>
        {modal && (
          <DealModal
            mode={modal.mode}
            deal={modal.mode === "edit" ? modal.deal : undefined}
            defaultStage={modal.mode === "create" ? modal.stage : undefined}
            companies={companies}
            contacts={contacts}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
