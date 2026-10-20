from pydantic import BaseModel


class CountItem(BaseModel):
    nama: str
    n: int


class Dominan(BaseModel):
    nama: str
    pct: float


class WilayahItem(BaseModel):
    nama: str
    n: int
    m: float
    tk: str
    lat: float | None = None
    lng: float | None = None


class TingkatItem(BaseModel):
    tingkat: str
    wilayah: int
    inovasi: int


class RingkasanResponse(BaseModel):
    inovasi: int
    pemda: int
    opd: int
    penerapan_pct: float
    avg_kematangan: float
    jenis: list[CountItem]
    bentuk: list[CountItem]
    tk: list[TingkatItem]
    top: list[WilayahItem]


class ProfilItem(BaseModel):
    id: str
    nama: str
    tingkat: str
    ringkas: str
    n_inovasi: int
    jenis: list[Dominan] = []
    bentuk: list[Dominan] = []
    urusan: list[Dominan] = []
    tahapan: list[Dominan] = []
    wilayah: list[str] = []


class KgResponse(BaseModel):
    total_node: int
    total_relasi: int
    node: list[CountItem]
    relasi: list[CountItem]
