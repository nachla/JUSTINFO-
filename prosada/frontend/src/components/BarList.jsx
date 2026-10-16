const PALET = ["#1a7a6e", "#0e8fa8", "#113d64", "#d99a1c", "#7a5ac8"];

/** items: [{ label, value, display?, sub?, color? }]. Satu grid supaya kolom angka rata antar baris. */
export default function BarList({ items, max, palet = false }) {
  const m = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="grid grid-cols-[minmax(110px,170px)_1fr_auto] items-center gap-x-3 gap-y-2.5 text-[13px]">
      {items.map((i, k) => (
        <div key={i.label} className="contents">
          <span className="truncate" title={i.label}>
            {i.label}
          </span>
          <div className="h-3 overflow-hidden rounded-full bg-[#e8eef5]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((i.value / m) * 100, 1.5)}%`,
                background: i.color || (palet ? PALET[k % PALET.length] : "#1a7a6e"),
              }}
            />
          </div>
          <span className="min-w-[48px] text-right tabular-nums">
            <b className="font-bold">{i.display ?? i.value}</b>
            {i.sub && <span className="ml-1.5 text-xs text-[#6b7c8d]">{i.sub}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
