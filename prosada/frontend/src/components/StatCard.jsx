import Card from "./Card";

export default function StatCard({ icon: Icon, value, label, hint, tone = "#1a7a6e" }) {
  return (
    <Card className="flex flex-col gap-3">
      <div
        className="grid h-9 w-9 place-items-center rounded-xl"
        style={{ background: `${tone}1a`, color: tone }}
      >
        <Icon size={18} />
      </div>
      <div>
        <b className="block text-[28px] font-extrabold leading-none tabular-nums text-[#113d64]">{value}</b>
        <span className="mt-1.5 block text-[13px] font-semibold">{label}</span>
        {hint && <span className="block text-xs text-[#6b7c8d]">{hint}</span>}
      </div>
    </Card>
  );
}
