import { fmt } from "../lib/format";

const COLOR = { jenis: "#0e8fa8", bentuk: "#1a7a6e", urusan: "#d99a1c", tahapan: "#7a5ac8" };

/** Graf hub-and-spoke: satu profil di tengah, node DOMINAN_* di sekelilingnya. */
export default function GraphView({ profil }) {
  const cx = 320;
  const cy = 180;
  const nodes = Object.keys(COLOR).flatMap((rel) =>
    (profil[rel] || []).map((x) => ({ rel, nama: x.nama, pct: x.pct }))
  );
  const kata = profil.nama.split(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 640 360" width="100%" role="img" aria-label={`Graf ${profil.nama}`}>
        {nodes.map((n, k) => {
          const a = (k / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(a) * 205;
          const y = cy + Math.sin(a) * 140;
          const label = n.nama.length > 22 ? n.nama.slice(0, 21) + "…" : n.nama;
          return (
            <g key={k}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke={COLOR[n.rel]} strokeWidth={1 + n.pct / 25} opacity="0.6" />
              <circle cx={x} cy={y} r="7" fill={COLOR[n.rel]} />
              <text x={x} y={y + (y > cy ? 19 : -12)} textAnchor="middle" fontSize="11" fill="#17324d">
                {label} {fmt(n.pct)}%
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="38" fill="#113d64" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{kata[0]}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#fff">{kata.slice(1).join(" ")}</text>
        {Object.entries(COLOR).map(([rel, c], j) => (
          <g key={rel}>
            <circle cx="14" cy={16 + j * 16} r="5" fill={c} />
            <text x="24" y={20 + j * 16} fontSize="11" fill="#17324d">DOMINAN_{rel.toUpperCase()}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
