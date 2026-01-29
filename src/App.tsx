import { lazy, Suspense, useMemo } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { ThemeProvider } from "@/features/theme";
import { CurrencyProvider } from "@/features/currency";
import BottomBar from "@/shared/components/layout/BottomBar";
import TopHeader from "@/shared/components/layout/TopHeader";

// Eager load core pages (HomePage, PlanPage)
import HomePage from "@/features/transactions/pages/HomePage";
import PlanPage from "@/features/budget/pages/PlanPage";
import AddEditTransactionPage from "@/features/transactions/pages/AddEditTransactionPage";
import HistoryPage from "@/features/transactions/pages/HistoryPage";

// Lazy load budget detail page
const PlanDetailPage = lazy(() => import("@/features/budget/pages/PlanDetailPage"));

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

// Lazy load scheduled transactions page
const ScheduledPage = lazy(() => import("@/features/transactions/pages/ScheduledPage"));

// Lazy load settings pages
const LanguageSettingsPage = lazy(() => import("@/features/profile/pages/LanguageSettingsPage"));
const ThemeSettingsPage = lazy(() => import("@/features/profile/pages/ThemeSettingsPage"));
const CurrencySettingsPage = lazy(() => import("@/features/profile/pages/CurrencySettingsPage"));
const ExportCSVPage = lazy(() => import("@/features/profile/pages/ExportCSVPage"));
const NotificationSettingsPage = lazy(() => import("@/features/notifications/pages/NotificationSettingsPage"));

// Lazy load legal pages
const TermsOfServicePage = lazy(() => import("@/features/profile/pages/TermsOfServicePage"));
const PrivacyPolicyPage = lazy(() => import("@/features/profile/pages/PrivacyPolicyPage"));

import CloudSyncGate from "@/shared/components/providers/CloudSyncGate";
import OnboardingFlow from "@/features/onboarding/OnboardingFlow";
import OnboardingGate from "@/features/onboarding/OnboardingGate";
import BiometricGate from "@/features/biometric/components/BiometricGate";
import UpcomingTransactionsModal from "@/features/transactions/components/UpcomingTransactionsModal";

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500 dark:border-gray-700 dark:border-t-emerald-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
      </div>
    </div>
  );
}

function AppFrame() {
  const location = useLocation();

  const isFormRoute =
    location.pathname === "/add" ||
    location.pathname === "/backup" ||
    location.pathname === "/scheduled" ||
    location.pathname === "/history" ||
    location.pathname.startsWith("/edit/") ||
    location.pathname.startsWith("/plan/") ||
    location.pathname.startsWith("/trips/") ||
    location.pathname.startsWith("/category") ||
    location.pathname.startsWith("/categories") ||
    location.pathname.startsWith("/settings/") ||
    location.pathname.startsWith("/legal/") ||
    location.pathname.startsWith("/onboarding");

  const showMonthSelector = useMemo(() => {
    return location.pathname === "/" ||
           location.pathname === "/plan" ||
           location.pathname === "/stats";
  }, [location.pathname]);

  const isProfilePage = location.pathname === "/profile";

  return (
    <>
      {/* App */}
      <div className="min-h-dvh bg-white dark:bg-gray-950">
        {!isFormRoute && <TopHeader showMonthSelector={showMonthSelector} isProfilePage={isProfilePage} />}

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Onboarding routes */}
            <Route path="/onboarding/*" element={<OnboardingFlow />} />

            {/* Main app routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/plan/:id" element={<PlanDetailPage />} />
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
            <Route path="/scheduled" element={<ScheduledPage />} />
            <Route path="/history" element={<HistoryPage />} />

            <Route path="/category/new" element={<AddEditCategoryPage />} />
            <Route path="/category/:id/edit" element={<AddEditCategoryPage />} />
            <Route path="/category/:categoryId/month/:month" element={<CategoryMonthDetailPage />} />

            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category-groups" element={<CategoryGroupsPage />} />
            <Route path="/category-group/new" element={<AddEditCategoryGroupPage />} />
            <Route path="/category-group/:id/edit" element={<AddEditCategoryGroupPage />} />

            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/backup" element={<BackupPage />} />

            <Route path="/settings/language" element={<LanguageSettingsPage />} />
            <Route path="/settings/theme" element={<ThemeSettingsPage />} />
            <Route path="/settings/currency" element={<CurrencySettingsPage />} />
            <Route path="/settings/export-csv" element={<ExportCSVPage />} />
            <Route path="/settings/notifications" element={<NotificationSettingsPage />} />

            <Route path="/legal/terms" element={<TermsOfServicePage />} />
            <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />

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
    <ThemeProvider>
      <CurrencyProvider>
        <BrowserRouter>
          <CloudSyncGate />
          <OnboardingGate />
          <BiometricGate />
          <UpcomingTransactionsModal />
          <AppFrame />
        </BrowserRouter>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
