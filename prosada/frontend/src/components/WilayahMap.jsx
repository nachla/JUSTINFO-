import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from "react-leaflet";
import { Layers, Cpu, Sparkles, AlertCircle, ChevronUp, ChevronDown } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { fmt } from "../lib/format";

/** Metadata 3 Model Clustering yang diuji pada penelitian */
export const CLUSTERING_MODELS = {
  kmeans: {
    id: "kmeans",
    nama: "K-Means",
    singkat: "K-Means",
    tipe: "Centroid-based Partitioning",
    tag: "Terpilih",
    badgeColor: "#0d9488",
    isBest: true,
    metrics: {
      k: 3,
      silhouette: 0.5747,
      dbi: 0.5421,
      ch: 37.3688,
      ari: 1.0000,
    },
    deskripsi: "Model terbaik (Silhouette 0.5747, DBI 0.5421, ARI 1.000).",
    ringkasan: "5 Klaster 1, 27 Klaster 2, 3 Klaster 3.",
  },
  kmedoids: {
    id: "kmedoids",
    nama: "K-Medoids",
    singkat: "K-Medoids",
    tipe: "Medoid-based Partitioning (PAM)",
    tag: "PAM",
    badgeColor: "#0284c7",
    isBest: false,
    metrics: {
      k: 3,
      silhouette: 0.5747,
      dbi: 0.5421,
      ch: 37.3688,
      ari: 1.0000,
    },
    deskripsi: "Menggunakan medoid riil. Partisi identik dengan K-Means pada K=3.",
    ringkasan: "5 Klaster 1, 27 Klaster 2, 3 Klaster 3.",
  },
  fcm: {
    id: "fcm",
    nama: "Fuzzy C-Means",
    singkat: "FCM (Fuzzy)",
    tipe: "Fuzzy Soft Clustering",
    tag: "Soft",
    badgeColor: "#7c3aed",
    isBest: false,
    metrics: {
      k: 3,
      silhouette: 0.5623,
      dbi: 0.5940,
      ch: 22.4738,
      fpc: 0.6933,
      ari: 0.9035,
    },
    deskripsi: "Soft clustering. Kota Batu masuk ke Klaster Rendah (FPC 0.6933).",
    ringkasan: "5 Klaster 1, 26 Klaster 2, 4 Klaster 3 (termasuk Kota Batu).",
  },
};

/** Metadata Klaster */
export const CLUSTER_META = {
  1: {
    id: 1,
    nama: "Klaster 1",
    profil: "Profil Ekosistem Wilayah 1",
    tingkat: "Tinggi",
    color: "#0d9488", // Teal/Emerald
    glow: "rgba(13, 148, 136, 0.35)",
    border: "#0f766e",
    bgSoft: "#ccfbf1",
    textSoft: "#115e59",
    deskripsi: "Klaster wilayah terdepan dengan rata-rata kematangan inovasi tertinggi di Jawa Timur.",
  },
  2: {
    id: 2,
    nama: "Klaster 2",
    profil: "Profil Ekosistem Wilayah 2",
    tingkat: "Sedang",
    color: "#d97706", // Amber / Oranye
    glow: "rgba(217, 119, 6, 0.35)",
    border: "#b45309",
    bgSoft: "#fef3c7",
    textSoft: "#92400e",
    deskripsi: "Klaster wilayah berkembang dengan persebaran inovasi daerah yang merata.",
  },
  3: {
    id: 3,
    nama: "Klaster 3",
    profil: "Profil Ekosistem Wilayah 3",
    tingkat: "Rendah",
    color: "#e11d48", // Rose / Merah
    glow: "rgba(225, 29, 72, 0.35)",
    border: "#be123c",
    bgSoft: "#ffe4e6",
    textSoft: "#9f1239",
    deskripsi: "Klaster wilayah bertumbuh dengan potensi peningkatan kematangan dan adopsi inovasi.",
  },
};

