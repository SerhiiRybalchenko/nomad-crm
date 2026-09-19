import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Deal } from "../lib/types";
import { STAGE_META } from "../lib/stages";
import { formatCurrency, formatShortDate, hueToBg, initials } from "../lib/format";
import { IconClock } from "./icons";

export function DealCard({
  deal,
  hue,
  onClick,
  overlay = false,
}: {
  deal: Deal;
  hue: number;
  onClick?: () => void;
  overlay?: boolean;
}) {
  const sortable = useSortable({ id: deal.id, disabled: overlay });
  const meta = STAGE_META[deal.stage];

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      };

  const isOpen = deal.stage !== "won" && deal.stage !== "lost";
  const closeSoon =
    isOpen && deal.expected_close_date
      ? new Date(deal.expected_close_date).getTime() < Date.now() + 1000 * 60 * 60 * 24 * 3
      : false;

  return (
    <div
      ref={overlay ? undefined : sortable.setNodeRef}
      style={style}
      {...(overlay ? {} : sortable.attributes)}
      {...(overlay ? {} : sortable.listeners)}
      className={`deal-card${sortable.isDragging ? " is-dragging" : ""}${overlay ? " overlay" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="deal-card-top">
        <span className="deal-title">{deal.title}</span>
        <span className="deal-amount">{formatCurrency(deal.amount, true)}</span>
      </div>

      {deal.company_name && (
        <div className="deal-company">
          <span className="avatar" style={{ background: hueToBg(hue) }}>
            {initials(deal.company_name)}
          </span>
          <span>{deal.company_name}</span>
        </div>
      )}

      <div className="probability-track">
        <div
          className="probability-fill"
          style={{ width: `${deal.probability}%`, background: meta.color }}
        />
      </div>

      <div className="deal-meta-row">
        <span className={`deal-date${closeSoon ? " is-overdue" : ""}`}>
          <IconClock width={11} height={11} />
          {deal.stage === "won" || deal.stage === "lost"
            ? formatShortDate(deal.closed_at)
            : formatShortDate(deal.expected_close_date)}
        </span>
        <span className="text-muted mono" style={{ fontSize: 10.5 }}>
          {deal.probability}%
        </span>
      </div>
    </div>
  );
}
