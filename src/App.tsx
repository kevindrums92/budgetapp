import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import BottomBar from "@/components/BottomBar";

import HomePage from "@/pages/HomePage";
import BudgetPage from "@/pages/BudgetPage";
import StatsPage from "@/pages/StatsPage";
import SettingsPage from "@/pages/SettingsPage";
import AddEditTransactionPage from "@/pages/AddEditTransactionPage";
import CloudSyncGate from "./components/CloudSyncGate";

function AppFrame() {
  const location = useLocation();
  const navigate = useNavigate();

  const isFormRoute =
    location.pathname === "/add" || location.pathname.startsWith("/edit/");

  return (
    <div className="min-h-dvh bg-white">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Add / Edit pages */}
        <Route path="/add" element={<AddEditTransactionPage />} />
        <Route path="/edit/:id" element={<AddEditTransactionPage />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Bottom navigation (no mostrar en add/edit) */}
      {!isFormRoute && <BottomBar onAdd={() => navigate("/add")} />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CloudSyncGate />
      <AppFrame />
    </BrowserRouter>
  );
}