/** Pemetaan hasil klastering wilayah untuk ketiga model (K-Means, K-Medoids, Fuzzy C-Means) */
export function getModelCluster(namaWilayah, modelId = "kmeans") {
  const norm = String(namaWilayah ?? "").trim().toLowerCase();

  // Klaster 1 (Tinggi - 5 wilayah di semua 3 model)
  const isTinggi =
    norm.includes("jember") ||
    (norm.includes("kediri") && norm.includes("kab")) ||
    (norm.includes("malang") && norm.includes("kab")) ||
    norm.includes("pamekasan") ||
    norm.includes("surabaya");

  if (isTinggi) return 1;

  // Klaster 3 (Rendah - basis wilayah)
  const isRendahBase =
    norm.includes("bondowoso") ||
    norm.includes("sumenep") ||
    (norm.includes("malang") && norm.includes("kota"));

  if (isRendahBase) return 3;

  // Pada Fuzzy C-Means, Kota Batu (kematangan 15.0) masuk Klaster 3 Rendah
  if (modelId === "fcm" && norm.includes("batu")) {
    return 3;
  }

  // Sisanya masuk ke Klaster 2 Sedang
  return 2;
}

/** Cek apakah wilayah ini memiliki pergeseran klaster antar model */
export function isShiftedRegion(namaWilayah) {
  const norm = String(namaWilayah ?? "").trim().toLowerCase();
  return norm.includes("batu");
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const labelPendek = (nama) => String(nama ?? "").replace(/^Kab\. /, "");

/** Andrew's monotone chain 2D Convex Hull algorithm */
export function getConvexHull(points) {
  if (!points || points.length <= 2) return points || [];
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower = [];
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/** Marker khusus klaster dengan penanda Klaster (K1, K2, K3), model, jumlah inovasi, dan label wilayah */
function makeClusterIcon(w, modelId, mode, isDimmed, isHighlightedDiff) {
  const cId = getModelCluster(w.nama, modelId);
  const meta = CLUSTER_META[cId] || CLUSTER_META[2];
  const color = meta.color;
  const shortName = labelPendek(w.nama);
  const dim = isHighlightedDiff ? 40 : 34;
  const opacity = isDimmed ? "0.25" : "1";

  const mainText = mode === "inovasi" ? w.n : `K${cId}`;
  const badgeText = mode === "inovasi" ? `K${cId}` : w.n;

  return L.divIcon({
    className: "cluster-map-icon",
    html: `
      <div class="cmi-wrap ${isDimmed ? 'cmi-dimmed' : ''} ${isHighlightedDiff ? 'cmi-highlight-diff' : ''}" style="opacity: ${opacity};">
        <div class="cmi-halo" style="background: ${color}; ${isHighlightedDiff ? 'animation: cmi-pulse-diff 1.5s infinite;' : ''}"></div>
        <div class="cmi-pin" style="background: ${color}; ${isHighlightedDiff ? 'border: 3px solid #f59e0b; box-shadow: 0 0 14px rgba(245, 158, 11, 0.8);' : ''}">
          <span class="cmi-text-main">${esc(mainText)}</span>
          <span class="cmi-badge" title="${mode === 'inovasi' ? `Klaster ${cId}` : `${w.n} inovasi`}">${esc(badgeText)}</span>
          ${isHighlightedDiff ? '<span class="cmi-diff-tag">SHIFT</span>' : ''}
        </div>
        <span class="cmi-name" style="${isHighlightedDiff ? 'color: #b45309; font-weight: 900;' : ''}">${esc(shortName)}</span>
      </div>
    `,
    iconSize: [dim, dim],
    iconAnchor: [dim / 2, dim / 2],
  });
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 10 });
    }
  }, [points, map]);
  return null;
}

