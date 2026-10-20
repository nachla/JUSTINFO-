import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Lightbulb, Landmark, Building2, CircleCheck, Gauge } from "lucide-react";
import Card from "../components/Card";
import CardHeader from "../components/CardHeader";
import StatCard from "../components/StatCard";
import BarList from "../components/BarList";
import { Async } from "../components/State";
import useFetch from "../hooks/useFetch";
import { getRingkasan } from "../services/data";
import { fmt, TK_COLOR } from "../lib/format";

const persen = (a, b) => fmt(((a / b) * 100).toFixed(1));

export default function HomePage() {
  const state = useFetch(getRingkasan);

  return (
    <>
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-[#113d64] to-[#0b5a63] p-6 text-white">
        <span className="inline-block rounded-full bg-[#d7f0f5] px-2.5 py-0.5 text-xs font-bold text-[#0e8fa8]">
        JUSTINFO Analytics
        </span>
        <h1 className="mb-1 mt-2 text-2xl font-extrabold">Dashboard Inovasi Daerah</h1>
        <p className="text-sm text-[#c3d6e4]">
          Clustering, Knowledge Graph, dan Explainable AI untuk inovasi pemerintah daerah di Jawa Timur.
        </p>
      </div>

      <Async state={state}>
        {(d) => {
          const totalWilayah = d.tk.reduce((s, t) => s + t.wilayah, 0);
          const totalInovasiWilayah = d.tk.reduce((s, t) => s + t.inovasi, 0);
          return (
            <>
              <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                <StatCard icon={Lightbulb} value={d.inovasi} label="Inovasi tercatat" hint="seluruh pemda" tone="#1a7a6e" />
                <StatCard
                  icon={Landmark}
                  value={d.pemda}
                  label="Pemerintah daerah"
                  hint={`${d.pemda - 1} kab/kota + provinsi`}
                  tone="#113d64"
                />
                <StatCard icon={Building2} value={d.opd} label="Admin OPD" hint="pengelola inovasi" tone="#0e8fa8" />
                <StatCard
                  icon={CircleCheck}
                  value={`${fmt(d.penerapan_pct)}%`}
                  label="Tahap penerapan"
                  hint="dari seluruh inovasi"
                  tone="#d99a1c"
                />
                <StatCard
                  icon={Gauge}
                  value={fmt(d.avg_kematangan)}
                  label="Rata-rata kematangan"
                  hint="skor per inovasi"
                  tone="#7a5ac8"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Card>
                  <CardHeader title="Jenis inovasi" note={`${d.inovasi} inovasi`} />
                  <BarList
                    palet
                    items={d.jenis.map((x) => ({
                      label: x.nama,
                      value: x.n,
                      display: x.n,
                      sub: `${persen(x.n, d.inovasi)}%`,
                    }))}
                  />
                </Card>

                <Card>
                  <CardHeader title="Bentuk inovasi" note={`${d.inovasi} inovasi`} />
                  <BarList
                    palet
                    items={d.bentuk.map((x) => ({
                      label: x.nama,
                      value: x.n,
                      display: x.n,
                      sub: `${persen(x.n, d.inovasi)}%`,
                    }))}
                  />
                </Card>

                <Card>
                  <CardHeader title="Tingkat kematangan wilayah" note="hasil clustering kab/kota" />
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="relative h-[170px] w-[170px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={d.tk}
                            dataKey="wilayah"
                            nameKey="tingkat"
                            innerRadius={54}
                            outerRadius={82}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {d.tk.map((t) => (
                              <Cell key={t.tingkat} fill={TK_COLOR[t.tingkat]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => `${v} wilayah`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                        <div>
                          <b className="block text-2xl font-extrabold leading-none text-[#113d64]">{totalWilayah}</b>
                          <span className="text-[11px] text-[#6b7c8d]">kab/kota</span>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-[190px] flex-1 space-y-3">
                      {d.tk.map((t) => (
                        <div key={t.tingkat}>
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <i className="inline-block h-3 w-3 rounded-full" style={{ background: TK_COLOR[t.tingkat] }} />
                            {t.tingkat}
                          </div>
                          <div className="ml-5 text-xs text-[#6b7c8d]">
                            <b className="text-[#17324d]">{t.wilayah} wilayah</b> · {t.inovasi} inovasi (
                            {persen(t.inovasi, totalInovasiWilayah)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-[#6b7c8d]">
                    Persentase dihitung dari {totalInovasiWilayah} inovasi milik kab/kota. Inovasi provinsi
                    dianalisis terpisah lewat profil provinsi.
                  </p>
                </Card>

                <Card>
                  <CardHeader title="Wilayah dengan inovasi terbanyak" note={`persen dari ${d.inovasi} inovasi`} />
                  <BarList
                    items={d.top.map((w) => ({
                      label: w.nama,
                      value: w.n,
                      color: TK_COLOR[w.tk],
                      display: w.n,
                      sub: `${persen(w.n, d.inovasi)}%`,
                    }))}
                  />
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6b7c8d]">
                    {Object.entries(TK_COLOR).map(([tk, c]) => (
                      <span key={tk} className="flex items-center gap-1.5">
                        <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                        {tk}
                      </span>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          );
        }}
      </Async>
    </>
  );
}
