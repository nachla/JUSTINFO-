import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ChatbotWidget from "./ChatbotWidget";

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="px-3.5 py-5 lg:ml-56 lg:px-8 lg:py-7">
        <Outlet />
      </main>
      <ChatbotWidget />
    </div>
  );
}
