export default function PageHeader({ badge, title, subtitle }) {
  return (
    <div className="mb-4">
      <span className="inline-block rounded-full bg-[#d7f0f5] px-2.5 py-0.5 text-xs font-bold text-[#0e8fa8]">
        {badge}
      </span>
      <h1 className="mb-1 mt-2 text-2xl font-extrabold">{title}</h1>
      {subtitle && <p className="text-sm text-[#6b7c8d]">{subtitle}</p>}
    </div>
  );
}
