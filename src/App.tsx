import { useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import BottomBar from "@/components/BottomBar";
import TopHeader from "@/components/TopHeader";
import SideMenu from "@/components/SideMenu";

import HomePage from "@/pages/HomePage";
import BudgetPage from "@/pages/BudgetPage";
import StatsPage from "@/pages/StatsPage";
import SettingsPage from "@/pages/SettingsPage";
import AddEditTransactionPage from "@/pages/AddEditTransactionPage";
import CloudSyncGate from "@/components/CloudSyncGate";

function AppFrame() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isFormRoute =
    location.pathname === "/add" || location.pathname.startsWith("/edit/");

  const title = useMemo(() => {
    if (location.pathname === "/") return "Home";
    if (location.pathname === "/budget") return "Budget";
    if (location.pathname === "/stats") return "Stats";
    if (location.pathname === "/settings") return "Settings";
    return "Home";
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-white">
      {!isFormRoute && (
        <>
          <TopHeader title={title} onOpenMenu={() => setMenuOpen(true)} />
          <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="/add" element={<AddEditTransactionPage />} />
        <Route path="/edit/:id" element={<AddEditTransactionPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

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
