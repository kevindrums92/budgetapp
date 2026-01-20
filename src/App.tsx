import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import BottomBar from "@/shared/components/layout/BottomBar";
import TopHeader from "@/shared/components/layout/TopHeader";

import HomePage from "@/features/transactions/pages/HomePage";
import BudgetPage from "@/features/budget/pages/BudgetPage";
import StatsPage from "@/features/stats/pages/StatsPage";
import TripsPage from "@/features/trips/pages/TripsPage";
import TripDetailPage from "@/features/trips/pages/TripDetailPage";
import AddEditTripPage from "@/features/trips/pages/AddEditTripPage";
import AddEditTripExpensePage from "@/features/trips/pages/AddEditTripExpensePage";
import AddEditTransactionPage from "@/features/transactions/pages/AddEditTransactionPage";
import AddEditCategoryPage from "@/features/categories/pages/AddEditCategoryPage";
import CategoriesPage from "@/features/categories/pages/CategoriesPage";
import CategoryGroupsPage from "@/features/categories/pages/CategoryGroupsPage";
import AddEditCategoryGroupPage from "@/features/categories/pages/AddEditCategoryGroupPage";
import CategoryMonthDetailPage from "@/features/categories/pages/CategoryMonthDetailPage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import BackupPage from "@/features/backup/pages/BackupPage";

import CloudSyncGate from "@/shared/components/providers/CloudSyncGate";
import WelcomeGate from "@/shared/components/providers/WelcomeGate";
import SplashScreen from "@/shared/components/ui/SplashScreen";

function AppFrame() {
  const location = useLocation();

  // Splash: visible solo al inicio
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setShowSplash(false), 900);
    return () => window.clearTimeout(t);
  }, []);

  const isFormRoute =
    location.pathname === "/add" ||
    location.pathname === "/profile" ||
    location.pathname === "/backup" ||
    location.pathname.startsWith("/edit/") ||
    location.pathname.startsWith("/trips/") ||
    location.pathname.startsWith("/category") ||
    location.pathname.startsWith("/categories");

  const title = useMemo(() => {
    if (location.pathname === "/") return "Home";
    if (location.pathname === "/budget") return "Budget";
    if (location.pathname === "/stats") return "Stats";
    if (location.pathname === "/trips") return "Trips";
    return "Home";
  }, [location.pathname]);

  const showMonthSelector = useMemo(() => {
    return location.pathname === "/" ||
           location.pathname === "/budget" ||
           location.pathname === "/stats";
  }, [location.pathname]);

  return (
    <>
      {/* Splash overlay (fade out por CSS/transition) */}
      <SplashScreen visible={showSplash} />

      {/* App */}
      <div className={`min-h-dvh bg-white ${showSplash ? "pointer-events-none" : ""}`}>
        {!isFormRoute && <TopHeader title={title} showMonthSelector={showMonthSelector} />}

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
          <Route path="/category/:categoryId/month/:month" element={<CategoryMonthDetailPage />} />

          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/category-groups" element={<CategoryGroupsPage />} />
          <Route path="/category-group/new" element={<AddEditCategoryGroupPage />} />
          <Route path="/category-group/:id/edit" element={<AddEditCategoryGroupPage />} />

          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/backup" element={<BackupPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {!isFormRoute && <BottomBar />}
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
