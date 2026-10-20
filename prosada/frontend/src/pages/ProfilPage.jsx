import { useState } from "react";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import BarList from "../components/BarList";
import { Async } from "../components/State";
import useFetch from "../hooks/useFetch";
import { getProfil } from "../services/data";
import { fmt } from "../lib/format";

const BAGIAN = [
  ["jenis", "Jenis"],
  ["bentuk", "Bentuk"],
  ["urusan", "Urusan dominan"],
  ["tahapan", "Tahapan"],
];

export default function ProfilPage() {
  const state = useFetch(getProfil);
  const [aktif, setAktif] = useState(0);

  return (
    <>
      <PageHeader
        badge="Profil"
        title="Profil ekosistem inovasi"
        subtitle="Karakteristik dominan tiap cluster, dari relasi berbobot pada Knowledge Graph."
      />
      <Async state={state}>
        {(profil) => {
          const p = profil[aktif] || profil[0];
          if (!p) return null;
          return (
            <>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {profil.map((x, i) => (
                  <button
                    key={x.id}
                    onClick={() => setAktif(i)}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-semibold ${
                      aktif === i ? "border-[#113d64] bg-[#113d64] text-white" : "border-[#e3ebf3] bg-white"
                    }`}
                  >
                    {x.nama}
                  </button>
                ))}
              </div>
              <Card>
                <h2 className="text-xl font-extrabold">
                  {p.nama}{" "}
                  <span className="rounded-full bg-[#d7f0f5] px-2.5 py-0.5 text-xs font-bold text-[#0e8fa8]">
                    {p.tingkat}
                  </span>
                </h2>
                <p className="mb-2 text-sm text-[#6b7c8d]">{p.ringkas}</p>
                {BAGIAN.map(([k, judul]) => (
                  <div key={k} className="mt-3">
                    <h3 className="mb-1 text-[13px] font-extrabold text-[#6b7c8d]">{judul}</h3>
                    <BarList
                      max={100}
                      items={(p[k] || []).map((x) => ({ label: x.nama, value: x.pct, display: `${fmt(x.pct)}%` }))}
                    />
                  </div>
                ))}
              </Card>
            </>
          );
        }}
      </Async>
    </>
  );
}
