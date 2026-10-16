import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Database, Layers, MapPin, Menu, Network, Sparkles, X } from "lucide-react";
import WilayahMap from "../components/WilayahMap";
import BarList from "../components/BarList";
import useFetch from "../hooks/useFetch";
import { getKg, getRingkasan, getWilayah } from "../services/data";
import { fmt, TK_COLOR } from "../lib/format";
import justinfoLogo from "../assets/justinfo.png";
import heroFoto from "../assets/gubernur.png";
import berita1 from "../assets/youth.jpg";
import berita2 from "../assets/ejies.jpeg";
import berita3 from "../assets/governance-awards.jpg";
import berita4 from "../assets/istts.jpg";

const NAV = [
  ["hero", "Beranda"],
  ["fitur", "Fitur"],
  ["berita", "Berita"],
  ["peta", "Peta"],
  ["statistik", "Statistik"],
];
const BERITA = [
  { title: "Youth Innovation Initiative 2026 Dibuka", date: "2026", image: berita1,
    link: "https://ukmindonesia.id/baca-deskripsi-program/youth-innovation-initiative-2026-dibuka-lomba-inovasi-pemuda-jawa-timur-berhadiah-rp90-juta#google_vignette" },
  { title: "EJIES 2026 Catat 19.720 Inovasi Pendidikan", date: "2026", image: berita2,
    link: "https://www.msn.com/id-id/berita/nasional/ejies-2026-diluncurkan-dindik-jatim-catat-19720-inovasi-pendidikan/ar-AA1Wh8F8" },
  { title: "Jawa Timur Raih National Governance Awards 2026", date: "25 April 2026", image: berita3,
    link: "https://www.msn.com/id-id/berita/other/jawa-timur-raih-penghargaan-national-governance-awards-2026/ar-AA21JzT4" },
  { title: "iSTTS Gandeng Pemprov Jatim untuk Transformasi Digital", date: "9 Mei 2026", image: berita4,
    link: "https://timesindonesia.co.id/pendidikan/589133/istts-perkuat-posisi-sebagai-kampus-inovasi-gandeng-pemprov-jatim-ubah-data-jadi-solusi-nyata" },
];

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
const angka = (v) => (v == null ? "–" : typeof v === "number" ? v.toLocaleString("id-ID") : v);

function SectionHeader({ tag, title, sub }) {
  return (
    <div className="mb-9">
      <span className="mb-3 inline-block rounded-full bg-cyan-100 px-4 py-1 text-xs font-bold text-cyan-700">{tag}</span>
      <h2 className="text-3xl font-extrabold text-[#17324d]">{title}</h2>
      {sub && <p className="mt-1 max-w-2xl text-gray-500">{sub}</p>}
    </div>
  );
}

