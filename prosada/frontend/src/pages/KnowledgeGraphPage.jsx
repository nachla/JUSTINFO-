import { useState } from "react";
import { MapPin, Layers } from "lucide-react";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import BarList from "../components/BarList";
import GraphView from "../components/GraphView";
import { Async } from "../components/State";
import useFetch from "../hooks/useFetch";
import { getKg, getProfil } from "../services/data";
import { TK_COLOR } from "../lib/format";

const toItems = (arr) => arr.map((x) => ({ label: x.nama, value: x.n }));

export default function KnowledgeGraphPage() {
  const kg = useFetch(getKg);
  const profil = useFetch(getProfil);
  const [i, setI] = useState(0);

  return (
    <>
      <PageHeader
        badge="Knowledge Graph"
        title="Knowledge Graph Inovasi Jawa Timur"
        subtitle="Inovasi menjadi pusat relasi terstruktur yang menghubungkan daerah, OPD, urusan, jenis, bentuk, tahapan, pilar Asta Cipta, dan profil ekosistem."
      />

      <Async state={kg}>
        {(d) => (
          <>
            <p className="mb-3 text-sm font-semibold text-[#17324d]">
              {d.total_node.toLocaleString("id-ID")} node · {d.total_relasi.toLocaleString("id-ID")} relasi terdaftar
            </p>
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <Card>
                <h2 className="mb-2 text-[17px] font-extrabold text-[#113d64]">Node per Tipe</h2>
                <BarList items={toItems(d.node)} />
              </Card>
              <Card>
                <h2 className="mb-2 text-[17px] font-extrabold text-[#113d64]">Relasi per Tipe</h2>
                <BarList items={toItems(d.relasi)} />
              </Card>
            </div>
          </>
        )}
      </Async>

      <Async state={profil}>
        {(list) => {
          const selected = list[i] || list[0];
          const ekosistemList = list.filter((p) => p.id.startsWith("PROFILE_EKO"));

          return (
            <div className="space-y-4">
              {/* Card 1: Relasi Dominan Profil & Wilayah Terhubung */}
              <Card>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-[17px] font-extrabold text-[#113d64]">
                      Relasi Dominan & Karakteristik Profil Graf
                    </h2>
                    <p className="text-sm text-[#6b7c8d]">
                      Pilih profil untuk melihat node dominan serta daftar wilayah yang terhubung via relasi{" "}
                      <code className="rounded bg-[#edf4f8] px-1.5 py-0.5 font-mono text-xs text-[#0e8fa8]">
                        TERMASUK_PROFIL_EKOSISTEM
                      </code>
                    </p>
                  </div>
                  <select
                    value={i}
                    onChange={(e) => setI(+e.target.value)}
                    aria-label="Pilih profil"
                    className="rounded-xl border border-[#cde0ed] bg-white px-3 py-2 text-sm font-medium text-[#17324d] shadow-sm focus:border-[#113d64] focus:outline-none"
                  >
                    {list.map((p, k) => (
                      <option key={p.id} value={k}>
                        {p.nama} ({p.tingkat}) — {p.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3">
                  {selected && <GraphView profil={selected} />}
                </div>

                {/* Bagian Daftar Wilayah untuk Profil Terpilih */}
                {selected && selected.wilayah && selected.wilayah.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-[#e3ebf3] bg-[#f9fbfd] p-4 sm:p-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="text-[#0e8fa8]" size={18} />
                        <h3 className="text-sm font-bold text-[#113d64]">
                          Wilayah Terhubung ke {selected.nama}
                        </h3>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                          style={{ background: TK_COLOR[selected.tingkat] || "#113d64" }}
                        >
                          Tingkat {selected.tingkat}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[#6b7c8d]">
                        Total: {selected.wilayah.length} wilayah
                      </span>
                    </div>

                    <p className="mb-3 text-xs text-[#6b7c8d]">
                      Wilayah di bawah terhubung langsung ke node ini dalam Knowledge Graph:{" "}
                      <span className="font-mono font-semibold text-[#113d64]">
                        (Daerah) -[:TERMASUK_PROFIL_EKOSISTEM]-&gt; ({selected.id})
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {selected.wilayah.map((namaDaerah) => (
                        <div
                          key={namaDaerah}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#d6e5ef] bg-white px-3 py-1.5 text-xs font-medium text-[#17324d] shadow-xs transition hover:border-[#0e8fa8] hover:bg-[#f0f8fa]"
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: TK_COLOR[selected.tingkat] || "#113d64" }}
                          />
                          <span>{namaDaerah}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Card 2: Pengelompokan Seluruh Wilayah Berdasarkan Ekosistem Graf */}
              <Card>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="text-[#1a7a6e]" size={20} />
                    <h2 className="text-[17px] font-extrabold text-[#113d64]">
                      Daftar Wilayah Berdasarkan Ekosistem dalam Knowledge Graph
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-[#6b7c8d]">
                    Distribusi 35 kabupaten/kota di Jawa Timur ke dalam 3 klaster Profil Ekosistem Inovasi berdasarkan relasi Knowledge Graph.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {ekosistemList.map((eko) => {
                    const warnaTingkat = TK_COLOR[eko.tingkat] || "#113d64";
                    const isSelected = selected && selected.id === eko.id;

                    return (
                      <div
                        key={eko.id}
                        className={`flex flex-col rounded-2xl border p-4 transition ${
                          isSelected
                            ? "border-[#0e8fa8] bg-white shadow-md ring-2 ring-[#0e8fa8]/20"
                            : "border-[#e3ebf3] bg-[#fdfefe] hover:border-[#c5d8e6] hover:shadow-sm"
                        }`}
                        style={{ borderTop: `4px solid ${warnaTingkat}` }}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="font-extrabold text-[#113d64]">{eko.nama}</h3>
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                            style={{ background: warnaTingkat }}
                          >
                            {eko.tingkat}
                          </span>
                        </div>
                        <p className="mb-3 text-xs text-[#6b7c8d]">
                          {eko.ringkas} · <span className="font-mono text-[11px]">{eko.id}</span>
                        </p>

                        <div className="mb-2 text-xs font-bold text-[#486581]">
                          Daftar Wilayah ({eko.wilayah?.length || 0}):
                        </div>

                        <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
                          {(eko.wilayah || []).map((w, idx) => (
                            <div
                              key={w}
                              className="flex items-center justify-between rounded-lg bg-[#f4f8fb] px-2.5 py-1.5 text-xs text-[#1e3a5f]"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-[#8fa4b8]">{idx + 1}.</span>
                                <span className="font-medium">{w}</span>
                              </div>
                              <span className="text-[10px] text-[#6b7c8d]">Node Graf</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          );
        }}
      </Async>
    </>
  );
}
