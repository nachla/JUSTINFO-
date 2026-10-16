export default function CardHeader({ title, note }) {
  return (
    <div className="mb-3.5 flex items-baseline justify-between gap-2">
      <h2 className="text-[17px] font-extrabold">{title}</h2>
      {note && <span className="text-xs text-[#6b7c8d]">{note}</span>}
    </div>
  );
}
