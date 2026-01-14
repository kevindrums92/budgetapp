import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import BottomBar from "@/components/BottomBar";
import TopHeader from "@/components/TopHeader";
import UserDrawer from "@/components/UserDrawer";
import AddActionSheet from "@/components/AddActionSheet";

import HomePage from "@/pages/HomePage";
import BudgetPage from "@/pages/BudgetPage";
import StatsPage from "@/pages/StatsPage";
import TripsPage from "@/pages/TripsPage";
import TripDetailPage from "@/pages/TripDetailPage";
import AddEditTripPage from "@/pages/AddEditTripPage";
import AddEditTripExpensePage from "@/pages/AddEditTripExpensePage";
import AddEditTransactionPage from "@/pages/AddEditTransactionPage";
import AddEditCategoryPage from "@/pages/AddEditCategoryPage";

import CloudSyncGate from "@/components/CloudSyncGate";
import WelcomeGate from "@/components/WelcomeGate";
import SplashScreen from "@/components/SplashScreen";

function AppFrame() {
  const location = useLocation();
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  // Splash: visible solo al inicio
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setShowSplash(false), 900);
    return () => window.clearTimeout(t);
  }, []);

  const isFormRoute =
    location.pathname === "/add" ||
    location.pathname.startsWith("/edit/") ||
    location.pathname.startsWith("/trips/") ||
    location.pathname.startsWith("/category/");

  const title = useMemo(() => {
    if (location.pathname === "/") return "Home";
    if (location.pathname === "/budget") return "Budget";
    if (location.pathname === "/stats") return "Stats";
    if (location.pathname === "/trips") return "Trips";
    return "Home";
  }, [location.pathname]);

  return (
    <>
      {/* Splash overlay (fade out por CSS/transition) */}
      <SplashScreen visible={showSplash} />

      {/* App */}
      <div className={`min-h-dvh bg-white ${showSplash ? "pointer-events-none" : ""}`}>
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
            <AddActionSheet
              open={addSheetOpen}
              onClose={() => setAddSheetOpen(false)}
            />
          </>
        )}

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/new" element={<AddEditTripPage />} />
          <Route path="/trips/:id" element={<TripDetailPage />} />
          <Route path="/trips/:id/edit" element={<AddEditTripPage />} />
          <Route
            path="/trips/:id/expense/new"
            element={<AddEditTripExpensePage />}
          />
          <Route
            path="/trips/:id/expense/:expenseId/edit"
            element={<AddEditTripExpensePage />}
          />

          <Route path="/add" element={<AddEditTransactionPage />} />
          <Route path="/edit/:id" element={<AddEditTransactionPage />} />

          <Route path="/category/new" element={<AddEditCategoryPage />} />
          <Route path="/category/:id/edit" element={<AddEditCategoryPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {!isFormRoute && <BottomBar onAdd={() => setAddSheetOpen(true)} />}
      </div>
    </>
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
