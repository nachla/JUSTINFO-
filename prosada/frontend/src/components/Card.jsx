export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-[#e3ebf3] bg-white/85 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}
