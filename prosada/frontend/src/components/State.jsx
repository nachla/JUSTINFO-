import Card from "./Card";

export function Loading() {
  return <Card><p className="text-sm text-[#6b7c8d]">Memuat data…</p></Card>;
}

export function ErrorBox({ message }) {
  return (
    <div className="rounded-xl bg-[#fdecea] px-3 py-2 text-sm font-semibold text-[#a43a27]">
      {message}. Pastikan backend jalan di VITE_API_URL (default http://localhost:8000).
    </div>
  );
}

/** Bungkus halaman: tampilkan loading/error, atau render children(data). */
export function Async({ state, children }) {
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorBox message={state.error} />;
  return children(state.data);
}
