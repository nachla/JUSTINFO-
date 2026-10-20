# PROSADA: Production Web Application

Direktori ini berisi seluruh kode sumber **Aplikasi Web Produksi PROSADA (JUSTINFO)** yang siap di-deploy, terdiri dari:
1. **`backend/`**: REST API performa tinggi berbasis **FastAPI** dengan in-memory caching dan integrasi LLM Explainable AI.
2. **`frontend/`**: Dashboard interaktif modern berbasis **React 19**, **Vite**, **Tailwind CSS**, dan **Leaflet Maps**.

> **Catatan Arsitektur AI**:  
> Fitur AI pada aplikasi web ini menggunakan **Direct Knowledge Graph Context Injection + Explainable AI (XAI)**, bukan pipeline RAG tradisional berbasis vektor/chunking. Model LLM menerima konteks fakta graf yang kaya secara deterministik dan merespons dalam format terstruktur lengkap dengan alur penalaran, entitas graf, dan tingkat keyakinan. Jika kunci API tidak diisi, sistem otomatis berjalan lokal via fallback Knowledge Graph.

---

## 📂 Struktur Direktori Web App

```
prosada/
├── backend/            # REST API (FastAPI)
│   ├── core/           # Konfigurasi Pydantic Settings & Middleware CORS
│   ├── data/           # Dataset CSV aktif (nodes, edges, kg_source_df, koordinat)
│   ├── routers/        # Endpoint data analitik (/data/*) dan AI Chat (/ai/*)
│   ├── schemas/        # Validasi schema data Pydantic
│   ├── services/       # data_service (agregasi KG in-memory) & ai_service (LLM + XAI)
│   ├── main.py         # Entry point aplikasi FastAPI & health check
│   ├── Procfile        # Konfigurasi start server untuk Railway/Heroku
│   └── requirements.txt# Dependensi Python backend
│
└── frontend/           # Single Page Application (React + Vite)
    ├── src/
    │   ├── assets/     # Logo resmi JUSTINFO, BRIDA Jatim, dan media
    │   ├── components/ # WilayahMap (Leaflet), BarList, GraphView, ChatbotWidget, StatCard
    │   ├── hooks/      # Custom hook data fetching (useFetch)
    │   ├── lib/        # Utilitas format (fmt) dan token warna (TK_COLOR)
    │   ├── pages/      # LandingPage, HomePage, WilayahPage, ProfilPage, KnowledgeGraphPage, AiInsightPage
    │   ├── services/   # Client API HTTP wrapper (apiFetch)
    │   ├── App.jsx     # Routing & navigasi aplikasi
    │   └── main.jsx    # Mount React DOM
    ├── index.html      # Dokumen HTML utama & metadata SEO
    ├── package.json    # Dependensi npm frontend
    ├── vercel.json     # Konfigurasi rewrite SPA Vercel
    └── vite.config.js  # Konfigurasi bundler Vite
```

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Menjalankan Backend (FastAPI)

Buka terminal pertama di direktori `prosada/backend`:

```bash
cd prosada/backend

# Buat virtual environment (disarankan)
python -m venv .venv
# Aktivasi:
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate

# Install dependensi
pip install -r requirements.txt

# Siapkan environment variables
cp .env.example .env

# Jalankan server API
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

* **Swagger UI API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Menjalankan Frontend (React + Vite)

Buka terminal kedua di direktori `prosada/frontend`:

```bash
cd prosada/frontend

# Install dependensi npm
npm install

# Siapkan environment variables
cp .env.example .env

# Jalankan server development Vite
npm run dev
```

* Buka dashboard di peramban: [http://localhost:5173](http://localhost:5173)

---

## 📡 Daftar Endpoint REST API

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/health` | Healthcheck status server (`{"status": "ok"}`) |
| `GET` | `/data/ringkasan` | Statistik agregat inovasi Jatim, jenis, bentuk, tingkat wilayah, dan peringkat wilayah |
| `GET` | `/data/wilayah` | Sebaran 38 kab/kota, rata-rata skor kematangan, dan titik koordinat geografis |
| `GET` | `/data/profil` | Profil ekosistem wilayah (3) dan karakteristik provinsi (3) beserta bobot dominan |
| `GET` | `/data/kg` | Metadata ukuran Knowledge Graph (1.073 node & 5.817 relasi) |
| `GET` | `/ai/status` | Status ketersediaan integrasi Groq AI dan ringkasan metrik graf |
| `POST` | `/ai/chat` | Chatbot multi-turn dengan Explainable AI (XAI): `{"pertanyaan": "...", "history": [...]}` |

---

## ⚙️ Variabel Lingkungan (Environment Variables)

### Backend (`prosada/backend/.env`)
* `FRONTEND_URL`: URL aplikasi frontend untuk CORS. Mendukung multi-domain dengan tanda koma (contoh: `http://localhost:5173,https://prosada.vercel.app`).
* `GROQ_API_KEY`: API Key Groq Cloud (opsional, jika kosong sistem otomatis beralih ke fallback Knowledge Graph lokal).
* `GROQ_MODEL`: Model LLM Groq (default: `openai/gpt-oss-120b` atau `llama-3.3-70b-versatile`).
* `DATA_DIR`: Path folder dataset CSV (kosongkan untuk default `prosada/backend/data`).

### Frontend (`prosada/frontend/.env`)
* `VITE_API_URL`: URL publik backend FastAPI (contoh: `http://localhost:8000` untuk lokal, atau URL Railway saat deploy).

---

## 🌐 Panduan Deployment

### Backend ke Railway / Render
1. Sambungkan repository GitHub ke Railway / Render.
2. Tetapkan **Root Directory**: `prosada/backend`.
3. Tambahkan environment variables: `FRONTEND_URL` dan `GROQ_API_KEY`.
4. Railway otomatis membaca perintah jalannya dari berkas [`Procfile`](file:///c:/KULIAH/Andro%20sems%207/Project-Data-Science/prosada/backend/Procfile).

### Frontend ke Vercel
1. Import repository ke Vercel.
2. Tetapkan **Root Directory**: `prosada/frontend`.
3. Framework preset terdeteksi otomatis sebagai **Vite**.
4. Tambahkan environment variable: `VITE_API_URL` dengan alamat backend production Anda.
5. Routing SPA otomatis ditangani oleh berkas [`vercel.json`](file:///c:/KULIAH/Andro%20sems%207/Project-Data-Science/prosada/frontend/vercel.json).
