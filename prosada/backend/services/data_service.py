"""Membaca CSV Knowledge Graph (sekali, di-cache) lalu menghitung semua angka dashboard."""
import json
from functools import lru_cache
from pathlib import Path

import pandas as pd

from core.config import settings

DATA_DIR = Path(settings.DATA_DIR) if settings.DATA_DIR else Path(__file__).parent.parent / "data"

BENTUK_PENDEK = {
    "Inovasi pelayanan publik": "Pelayanan publik",
    "Inovasi Daerah lainnya sesuai dengan Urusan Pemerintahan yang menjadi kewenangan Daerah": "Lainnya sesuai urusan",
    "Inovasi tata kelola pemerintahan daerah": "Tata kelola pemda",
}
NAME_COLS = ("nama_jenis", "nama_bentuk", "nama_urusan", "nama_tahapan",
             "nama_daerah", "nama_opd", "nama_asta_cipta", "nama_profil")


# ------------------------------------------------------------------ helper
def idn(x, nd=1):
    """Angka desimal gaya Indonesia: 63.3 -> 63,3"""
    return f"{x:.{nd}f}".replace(".", ",")


def short(t):
    t = BENTUK_PENDEK.get(str(t), str(t))
    t = t[:1].upper() + t[1:]
    return t if len(t) <= 45 else t[:42] + "…"


def daerah_pendek(n):
    return n.replace("Kabupaten ", "Kab. ")


# ------------------------------------------------------------------ loader
@lru_cache(maxsize=1)
def load_nodes() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "knowledge_graph_nodes.csv", encoding="utf-8-sig")


@lru_cache(maxsize=1)
def load_edges() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "knowledge_graph_edges.csv", encoding="utf-8-sig")


@lru_cache(maxsize=1)
def load_inovasi() -> pd.DataFrame:
    n = load_nodes()
    return n[n.type == "Inovasi"].copy()


@lru_cache(maxsize=1)
def name_map() -> dict:
    out = {}
    for r in load_nodes().to_dict("records"):
        for c in NAME_COLS:
            if isinstance(r.get(c), str):
                out[r["node_id"]] = r[c]
                break
    return out


@lru_cache(maxsize=1)
def daerah_id_map() -> dict:
    n = load_nodes()
    return {r["nama_daerah"]: r["node_id"] for r in n[n.type == "Daerah"].to_dict("records")}


def edges_of(relation: str) -> pd.DataFrame:
    e = load_edges()
    return e[e.relation == relation]


# ------------------------------------------------------------------ profil
def get_dominan(pid: str) -> dict:
    e = load_edges()
    dom = e[e.relation.str.startswith("DOMINAN_") & (e.source_id == pid)]
    names = name_map()
    out = {}
    for rel, g in dom.groupby("relation"):
        g = g.sort_values("percentage", ascending=False).head(3)
        out[rel[8:].lower()] = [
            {"nama": short(names.get(t, t)), "pct": round(float(p), 1)}
            for t, p in zip(g.target_id, g.percentage)
        ]
    return out


@lru_cache(maxsize=1)
def get_profil() -> list:
    nodes, inv = load_nodes(), load_inovasi()
    hasil = []
    profil = nodes[nodes.type.isin(["ProfilEkosistemInovasi", "ProfilKarakteristikInovasi"])]
    for r in profil.to_dict("records"):
        pid = r["node_id"]
        cid = int(r["source_cluster_id"])
        eko = pid.startswith("PROFILE_EKO")
        jc = "Cluster_Wilayah" if eko else "Cluster_Inovasi_Provinsi"
        sub = inv[(inv.jenis_cluster == jc) & (inv.cluster == cid)]
        ringkas = (f"{sub.daerah.nunique()} wilayah · {len(sub)} inovasi" if eko
                   else f"{len(sub)} inovasi provinsi")
        nama = r["nama_profil"].replace("Profil ", "").replace("Karakteristik ", "")
        hasil.append({"id": pid, "nama": nama, "tingkat": r["tingkat_kematangan"],
                      "ringkas": ringkas, "n_inovasi": len(sub), **get_dominan(pid)})
    return hasil


def profil_by_id() -> dict:
    return {p["id"]: p for p in get_profil()}


# ------------------------------------------------------------------ dashboard
@lru_cache(maxsize=1)
def load_koordinat() -> dict:
    """Titik tengah tiap kab/kota untuk peta (backend/data/koordinat_wilayah.json)."""
    with open(DATA_DIR / "koordinat_wilayah.json", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def get_wilayah() -> list:
    inv = load_inovasi()
    w = inv[inv.jenis_wilayah != "Provinsi"].dropna(subset=["daerah"])
    g = (w.groupby("daerah")
          .agg(n=("node_id", "count"), m=("kematangan", "mean"), tk=("tingkat_kematangan", "first"))
          .reset_index().sort_values(["n", "daerah"], ascending=[False, True]))
    koor = load_koordinat()
    hasil = []
    for r in g.itertuples():
        nama = daerah_pendek(r.daerah)
        lat, lng = koor.get(nama, (None, None))
        hasil.append({"nama": nama, "n": int(r.n), "m": round(float(r.m), 1), "tk": r.tk,
                      "lat": lat, "lng": lng})
    return hasil


def get_ringkasan() -> dict:
    nodes, inv, wil = load_nodes(), load_inovasi(), get_wilayah()
    tk = [{"tingkat": t,
           "wilayah": sum(1 for w in wil if w["tk"] == t),
           "inovasi": sum(w["n"] for w in wil if w["tk"] == t)}
          for t in ("Tinggi", "Sedang", "Rendah")]
    return {
        "inovasi": len(inv),
        "pemda": int(inv.daerah.nunique()),
        "opd": int((nodes.type == "AdminOPD").sum()),
        "penerapan_pct": round(float((inv.tahapan_inovasi == "Penerapan").mean() * 100), 1),
        "avg_kematangan": round(float(inv.kematangan.mean()), 1),
        "jenis": [{"nama": k, "n": int(v)} for k, v in inv.jenis.value_counts().items()],
        "bentuk": [{"nama": short(k), "n": int(v)} for k, v in inv.bentuk_inovasi.value_counts().items()],
        "tk": tk,
        "top": wil[:8],
    }


def get_kg() -> dict:
    nodes, edges = load_nodes(), load_edges()
    return {
        "total_node": len(nodes),
        "total_relasi": len(edges),
        "node": [{"nama": k, "n": int(v)} for k, v in nodes.type.value_counts().items()],
        "relasi": [{"nama": k, "n": int(v)} for k, v in edges.relation.value_counts().items()],
    }