const FITUR = [
  { icon: MapPin, judul: "Clustering Wilayah", to: "/wilayah", warna: "bg-emerald-100 text-emerald-700",
    isi: "Kab/kota dikelompokkan menjadi tingkat kematangan Tinggi, Sedang, dan Rendah berdasarkan karakter inovasinya, lalu ditampilkan di peta." },
  { icon: Layers, judul: "Profil Ekosistem", to: "/profil", warna: "bg-blue-100 text-blue-700",
    isi: "Setiap cluster punya profil: jenis, bentuk, urusan, dan tahapan inovasi yang dominan, lengkap dengan persentasenya." },
  { icon: Network, judul: "Knowledge Graph", to: "/knowledge-graph", warna: "bg-violet-100 text-violet-700",
    isi: "Inovasi terhubung ke daerah, OPD, urusan, jenis, bentuk, tahapan, pilar Asta Cipta, dan profil dalam satu graph." },
  { icon: Sparkles, judul: "AI Insight", to: "/ai-insight", warna: "bg-amber-100 text-amber-700",
    isi: "Tanya dalam bahasa Indonesia. Jawaban diambil dari graph beserta evidence-nya, dan GenAI hanya merangkai kalimatnya." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const ring = useFetch(getRingkasan);
  const wil = useFetch(getWilayah);
  const kg = useFetch(getKg);
  const R = ring.data;
  const K = kg.data;

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* Navbar */}
      <nav className="fixed left-0 top-0 z-[9999] w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-6 md:px-12">
          <button onClick={() => scrollTo("hero")} aria-label="JUSTINFO, ke beranda">
            <img src={justinfoLogo} alt="JUSTINFO" className="h-16 w-auto object-contain" />
          </button>
          <div className="hidden items-center gap-8 lg:flex">
            {NAV.map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="group relative text-sm font-semibold text-[#27496d]">
                {label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-cyan-500 transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-xl border-2 border-[#27496d] px-5 py-2 text-sm font-semibold text-[#27496d] transition hover:bg-[#27496d] hover:text-white"
            >
              Buka Dashboard
            </button>
          </div>
          <button className="rounded-lg border border-gray-200 p-2 lg:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu">
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menu && (
          <div className="border-t border-gray-100 bg-white px-6 pb-4 lg:hidden">
            {NAV.map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  setMenu(false);
                  scrollTo(id);
                }}
                className="block w-full py-2.5 text-left text-sm font-semibold text-[#27496d]"
              >
                {label}
              </button>
            ))}
            <button onClick={() => navigate("/dashboard")} className="mt-2 w-full rounded-xl bg-[#113d64] py-2.5 text-sm font-semibold text-white">
              Buka Dashboard
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-[#071d36] via-[#113d64] to-[#0b5a63] pt-20">
        <img
          src={heroFoto}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 h-full w-full object-cover object-[70%_top] opacity-30 md:w-[62%] md:object-right-top md:opacity-100"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 40%)",
            maskImage: "linear-gradient(to right, transparent 0%, #000 40%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#071d36]/70 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1500px] px-6 pb-14 pt-20 md:px-12 md:pt-28">
          <div className="max-w-3xl">
            <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] text-white md:text-[52px]">
              Analitik Inovasi Daerah Jawa Timur
              <span className="block text-cyan-300">dari Clustering sampai AI Insight</span>
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-200">
              JUSTINFO memetakan kematangan inovasi tiap kab/kota, menyusun relasinya dalam Knowledge Graph, dan
              menjawab pertanyaan kebijakan dengan evidence yang bisa ditelusuri.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-[#113d64] shadow-lg transition hover:bg-cyan-50"
              >
                Buka Dashboard <ArrowRight size={18} />
              </button>
              <button
                onClick={() => scrollTo("peta")}
                className="rounded-2xl border-2 border-white/60 px-8 py-4 text-base font-semibold text-white transition hover:bg-white hover:text-[#113d64]"
              >
                Lihat Peta Inovasi
              </button>
            </div>
          </div>

          <div className="mt-14 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
            {[
              [R?.inovasi, "Inovasi tercatat"],
              [R?.pemda, "Pemerintah daerah"],
              [R?.opd, "Admin OPD"],
              [K?.total_relasi, "Relasi di Knowledge Graph"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <b className="block text-3xl font-extrabold tabular-nums text-white">{angka(v)}</b>
                <span className="text-xs text-slate-300">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1500px] px-6 pb-24 md:px-12">
        {/* Fitur */}
        <section id="fitur" className="scroll-mt-24 pt-20">
          <SectionHeader tag="Fitur" title="Apa yang bisa dilakukan JUSTINFO" sub="Empat modul yang saling terhubung, semuanya dibangun dari data inovasi daerah yang sama." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FITUR.map(({ icon: Icon, judul, isi, to, warna }) => (
              <Link
                key={judul}
                to={to}
                className="group flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${warna}`}>
                  <Icon size={22} />
                </span>
                <h3 className="text-lg font-bold text-[#17324d]">{judul}</h3>
                <p className="flex-1 text-sm leading-relaxed text-gray-500">{isi}</p>
                <span className="flex items-center gap-1 text-sm font-semibold text-cyan-700">
                  Buka <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Berita & penghargaan */}
        <section id="berita" className="scroll-mt-24 pt-20">
          <SectionHeader tag="Berita" title="Penghargaan & Kabar Inovasi Jawa Timur" sub="Update terbaru seputar inovasi dan capaian daerah Jawa Timur." />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {BERITA.map((item) => (
              <a
                key={item.title}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative overflow-hidden">
                  <img src={item.image} alt={item.title} loading="lazy" className="h-48 w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-cyan-700 shadow">{item.date}</span>
                </div>
                <div className="p-5">
                  <h3 className="mb-3 line-clamp-3 text-sm font-bold leading-snug text-[#17324d] transition group-hover:text-cyan-600">{item.title}</h3>
                  <span className="text-sm font-semibold text-cyan-600 group-hover:underline">Baca Selengkapnya →</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Peta */}
        <section id="peta" className="scroll-mt-24 pt-20">
          <SectionHeader tag="Peta" title="Sebaran inovasi per kab/kota" sub="Angka di lingkaran adalah jumlah inovasi, warna menunjukkan tingkat kematangan hasil clustering." />
          {wil.data ? (
            <WilayahMap data={wil.data} max={wil.data[0].n} tinggi="h-[480px]" scrollZoom={false} />
          ) : (
            <div className="h-[480px] animate-pulse rounded-3xl bg-gray-200" />
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              {Object.entries(TK_COLOR).map(([tk, c]) => (
                <span key={tk} className="flex items-center gap-1.5">
                  <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                  {tk}
                </span>
              ))}
            </div>
            <Link to="/wilayah" className="flex items-center gap-1 text-sm font-semibold text-cyan-700">
              Buka peta lengkap <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* Statistik */}
        <section id="statistik" className="scroll-mt-24 pt-20">
          <SectionHeader tag="Statistik" title="Gambaran umum inovasi" sub="Ringkasan dari seluruh inovasi yang tercatat di Knowledge Graph." />
          {R && (
            <>
              <div className="mb-4 grid gap-4 md:grid-cols-3">
                {R.tk.map((t) => (
                  <div key={t.tingkat} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm" style={{ borderTop: `4px solid ${TK_COLOR[t.tingkat]}` }}>
                    <span className="text-sm font-semibold text-gray-500">Tingkat {t.tingkat}</span>
                    <b className="mt-1 block text-4xl font-extrabold text-[#17324d]">{t.wilayah} <span className="text-base font-semibold text-gray-400">wilayah</span></b>
                    <span className="text-sm text-gray-500">memuat {t.inovasi} inovasi</span>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-[#17324d]">Jenis inovasi</h3>
                  <BarList palet items={R.jenis.map((x) => ({ label: x.nama, value: x.n, display: x.n, sub: `${fmt(((x.n / R.inovasi) * 100).toFixed(1))}%` }))} />
                  <p className="mt-4 text-xs text-gray-400">
                    {fmt(R.penerapan_pct)}% inovasi sudah tahap penerapan, rata-rata skor kematangan {fmt(R.avg_kematangan)}.
                  </p>
                </div>
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-[#17324d]">Wilayah dengan inovasi terbanyak</h3>
                  <BarList items={R.top.map((w) => ({ label: w.nama, value: w.n, color: TK_COLOR[w.tk], display: w.n }))} />
                </div>
              </div>
            </>
          )}
        </section>

        {/* CTA */}
        <section className="pt-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#113d64] to-[#0b5a63] p-8 text-white md:p-12">
            <Database className="absolute -right-6 -top-6 h-40 w-40 text-white/5" />
            <h2 className="mb-2 text-2xl font-extrabold md:text-3xl">Punya pertanyaan tentang inovasi daerah?</h2>
            <p className="mb-6 max-w-xl text-slate-200">
              Coba tanyakan karakteristik sebuah profil, data sebuah kab/kota, atau wilayah dengan inovasi terbanyak. Jawabannya selalu disertai evidence dari graph.
            </p>
            <button
              onClick={() => navigate("/ai-insight")}
              className="flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 font-semibold text-[#113d64] transition hover:bg-cyan-50"
            >
              Coba AI Insight <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-[#071d36] py-10 text-sm text-slate-400">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between md:px-12">
          <div>
            <img
              src={justinfoLogo}
              alt="JUSTINFO"
              className="mb-4 h-16 w-auto object-contain"
              style={{
                filter:
                  "drop-shadow(0 0 1px #fff) drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 6px rgba(255,255,255,0.6))",
              }}
            />
          </div>
          <div className="flex flex-wrap gap-5">
            <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link to="/wilayah" className="hover:text-white">Wilayah</Link>
            <Link to="/knowledge-graph" className="hover:text-white">Knowledge Graph</Link>
            <Link to="/ai-insight" className="hover:text-white">AI Insight</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
