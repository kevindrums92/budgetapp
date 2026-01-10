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
import UserDrawer from "@/components/UserDrawer";

import HomePage from "@/pages/HomePage";
import BudgetPage from "@/pages/BudgetPage";
import StatsPage from "@/pages/StatsPage";
import SettingsPage from "@/pages/SettingsPage";
import AddEditTransactionPage from "@/pages/AddEditTransactionPage";
import CloudSyncGate from "@/components/CloudSyncGate";
import WelcomeGate from "./components/WelcomeGate";

function AppFrame() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);

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
          <TopHeader
            title={title}
            onOpenUserDrawer={() => setUserDrawerOpen(true)}
          />
          <UserDrawer
            open={userDrawerOpen}
            onClose={() => setUserDrawerOpen(false)}
          />
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
      <WelcomeGate />
    </BrowserRouter>
  );
}
