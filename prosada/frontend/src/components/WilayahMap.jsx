import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fmt, TK_COLOR } from "../lib/format";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const labelPendek = (nama) => nama.replace(/^Kab\. /, "");

/** Lingkaran berisi jumlah inovasi, nama wilayah di bawahnya. Ukuran mengikuti akar jumlah inovasi. */
function makeIcon(w, max) {
  const d = Math.round(22 + Math.sqrt(w.n / max) * 30);
  return L.divIcon({
    className: "pm-icon",
    html: `<div class="pm"><div class="pm-c" style="background:${TK_COLOR[w.tk]}">${w.n}</div><span class="pm-l">${esc(labelPendek(w.nama))}</span></div>`,
    iconSize: [d, d],
    iconAnchor: [d / 2, d / 2],
  });
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 10 });
  }, [points, map]);
  return null;
}

/** data: [{ nama, n, m, tk, lat, lng }]; max: jumlah inovasi terbesar (untuk skala ukuran yang stabil) */
export default function WilayahMap({ data, max, tinggi = "h-[calc(100vh-290px)] min-h-[520px]", scrollZoom = true }) {
  const items = useMemo(() => data.filter((w) => w.lat != null && w.lng != null), [data]);
  const points = useMemo(() => items.map((w) => [w.lat, w.lng]), [items]);

  return (
    <div className={`isolate ${tinggi} overflow-hidden rounded-2xl border border-[#e3ebf3] shadow-[0_4px_20px_rgba(15,23,42,0.06)]`}>
      <MapContainer center={[-7.6, 112.5]} zoom={8} scrollWheelZoom={scrollZoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {items.map((w) => (
          <Marker
            key={w.nama}
            position={[w.lat, w.lng]}
            icon={makeIcon(w, max)}
            zIndexOffset={Math.round(1000 / w.n)}
          >
            <Popup>
              <strong>{w.nama}</strong>
              <br />
              {w.n} inovasi
              <br />
              Rata-rata kematangan {fmt(w.m)}
              <br />
              Tingkat {w.tk}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
