import { useState } from "react";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import BarList from "../components/BarList";
import GraphView from "../components/GraphView";
import { Async } from "../components/State";
import useFetch from "../hooks/useFetch";
import { getKg, getProfil } from "../services/data";

const toItems = (arr) => arr.map((x) => ({ label: x.nama, value: x.n }));

export default function KnowledgeGraphPage() {
  const kg = useFetch(getKg);
  const profil = useFetch(getProfil);
  const [i, setI] = useState(0);

  return (
    <>
      <PageHeader
        badge="Knowledge Graph"
        title="Knowledge Graph inovasi"
        subtitle="Inovasi menjadi pusat, terhubung ke daerah, OPD, urusan, jenis, bentuk, tahapan, pilar Asta Cipta, dan profil."
      />
      <Async state={kg}>
        {(d) => (
          <>
            <p className="mb-3 text-sm font-semibold">
              {d.total_node.toLocaleString("id-ID")} node · {d.total_relasi.toLocaleString("id-ID")} relasi
            </p>
            <div className="mb-3 grid gap-3 md:grid-cols-2">
              <Card>
                <h2 className="mb-2 text-[17px] font-extrabold">Node per tipe</h2>
                <BarList items={toItems(d.node)} />
              </Card>
              <Card>
                <h2 className="mb-2 text-[17px] font-extrabold">Relasi per tipe</h2>
                <BarList items={toItems(d.relasi)} />
              </Card>
            </div>
          </>
        )}
      </Async>
      <Async state={profil}>
        {(list) => (
          <Card>
            <h2 className="text-[17px] font-extrabold">Relasi dominan sebuah profil</h2>
            <p className="mb-2 text-sm text-[#6b7c8d]">
              Pilih profil untuk melihat node yang menjadi ciri utamanya beserta persentase bobot relasi.
            </p>
            <select
              value={i}
              onChange={(e) => setI(+e.target.value)}
              aria-label="Pilih profil"
              className="mb-2 rounded-xl border border-[#e3ebf3] bg-white px-3 py-2 text-sm"
            >
              {list.map((p, k) => (
                <option key={p.id} value={k}>
                  {p.nama} ({p.tingkat})
                </option>
              ))}
            </select>
            <GraphView profil={list[i]} />
          </Card>
        )}
      </Async>
    </>
  );
}
