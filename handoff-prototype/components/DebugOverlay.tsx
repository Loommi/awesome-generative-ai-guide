"use client";

export function DebugOverlay({ rows, payload }: { rows: Record<string, string | number | null | undefined>; payload?: unknown }) {
  return (
    <aside className="debug">
      <dl>
        {Object.entries(rows).map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v ?? "—"}</dd>
          </div>
        ))}
      </dl>
      {payload ? <pre>{JSON.stringify(payload, null, 2)}</pre> : null}
    </aside>
  );
}

export const fmt = {
  vec: (v?: { x: number; y: number } | null) => (v ? `${v.x.toFixed(2)}, ${v.y.toFixed(2)}` : null),
  time: (t?: number | null) => (t ? new Date(t).toISOString().slice(11, 23) : null),
};
