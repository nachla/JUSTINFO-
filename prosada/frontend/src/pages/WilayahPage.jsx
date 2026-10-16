import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import WilayahMap from "../components/WilayahMap";
import { Async } from "../components/State";
import useFetch from "../hooks/useFetch";
import { getWilayah } from "../services/data";
import { TK_COLOR } from "../lib/format";

const FILTER = ["Semua", "Tinggi", "Sedang", "Rendah"];

function Isi({ data }) {
  const [cari, setCari] = useState("");
  const [filter, setFilter] = useState("Semua");

  const rows = useMemo(
    () =>
      data.filter(
        (w) => (filter === "Semua" || w.tk === filter) && w.nama.toLowerCase().includes(cari.toLowerCase())
      ),
    [data, cari, filter]
  );

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari wilayah…"
          aria-label="Cari wilayah"
          className="min-w-[150px] flex-1 rounded-xl border border-[#e3ebf3] bg-white px-3 py-2 text-sm"
        />
        {FILTER.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl border px-3 py-1.5 text-sm font-semibold ${
              filter === f ? "border-[#113d64] bg-[#113d64] text-white" : "border-[#e3ebf3] bg-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <WilayahMap data={rows} max={data[0].n} />

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6b7c8d]">
        {Object.entries(TK_COLOR).map(([tk, c]) => (
          <span key={tk} className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
            {tk}
          </span>
        ))}
        <span>
          {rows.length} wilayah ditampilkan. Angka di lingkaran = jumlah inovasi, makin besar lingkaran makin
          banyak inovasi. Klik lingkaran untuk melihat rata-rata kematangan.
        </span>
      </div>
      <p className="mt-1 text-xs text-[#6b7c8d]">
        Wilayah dengan 1–3 inovasi skornya mudah bergeser, jadi bacalah dengan hati-hati. Posisi lingkaran adalah
        titik tengah kab/kota, bukan batas wilayah.
      </p>
    </>
  );
}

export default function WilayahPage() {
  const state = useFetch(getWilayah);
  return (
    <>
      <PageHeader
        badge="Wilayah"
        title="Peta inovasi per wilayah"
        subtitle="Setiap lingkaran adalah satu kab/kota, berisi jumlah inovasinya. Warna mengikuti tingkat kematangan hasil clustering. Klik lingkaran untuk detail."
      />
      <Async state={state}>{(data) => <Isi data={data} />}</Async>
    </>
  );
}