export default function WilayahMap({
  data = [],
  max = 1,
  tinggi = "h-[calc(100vh-270px)] min-h-[560px]",
  scrollZoom = true,
  showControls = true,
  defaultModel = "kmeans",
}) {
  const [activeModel, setActiveModel] = useState(defaultModel);
  const [viewMode, setViewMode] = useState("klaster"); // "klaster" | "inovasi"
  const [showPolygons, setShowPolygons] = useState(true);
  const [highlightDiff, setHighlightDiff] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const modelInfo = CLUSTERING_MODELS[activeModel] || CLUSTERING_MODELS.kmeans;

  // Ambil hanya item dengan koordinat valid
  const items = useMemo(() => data.filter((w) => w.lat != null && w.lng != null), [data]);

  // Kelompokkan wilayah berdasarkan klaster SESUAI MODEL AKTIF
  const clusterGroups = useMemo(() => {
    const groups = { 1: [], 2: [], 3: [] };
    items.forEach((item) => {
      const cId = getModelCluster(item.nama, activeModel);
      if (groups[cId]) groups[cId].push(item);
    });

    return {
      1: {
        meta: CLUSTER_META[1],
        items: groups[1],
        points: groups[1].map((w) => [w.lat, w.lng]),
        hull: getConvexHull(groups[1].map((w) => [w.lat, w.lng])),
      },
      2: {
        meta: CLUSTER_META[2],
        items: groups[2],
        points: groups[2].map((w) => [w.lat, w.lng]),
        hull: getConvexHull(groups[2].map((w) => [w.lat, w.lng])),
      },
      3: {
        meta: CLUSTER_META[3],
        items: groups[3],
        points: groups[3].map((w) => [w.lat, w.lng]),
        hull: getConvexHull(groups[3].map((w) => [w.lat, w.lng])),
      },
    };
  }, [items, activeModel]);

  const activePoints = useMemo(() => items.map((w) => [w.lat, w.lng]), [items]);

  return (
    <div className={`relative isolate ${tinggi} overflow-hidden rounded-2xl border border-[#e3ebf3] bg-[#f8fbfe] shadow-[0_4px_24px_rgba(15,23,42,0.08)]`}>
      {/* Floating Compact Model Controls di Pojok Kanan Atas (tidak menutupi peta / zoom tombol) */}
      {showControls && (
        <div className="absolute top-3 right-3 z-[1000] pointer-events-auto transition-all">
          {isCollapsed ? (
            /* Mode Minimalis (Pill tunggal) */
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="flex items-center gap-2 rounded-xl border border-white/90 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#113d64] shadow-md backdrop-blur-md hover:bg-white transition"
              title="Buka panel model clustering"
            >
              <Cpu size={14} className="text-[#0e8fa8]" />
              <span>Model: <b className="text-[#0e8fa8]">{modelInfo.singkat}</b></span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-[#64748b]">
                {showPolygons ? "Area: On" : "Area: Off"}
              </span>
              <ChevronDown size={14} className="text-[#94a3b8]" />
            </button>
          ) : (
            /* Mode Kompak Ramping */
            <div className="w-[310px] rounded-2xl border border-white/90 bg-white/95 p-2.5 shadow-lg backdrop-blur-md">
              {/* Header Ramping */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#113d64]">
                  <Cpu size={14} className="text-[#0e8fa8]" />
                  <span>MODEL CLUSTERING</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCollapsed(true)}
                  className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold text-[#64748b] hover:bg-slate-100 hover:text-[#113d64]"
                  title="Sembunyikan panel"
                >
                  <span>Kecilkan</span>
                  <ChevronUp size={13} />
                </button>
              </div>

              {/* 3 Tombol Model Ramping */}
              <div className="grid grid-cols-3 gap-1 mb-2">
                {Object.values(CLUSTERING_MODELS).map((m) => {
                  const isActive = activeModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveModel(m.id)}
                      className={`rounded-lg py-1 px-1 text-center transition border ${
                        isActive
                          ? "border-[#113d64] bg-[#113d64] text-white shadow-xs font-bold"
                          : "border-[#e2e8f0] bg-[#f8fafc] text-[#334155] hover:bg-white text-xs font-medium"
                      }`}
                    >
                      <div className="text-[11px] truncate leading-tight">{m.singkat}</div>
                      <div className={`text-[9px] mt-0.5 ${isActive ? 'text-white/80' : 'text-[#94a3b8]'}`}>
                        Silh: {m.metrics.silhouette}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bar Status Metrik 1 Baris */}
              <div className="mb-2 flex items-center justify-between rounded-lg bg-[#f0f9ff] border border-[#bae6fd] px-2 py-1 text-[10.5px] text-[#0369a1]">
                <span className="font-bold flex items-center gap-1 truncate">
                  <Sparkles size={11} className="text-[#0284c7] shrink-0" />
                  <span className="truncate">{modelInfo.nama}</span>
                  {modelInfo.isBest && (
                    <span className="text-[9px] bg-[#0d9488] text-white px-1 py-0.2 rounded font-extrabold">
                      Best
                    </span>
                  )}
                </span>
                <span className="font-mono text-[9.5px] font-semibold shrink-0">
                  DBI: {modelInfo.metrics.dbi} {modelInfo.metrics.fpc ? `· FPC: ${modelInfo.metrics.fpc}` : `· ARI: 1.0`}
                </span>
              </div>

              {/* Toggles Bar Kompak */}
              <div className="flex items-center justify-between gap-1 border-t border-[#edf2f7] pt-1.5 text-[10.5px] text-[#64748b]">
                <label className="flex items-center gap-1 cursor-pointer select-none hover:text-[#113d64]">
                  <input
                    type="checkbox"
                    checked={showPolygons}
                    onChange={(e) => setShowPolygons(e.target.checked)}
                    className="rounded border-[#cbd5e1] text-[#0e8fa8] h-3.5 w-3.5"
                  />
                  <span className="font-semibold">Batas Area</span>
                </label>

                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "klaster" ? "inovasi" : "klaster")}
                  className="rounded px-1.5 py-0.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] font-bold text-[10px] text-[#1e293b]"
                >
                  Label: {viewMode === "klaster" ? "Klaster" : "Inovasi"}
                </button>

                <button
                  type="button"
                  onClick={() => setHighlightDiff(!highlightDiff)}
                  className={`rounded px-1.5 py-0.5 font-bold text-[10px] border transition flex items-center gap-1 ${
                    highlightDiff
                      ? "border-[#f59e0b] bg-[#fffbeb] text-[#b45309]"
                      : "border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#113d64]"
                  }`}
                  title="Sorot Kota Batu (bergeser di Fuzzy C-Means)"
                >
                  <AlertCircle size={10} className={highlightDiff ? "text-[#f59e0b]" : "text-[#94a3b8]"} />
                  <span>{highlightDiff ? "Sorot On" : "Sorot Beda"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Peta Leaflet */}
      <MapContainer
        center={[-7.6, 112.5]}
        zoom={8}
        scrollWheelZoom={scrollZoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds points={activePoints} />

        {/* Layer Poligon Convex Hull untuk Klaster Wilayah sesuai Model Aktif */}
        {showPolygons &&
          [1, 2, 3].map((cId) => {
            const group = clusterGroups[cId];
            if (!group || group.hull.length < 3) return null;
            const meta = group.meta;

            return (
              <Polygon
                key={`hull-${activeModel}-${cId}`}
                positions={group.hull}
                pathOptions={{
                  color: meta.border,
                  fillColor: meta.color,
                  fillOpacity: 0.1,
                  weight: 1.8,
                  dashArray: "4, 6",
                }}
              >
                <Tooltip sticky>
                  <div className="font-sans text-xs">
                    <strong style={{ color: meta.color }}>{meta.nama}</strong> ({meta.tingkat}) — {modelInfo.singkat}
                    <br />
                    <span>{meta.profil} · {group.items.length} wilayah</span>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

        {/* Marker Wilayah Tercluster */}
        {items.map((w) => {
          const cId = getModelCluster(w.nama, activeModel);
          const meta = CLUSTER_META[cId] || CLUSTER_META[2];
          const isDiff = isShiftedRegion(w.nama);
          const shouldHighlight = highlightDiff && isDiff;

          // Hitung klaster untuk masing-masing 3 model untuk perbandingan di popup
          const cKMeans = getModelCluster(w.nama, "kmeans");
          const cKMedoids = getModelCluster(w.nama, "kmedoids");
          const cFcm = getModelCluster(w.nama, "fcm");

          return (
            <Marker
              key={`${w.nama}-${activeModel}`}
              position={[w.lat, w.lng]}
              icon={makeClusterIcon(w, activeModel, viewMode, false, shouldHighlight)}
              zIndexOffset={shouldHighlight ? 2000 : 0}
            >
              <Popup className="cluster-custom-popup">
                <div className="min-w-[240px] max-w-[290px] overflow-hidden rounded-xl font-sans text-[#17324d]">
                  {/* Header Popup */}
                  <div
                    style={{ background: meta.color }}
                    className="flex items-center justify-between px-3.5 py-2.5 text-white"
                  >
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider opacity-90">
                        {meta.nama} ({modelInfo.singkat})
                      </span>
                      <h4 className="text-sm font-extrabold leading-tight">
                        {meta.profil}
                      </h4>
                    </div>
                    <span className="rounded-full border border-white/40 bg-white/20 px-2 py-0.5 text-[11px] font-extrabold backdrop-blur-xs">
                      {meta.tingkat}
                    </span>
                  </div>

                  {/* Isi Popup */}
                  <div className="bg-white p-3.5">
                    <div className="mb-2">
                      <h3 className="text-[15px] font-black text-[#113d64] leading-tight">
                        {w.nama}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-[#64748b]">
                        Kabupaten/Kota di Jawa Timur
                      </p>
                    </div>

                    <div className="mb-2.5 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2">
                        <span className="block text-[10px] font-semibold text-[#64748b]">
                          TOTAL INOVASI
                        </span>
                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-base font-black text-[#0f172a]">{w.n}</span>
                          <span className="text-[11px] text-[#64748b]">inovasi</span>
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2">
                        <span className="block text-[10px] font-semibold text-[#64748b]">
                          RATA-RATA SKOR
                        </span>
                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-base font-black text-[#0f172a]">{fmt(w.m)}</span>
                          <span className="text-[11px] text-[#64748b]">/ 135</span>
                        </div>
                      </div>
                    </div>

                    {/* Kartu Perbandingan 3 Model */}
                    <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2.5 mb-2">
                      <div className="text-[10.5px] font-extrabold text-[#113d64] mb-1.5 flex items-center justify-between">
                        <span>HASIL 3 MODEL:</span>
                        {isDiff ? (
                          <span className="text-[9.5px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            Beda di FCM
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Konsisten
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className={`flex items-center justify-between rounded px-1.5 py-0.5 ${activeModel === 'kmeans' ? 'bg-[#e0f2fe] font-bold text-[#0369a1]' : 'text-[#475569]'}`}>
                          <span>1. K-Means (Terpilih)</span>
                          <span className="font-semibold" style={{ color: CLUSTER_META[cKMeans].color }}>
                            Klaster {cKMeans} ({CLUSTER_META[cKMeans].tingkat})
                          </span>
                        </div>

                        <div className={`flex items-center justify-between rounded px-1.5 py-0.5 ${activeModel === 'kmedoids' ? 'bg-[#e0f2fe] font-bold text-[#0369a1]' : 'text-[#475569]'}`}>
                          <span>2. K-Medoids (PAM)</span>
                          <span className="font-semibold" style={{ color: CLUSTER_META[cKMedoids].color }}>
                            Klaster {cKMedoids} ({CLUSTER_META[cKMedoids].tingkat})
                          </span>
                        </div>

                        <div className={`flex items-center justify-between rounded px-1.5 py-0.5 ${activeModel === 'fcm' ? 'bg-[#e0f2fe] font-bold text-[#0369a1]' : 'text-[#475569]'}`}>
                          <span>3. Fuzzy C-Means</span>
                          <span className="font-semibold" style={{ color: CLUSTER_META[cFcm].color }}>
                            Klaster {cFcm} ({CLUSTER_META[cFcm].tingkat})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] p-2 text-[10.5px] text-[#166534] leading-relaxed">
                      <b>Karakteristik ({modelInfo.singkat}):</b> {meta.deskripsi}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
