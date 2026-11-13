import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import WilayahMap from "../components/WilayahMap";
import { Async } from "../components/State";
import useFetch from "../hooks/useFetch";
import { getWilayah } from "../services/data";
import { TK_COLOR } from "../lib/format";

const FILTER_OPTS = [
  { id: "Semua", label: "Semua Klaster" },
  { id: "Tinggi", label: "Klaster 1 (Tinggi)" },
  { id: "Sedang", label: "Klaster 2 (Sedang)" },
  { id: "Rendah", label: "Klaster 3 (Rendah)" },
];

function Isi({ data }) {
  const [cari, setCari] = useState("");
  const [filter, setFilter] = useState("Semua");

  const rows = useMemo(
    () =>
      data.filter(
        (w) =>
          (filter === "Semua" || w.tk === filter || (filter === "Tinggi" && w.cluster === 1) || (filter === "Sedang" && w.cluster === 2) || (filter === "Rendah" && w.cluster === 3)) &&
          w.nama.toLowerCase().includes(cari.toLowerCase())
      ),
    [data, cari, filter]
  );

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari kabupaten / kota…"
          aria-label="Cari wilayah"
          className="min-w-[180px] flex-1 rounded-xl border border-[#e3ebf3] bg-white px-3.5 py-2 text-sm shadow-xs focus:border-[#113d64] focus:outline-none"
        />
        {FILTER_OPTS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
              filter === f.id ? "border-[#113d64] bg-[#113d64] text-white shadow-xs" : "border-[#e3ebf3] bg-white hover:bg-[#f8fafc]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <WilayahMap data={rows} max={data?.[0]?.n || 1} />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#6b7c8d]">
        <span className="font-semibold text-[#113d64]">Legenda Klaster:</span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#0d9488" }} />
          <b>Klaster 1</b>: Ekosistem Tinggi
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#d97706" }} />
          <b>Klaster 2</b>: Ekosistem Sedang
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#e11d48" }} />
          <b>Klaster 3</b>: Ekosistem Rendah
        </span>
        <span className="ml-auto text-[#64748b]">
        Klik marker wilayah untuk rincian profil ekosistem dan statistik.
        </span>
      </div>
    </>
  );
}

export default function WilayahPage() {
  const state = useFetch(getWilayah);
  return (
    <>
      <PageHeader
        badge="Wilayah"
        title="Peta Persebaran Klaster Inovasi Wilayah"
        subtitle="Visualisasi spasial dan komparasi hasil pengelompokan (clustering) 35 kabupaten/kota di Jawa Timur dari 3 model Machine Learning: K-Means (Model Terpilih), K-Medoids (PAM), dan Fuzzy C-Means. Anda dapat mengganti model langsung di peta untuk membandingkan sebaran dan stabilitas klaster."
      />
      <Async state={state}>{(data) => <Isi data={data} />}</Async>
    </>
  );
}
