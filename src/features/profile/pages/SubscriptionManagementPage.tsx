import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaywallPurchase } from "@/hooks/usePaywallPurchase";
import { PRICING_PLANS } from "@/constants/pricing";
import { supabase } from "@/lib/supabaseClient";
import {
  ChevronLeft,
  Crown,
  Calendar,
  DollarSign,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Infinity
} from "lucide-react";
import { isNative } from "@/shared/utils/platform";
import PaywallModal from "@/shared/components/modals/PaywallModal";

export default function SubscriptionManagementPage() {
  const navigate = useNavigate();
  const { isPro, isTrialing, subscription, trialEndsAt } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { handleSelectPlan } = usePaywallPurchase({
    onSuccess: () => setShowPaywall(false),
    onError: () => setRestoreMessage({ type: 'error', text: 'No se pudo procesar la compra. Intenta de nuevo.' }),
  });

  // Determine current plan details
  const currentPlan = subscription?.type || 'free';
  const isLifetime = currentPlan === 'lifetime';
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const expiresAt = subscription?.expiresAt;

  // Get plan pricing info
  const planInfo = currentPlan === 'monthly' ? PRICING_PLANS.monthly
    : currentPlan === 'annual' ? PRICING_PLANS.annual
    : currentPlan === 'lifetime' ? PRICING_PLANS.lifetime
    : null;

  // Format price with currency
  const formatPrice = (price: number, currency: string) => {
    return `$${price.toFixed(2)} ${currency}`;
  };

  // Calculate annual savings
  const annualSavings = PRICING_PLANS.monthly.price * 12 - PRICING_PLANS.annual.price;

  // Calculate trial days remaining
  const trialDaysRemaining = trialEndsAt ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  // Format renewal date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Handle restore purchases
  async function handleRestorePurchases() {
    if (!isNative()) {
      setRestoreMessage({ type: 'error', text: 'Restaurar compras solo está disponible en la app móvil.' });
      return;
    }

    setRestoring(true);
    setRestoreMessage(null);

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      console.log('[SubscriptionManagement] Restoring purchases...');

      const { customerInfo } = await Purchases.restorePurchases();
      console.log('[SubscriptionManagement] Restore result:', customerInfo);

      const entitlements = customerInfo.entitlements.active['pro'];
      if (entitlements && entitlements.isActive) {
        setRestoreMessage({ type: 'success', text: '¡Compras restauradas exitosamente!' });

        // Refresh subscription from service
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { refreshSubscription } = await import('@/services/subscription.service');
          await refreshSubscription(user.id);
        }
      } else {
        setRestoreMessage({ type: 'error', text: 'No se encontraron compras anteriores para restaurar.' });
      }
    } catch (error) {
      console.error('[SubscriptionManagement] Restore failed:', error);
      setRestoreMessage({ type: 'error', text: 'Error al restaurar compras. Intenta de nuevo.' });
    } finally {
      setRestoring(false);
    }
  }

  // Handle manage in App Store
  function handleManageInAppStore() {
    if (isNative()) {
      // Open App Store subscriptions management
      window.open("https://apps.apple.com/account/subscriptions", "_blank");
    } else {
      setRestoreMessage({ type: 'error', text: 'Administrar suscripción solo está disponible en la app móvil.' });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div
        className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Volver"
            >
              <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Mi Suscripción
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 px-4 pt-6"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}
      >
        {/* Current Plan Card */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium opacity-90 mb-1">Plan Actual</p>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                {currentPlan === 'free' && 'Free'}
                {currentPlan === 'monthly' && 'Pro Monthly'}
                {currentPlan === 'annual' && 'Pro Annual'}
                {currentPlan === 'lifetime' && 'Pro Lifetime'}
                {isPro && <Crown size={28} />}
              </h2>
            </div>
            {isTrialing && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wide">
                <Sparkles size={14} />
                Trial
              </span>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">
              {isActive ? 'Activa' : 'Inactiva'}
            </span>
          </div>

          {/* Trial info */}
          {isTrialing && trialDaysRemaining > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={18} />
              <span className="text-sm">
                {trialDaysRemaining} {trialDaysRemaining === 1 ? 'día' : 'días'} de prueba restantes
              </span>
            </div>
          )}

          {/* Renewal date */}
          {expiresAt && !isLifetime && (
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={18} />
              <span className="text-sm">
                {isTrialing ? 'Trial termina' : 'Renueva'}: {formatDate(expiresAt)}
              </span>
            </div>
          )}

          {/* Lifetime badge */}
          {currentPlan === 'lifetime' && (
            <div className="flex items-center gap-2 mb-2">
              <Infinity size={18} />
              <span className="text-sm font-medium">
                Acceso de por vida
              </span>
            </div>
          )}

          {/* Price */}
          {planInfo && (
            <div className="flex items-center gap-2">
              <DollarSign size={18} />
              <span className="text-sm">
                {formatPrice(planInfo.price, planInfo.currency)} {currentPlan === 'monthly' ? '/mes' : currentPlan === 'annual' ? '/año' : 'pago único'}
              </span>
            </div>
          )}
        </div>

        {/* Upgrade Options - Only show if not lifetime */}
        {!isLifetime && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-1">
              Mejora tu Plan
            </h3>
            <div className="space-y-3">
              {/* Annual Plan - Show if monthly or free */}
              {(currentPlan === 'free' || currentPlan === 'monthly') && (
                <button
                  type="button"
                  onClick={() => setShowPaywall(true)}
                  className="w-full rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-50">Plan Anual</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatPrice(PRICING_PLANS.annual.price, PRICING_PLANS.annual.currency)}/año</p>
                      {currentPlan === 'monthly' && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          Ahorra ${annualSavings.toFixed(2)} al año
                        </p>
                      )}
                    </div>
                    <ChevronLeft size={20} className="text-gray-400 rotate-180" />
                  </div>
                </button>
              )}

              {/* Lifetime Plan - Show if not lifetime */}
              {!isLifetime && (
                <button
                  type="button"
                  onClick={() => setShowPaywall(true)}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 shadow-sm border border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-50">Plan Lifetime</p>
                        <Crown size={16} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatPrice(PRICING_PLANS.lifetime.price, PRICING_PLANS.lifetime.currency)} pago único</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Acceso ilimitado de por vida
                      </p>
                    </div>
                    <ChevronLeft size={20} className="text-emerald-600 dark:text-emerald-400 rotate-180" />
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-1">
            Acciones
          </h3>
          <div className="space-y-3">
            {/* Restore Purchases */}
            <button
              type="button"
              onClick={handleRestorePurchases}
              disabled={restoring}
              className="w-full rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw size={20} className={`text-gray-600 dark:text-gray-400 ${restoring ? 'animate-spin' : ''}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      Restaurar Compras
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Si cambiaste de dispositivo
                    </p>
                  </div>
                </div>
              </div>
            </button>

            {/* Manage in App Store */}
            {isPro && (
              <button
                type="button"
                onClick={handleManageInAppStore}
                className="w-full rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ExternalLink size={20} className="text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">
                        Administrar en App Store
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Cancelar o modificar suscripción
                      </p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-gray-400 rotate-180" />
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Restore message */}
        {restoreMessage && (
          <div className={`rounded-xl p-4 ${
            restoreMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm ${
              restoreMessage.type === 'success'
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {restoreMessage.text}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 rounded-xl bg-gray-100 dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            <strong>Nota:</strong> Los cambios de suscripción y cancelaciones se gestionan a través de la App Store de Apple.
            Las cancelaciones entran en efecto al final del período de facturación actual.
          </p>
        </div>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="upgrade_prompt"
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}
