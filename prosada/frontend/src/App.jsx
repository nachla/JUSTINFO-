import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import WilayahPage from "./pages/WilayahPage";
import ProfilPage from "./pages/ProfilPage";
import KnowledgeGraphPage from "./pages/KnowledgeGraphPage";
import AiInsightPage from "./pages/AiInsightPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/wilayah" element={<WilayahPage />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
        <Route path="/ai-insight" element={<AiInsightPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
