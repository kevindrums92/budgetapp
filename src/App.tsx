import { lazy, Suspense, useMemo } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import * as Sentry from "@sentry/react";

import { ThemeProvider } from "@/features/theme";
import { CurrencyProvider } from "@/features/currency";
import BottomBar from "@/shared/components/layout/BottomBar";
import TopHeader from "@/shared/components/layout/TopHeader";
import RevenueCatProvider from "@/shared/components/providers/RevenueCatProvider";

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
const SubscriptionManagementPage = lazy(() => import("@/features/profile/pages/SubscriptionManagementPage"));

// Lazy load legal pages (now using landing site with proper i18n)
// const TermsOfServicePage = lazy(() => import("@/features/profile/pages/TermsOfServicePage"));
// const PrivacyPolicyPage = lazy(() => import("@/features/profile/pages/PrivacyPolicyPage"));

import CloudSyncGate from "@/shared/components/providers/CloudSyncGate";
import AdMobProvider from "@/shared/components/providers/AdMobProvider";
import OnboardingFlow from "@/features/onboarding/OnboardingFlow";
import OnboardingGate from "@/features/onboarding/OnboardingGate";
import BiometricGate from "@/features/biometric/components/BiometricGate";
import SessionExpiredGate from "@/features/session/components/SessionExpiredGate";
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
    location.pathname.startsWith("/profile/subscription") ||
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
            <Route path="/profile/subscription" element={<SubscriptionManagementPage />} />
            <Route path="/backup" element={<BackupPage />} />

            <Route path="/settings/language" element={<LanguageSettingsPage />} />
            <Route path="/settings/theme" element={<ThemeSettingsPage />} />
            <Route path="/settings/currency" element={<CurrencySettingsPage />} />
            <Route path="/settings/export-csv" element={<ExportCSVPage />} />
            <Route path="/settings/notifications" element={<NotificationSettingsPage />} />

            {/* Legal pages now redirect to landing site with proper i18n */}
            {/* <Route path="/legal/terms" element={<TermsOfServicePage />} /> */}
            {/* <Route path="/legal/privacy" element={<PrivacyPolicyPage />} /> */}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {!isFormRoute && <BottomBar />}
      </div>
    </>
  );
}

function ErrorFallback() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
          Algo salió mal
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Ocurrió un error inesperado. Por favor, reinicia la aplicación.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 active:scale-[0.98] dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          Reiniciar
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <ThemeProvider>
        <CurrencyProvider>
          <RevenueCatProvider>
            <AdMobProvider>
              <BrowserRouter>
                <CloudSyncGate />
                <OnboardingGate />
                <BiometricGate />
                <SessionExpiredGate />
                <UpcomingTransactionsModal />
                <AppFrame />
              </BrowserRouter>
            </AdMobProvider>
          </RevenueCatProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
}
