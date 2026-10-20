# Prosada-Final: Data Science & Research Pipeline

Folder ini didedikasikan secara khusus untuk **fase riset data science, eksperimen machine learning (clustering), ekstraksi Knowledge Graph, dan eksplorasi analitik inovasi daerah Jawa Timur**.

Pipeline dalam folder ini mengolah data mentah dari BRIDA (Badan Riset dan Inovasi Daerah) Provinsi Jawa Timur hingga menghasilkan dataset graf terstruktur yang nantinya dikonsumsi oleh aplikasi web produksi di folder `prosada/`.

---

## 📂 Berkas & Komponen Riset

### 1. Dataset Mentah
* **`data_inovasi.xlsx`**: Dataset mentah indeks inovasi daerah Jawa Timur (Indeks Inovasi Daerah / IGA) yang memuat ratusan inovasi, data OPD, skor kematangan, urusan pemerintahan, jenis, dan bentuk inovasi.

### 2. Jupyter Notebooks (Pipeline Eksperimen)
* **`Pipeline_Inovasi_Jawa_Timur_Clustering_to_Knowledge_Graph_Final.ipynb`**  
  * *Tujuan*: Pipeline pembersihan data, eksplorasi data (EDA), rekayasa fitur (*feature engineering*), serta pemodelan clustering kematangan inovasi (*Tinggi*, *Sedang*, *Rendah*) untuk tingkat kab/kota dan provinsi.
  * *Hasil*: Pengelompokan klaster wilayah dan pemetaan node entitas graf.
* **`02_Knowledge_Graph_Graph_RAG_STEP5_FIXED.ipynb`**  
  * *Tujuan*: Konstruksi graf jaringan menggunakan NetworkX, penentuan relasi multi-dimensi (OPD, Urusan, Bentuk, Jenis, Tahapan, Profil), serta kalkulasi bobot relasi dominan (*DOMINAN_\**).
* **`03_Graph_RAG_GenAI_FINAL.ipynb`**  
  * *Tujuan*: Eksperimen tahap awal penggabungan graf dengan model LLM (Groq API) untuk menguji penarikan fakta graf dan evaluasi respon berbasis bukti (*evidence*).

### 3. Artefak Data & Knowledge Graph
* **`knowledge_graph_nodes.csv`**: Daftar 1.073 node entitas (Inovasi, Daerah, OPD, Urusan, Bentuk, Jenis, Tahapan, Asta Cipta, dan Profil).
* **`knowledge_graph_edges.csv`**: Daftar 5.817 relasi berarah dan berbobot antar entitas dalam graf.
* **`kg_source_df.csv`**: Dataset tabular hasil clustering yang memuat label klaster per inovasi.
* **`innovation_knowledge_graph.graphml`**: File format standar GraphML dari seluruh jaringan Knowledge Graph, siap dibuka di aplikasi visualisasi graf seperti **Gephi** atau **Cytoscape**.

---

## 🔄 Hubungan dengan Folder Aplikasi Web (`prosada/`)

```
[Prosada-Final/]                                  [prosada/backend/data/]
  knowledge_graph_nodes.csv  ──(disinkronkan)──>     knowledge_graph_nodes.csv
  knowledge_graph_edges.csv  ──(disinkronkan)──>     knowledge_graph_edges.csv
  kg_source_df.csv           ──(disinkronkan)──>     kg_source_df.csv
```

Hasil ekspor CSV dari folder riset ini menjadi basis data utama yang dibaca oleh backend FastAPI di `prosada/backend/data/`.

---

## 💻 Cara Menjalankan Notebook Secara Lokal

1. Siapkan environment Python:
   ```bash
   pip install pandas numpy scikit-learn matplotlib seaborn networkx openpyxl jupyter
   ```
2. Jalankan Jupyter Notebook / Lab:
   ```bash
   jupyter lab
   ```
3. Buka dan jalankan notebook secara berurutan mulai dari `Pipeline_Inovasi_Jawa_Timur_Clustering_to_Knowledge_Graph_Final.ipynb`.
