import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import type { Company, Contact, Deal, DealStage } from "../lib/types";
import { STAGE_META, STAGE_ORDER } from "../lib/stages";
import { formatCurrency } from "../lib/format";
import { DealCard } from "./DealCard";
import { EmptyState } from "./EmptyState";
import { IconLayers, IconPlus } from "./icons";
import { useReorderDeals } from "../hooks/queries";

type Board = Record<DealStage, number[]>;

function groupByStage(deals: Deal[]): Board {
  const board: Board = { lead: [], contacted: [], proposal: [], won: [], lost: [] };
  for (const stage of STAGE_ORDER) {
    board[stage] = deals
      .filter((d) => d.stage === stage)
      .sort((a, b) => a.position - b.position)
      .map((d) => d.id);
  }
  return board;
}

function findStageOf(board: Board, id: number): DealStage | undefined {
  return STAGE_ORDER.find((stage) => board[stage].includes(id));
}

function Column({
  stage,
  dealIds,
  dealsById,
  hueByCompany,
  onCardClick,
  onAddClick,
}: {
  stage: DealStage;
  dealIds: number[];
  dealsById: Map<number, Deal>;
  hueByCompany: Map<number, number>;
  onCardClick: (deal: Deal) => void;
  onAddClick: () => void;
}) {
  const meta = STAGE_META[stage];
  const { setNodeRef, isOver } = useDroppable({ id: `col-${stage}` });
  const total = dealIds.reduce((sum, id) => sum + Number(dealsById.get(id)?.amount ?? 0), 0);

  return (
    <div className={`board-column${isOver ? " is-over" : ""}`}>
      <div className="column-header">
        <div className="column-title-group">
          <span className="column-dot" style={{ color: meta.color, background: meta.color }} />
          <span className="column-title">{meta.label}</span>
        </div>
        <span className="column-count">{dealIds.length}</span>
      </div>
      <div className="column-total">{formatCurrency(total, true)} total</div>

      <div ref={setNodeRef} className="column-list">
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {dealIds.map((id) => {
              const deal = dealsById.get(id);
              if (!deal) return null;
              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.18 }}
                >
                  <DealCard
                    deal={deal}
                    hue={deal.company_id ? hueByCompany.get(deal.company_id) ?? 20 : 20}
                    onClick={() => onCardClick(deal)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </SortableContext>
      </div>

      <button type="button" className="column-add" onClick={onAddClick}>
        <IconPlus width={12} height={12} style={{ display: "inline", marginRight: 4, verticalAlign: -2 }} />
        Add deal
      </button>
    </div>
  );
}

export function KanbanBoard({
  deals,
  companies,
  contacts: _contacts,
  onCardClick,
  onAddClick,
}: {
  deals: Deal[];
  companies: Company[];
  contacts: Contact[];
  onCardClick: (deal: Deal) => void;
  onAddClick: (stage: DealStage) => void;
}) {
  const [board, setBoard] = useState<Board>(() => groupByStage(deals));
  const [activeId, setActiveId] = useState<number | null>(null);
  const reorder = useReorderDeals();

  useEffect(() => {
    if (activeId != null) return;
    setBoard(groupByStage(deals));
  }, [deals, activeId]);

  const dealsById = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);
  const hueByCompany = useMemo(() => new Map(companies.map((c) => [c.id, c.logo_hue])), [companies]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function onDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = Number(active.id);
    const overId = over.id;

    const activeStage = findStageOf(board, activeId);
    if (!activeStage) return;

    let overStage: DealStage | undefined;
    if (typeof overId === "string" && overId.startsWith("col-")) {
      overStage = overId.replace("col-", "") as DealStage;
    } else {
      overStage = findStageOf(board, Number(overId));
    }
    if (!overStage || activeStage === overStage) return;

    setBoard((prev) => {
      const activeItems = prev[activeStage!].filter((id) => id !== activeId);
      const overItems = prev[overStage!].filter((id) => id !== activeId);
      const overIndex = typeof overId === "number" ? overItems.indexOf(Number(overId)) : -1;
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      overItems.splice(insertAt, 0, activeId);
      return { ...prev, [activeStage!]: activeItems, [overStage!]: overItems };
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdNum = Number(active.id);
    const overId = over.id;
    const activeStage = findStageOf(board, activeIdNum);
    if (!activeStage) return;

    let overStage = activeStage;
    if (typeof overId === "string" && overId.startsWith("col-")) {
      overStage = overId.replace("col-", "") as DealStage;
    } else {
      const found = findStageOf(board, Number(overId));
      if (found) overStage = found;
    }

    setBoard((prev) => {
      let items = [...prev[overStage]];
      if (activeStage === overStage && typeof overId === "number") {
        const oldIndex = items.indexOf(activeIdNum);
        const newIndex = items.indexOf(Number(overId));
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          items = arrayMove(items, oldIndex, newIndex);
        }
      }
      const next = { ...prev, [overStage]: items };
      const payload = STAGE_ORDER.map((stage) => ({ stage, dealIds: next[stage] }));
      reorder.mutate(payload);
      return next;
    });
  }

  const activeDeal = activeId != null ? dealsById.get(activeId) : undefined;
  const isEmpty = deals.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={<IconLayers width={22} height={22} />}
        title="No deals yet"
        description="Add your first deal to start tracking it through the pipeline."
        action={
          <button className="btn btn-primary btn-sm" onClick={() => onAddClick("lead")} style={{ marginTop: 8 }}>
            <IconPlus width={14} height={14} /> New deal
          </button>
        }
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="board">
        {STAGE_ORDER.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            dealIds={board[stage]}
            dealsById={dealsById}
            hueByCompany={hueByCompany}
            onCardClick={onCardClick}
            onAddClick={() => onAddClick(stage)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <DealCard
            deal={activeDeal}
            hue={activeDeal.company_id ? hueByCompany.get(activeDeal.company_id) ?? 20 : 20}
            overlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
