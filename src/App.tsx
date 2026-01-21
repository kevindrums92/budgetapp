import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import BottomBar from "@/shared/components/layout/BottomBar";
import TopHeader from "@/shared/components/layout/TopHeader";

// Eager load core pages (HomePage, BudgetPage)
import HomePage from "@/features/transactions/pages/HomePage";
import BudgetPage from "@/features/budget/pages/BudgetPage";
import AddEditTransactionPage from "@/features/transactions/pages/AddEditTransactionPage";

// Lazy load heavy pages (Recharts, complex features)
const StatsPage = lazy(() => import("@/features/stats/pages/StatsPage"));
const TripsPage = lazy(() => import("@/features/trips/pages/TripsPage"));
const TripDetailPage = lazy(() => import("@/features/trips/pages/TripDetailPage"));
const AddEditTripPage = lazy(() => import("@/features/trips/pages/AddEditTripPage"));
const AddEditTripExpensePage = lazy(() => import("@/features/trips/pages/AddEditTripExpensePage"));
const ProfilePage = lazy(() => import("@/features/profile/pages/ProfilePage"));
const BackupPage = lazy(() => import("@/features/backup/pages/BackupPage"));

// Lazy load category pages
const AddEditCategoryPage = lazy(() => import("@/features/categories/pages/AddEditCategoryPage"));
const CategoriesPage = lazy(() => import("@/features/categories/pages/CategoriesPage"));
const CategoryGroupsPage = lazy(() => import("@/features/categories/pages/CategoryGroupsPage"));
const AddEditCategoryGroupPage = lazy(() => import("@/features/categories/pages/AddEditCategoryGroupPage"));
const CategoryMonthDetailPage = lazy(() => import("@/features/categories/pages/CategoryMonthDetailPage"));

import CloudSyncGate from "@/shared/components/providers/CloudSyncGate";
import WelcomeGate from "@/shared/components/providers/WelcomeGate";
import SplashScreen from "@/shared/components/ui/SplashScreen";
import SchedulerJob from "@/shared/components/jobs/SchedulerJob";

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}

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

        <Suspense fallback={<PageLoader />}>
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
        </Suspense>

        {!isFormRoute && <BottomBar />}
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CloudSyncGate />
      <SchedulerJob />
      <AppFrame />
      <WelcomeGate />
    </BrowserRouter>
  );
}
