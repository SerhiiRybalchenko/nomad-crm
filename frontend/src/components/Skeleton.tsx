import type { CSSProperties } from "react";

export function Skeleton({ width, height = 14, style }: { width: string | number; height?: number; style?: CSSProperties }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}

export function BoardSkeleton() {
  return (
    <div className="board">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="board-column" style={{ padding: 14 }}>
          <Skeleton width="60%" height={14} style={{ marginBottom: 14 }} />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} style={{ marginBottom: 10 }}>
              <Skeleton width="100%" height={78} style={{ borderRadius: 14 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
