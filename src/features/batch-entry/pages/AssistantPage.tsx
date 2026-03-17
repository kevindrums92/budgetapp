/**
 * AssistantPage
 * Full-screen AI assistant for batch transaction entry.
 * Replaces the old BatchEntrySheet modal with an immersive chat-like experience.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Sparkles, WifiOff, X, Loader2, Lightbulb, Mic, Camera, Type, Image as ImageIcon } from "lucide-react";
import { isNative } from "@/shared/utils/platform";
import { isRewardedVideoReady } from "@/services/ads.service";
import PaywallModal from "@/shared/components/modals/PaywallModal";
import SpotlightTour from "@/features/tour/components/SpotlightTour";
import { batchReviewTour } from "@/features/tour/tours/batchReviewTour";
import { useSpotlightTour } from "@/features/tour/hooks/useSpotlightTour";
import { useBatchEntry } from "../hooks/useBatchEntry";
import { useFakeProgress } from "../hooks/useFakeProgress";
import ChatInputBar from "../components/ChatInputBar";
import TransactionPreview from "../components/TransactionPreview";
import { captureFromCamera, selectFromGallery } from "../services/imageCapture.service";
import type { BatchInputType } from "../types/batch-entry.types";

export default function AssistantPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("batch");
  const initialMode = searchParams.get("mode") as BatchInputType | null;
  const autoSubmit = searchParams.get("autoSubmit") === "true";
  const batchText = (location.state as { batchText?: string } | null)?.batchText;
  const hasTriggeredInitialMode = useRef(false);
  const hasTriggeredAutoSubmit = useRef(false);
  const {
    flowState,
    drafts,
    error,
    isOnline,
    showPaywall,
    setShowPaywall,
    showRewardedModal,
    setShowRewardedModal,
    isLoadingReward,
    rewardedWasConsumed,
    handleTextSubmit,
    handleImageCapture,
    handleAudioCapture,
    handleUpdateDraft,
    handleDeleteDraft,
    handleMergeDrafts,
    handleSaveAll,
    handleWatchRewardedVideo,
    handleRetry,
    handleSelectPlan,
  } = useBatchEntry();

  // Batch review tour
  const { isActive: isTourActive, startTour, completeTour } = useSpotlightTour("batchReview");

  // Fake progress for processing state
  const progress = useFakeProgress({ isProcessing: flowState === "processing" });

  // Start tour when entering preview
  useEffect(() => {
    if (flowState === "preview" && drafts.length > 0) {
      startTour();
    }
  }, [flowState, drafts.length, startTour]);

  // Navigate to home immediately on success
  useEffect(() => {
    if (flowState === "success") {
      navigate("/", { replace: true });
    }
  }, [flowState, navigate]);

  // Inline image source picker state
  const [showImageOptions, setShowImageOptions] = useState(false);

  // Handle image capture from a specific source (camera or gallery)
  const handleCaptureFromSource = useCallback(async (source: "camera" | "gallery") => {
    try {
      setShowImageOptions(false);
      const imageBase64 = source === "camera"
        ? await captureFromCamera()
        : await selectFromGallery();
      await handleImageCapture(imageBase64);
    } catch (err: unknown) {
      const error = err as { message?: string };
      if (error.message?.includes("cancelled") || error.message?.includes("canceled")) {
        return;
      }
      console.error("[AssistantPage] Image capture error:", err);
    }
  }, [handleImageCapture]);

  // Auto-submit batch text from deep link (iOS Shortcut → smartspend://batch?text=...)
  useEffect(() => {
    if (!autoSubmit || !batchText || hasTriggeredAutoSubmit.current) return;
    if (flowState !== "idle") return;

    hasTriggeredAutoSubmit.current = true;
    console.log('[AssistantPage] Auto-submitting batch text from shortcut:', batchText);
    handleTextSubmit(batchText);
  }, [autoSubmit, batchText, flowState, handleTextSubmit]);

  // Handle initial mode from URL params
  useEffect(() => {
    if (!initialMode || hasTriggeredInitialMode.current) return;

    if (initialMode === "image") {
      hasTriggeredInitialMode.current = true;
      setShowImageOptions(true);
    }
    // audio and text modes are handled by ChatInputBar's autoStart props
  }, [initialMode]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSaveAllAndGoBack = async () => {
    await handleSaveAll();
  };

  const handleClosePreview = () => {
    navigate(-1);
  };

  // Determine if input bar should be hidden
  const hideInputBar = flowState === "processing" || flowState === "preview" || flowState === "saving" || flowState === "success";

  // --- Render ---
  return (
    <div className="flex h-screen h-dvh flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex shrink-0 items-center justify-between bg-gray-50 dark:bg-gray-950 px-4 pb-3"
        style={{ paddingTop: "var(--sat)" }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-gray-900 dark:text-gray-50 active:bg-gray-200 dark:active:bg-gray-800 transition-colors"
            aria-label="Volver"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#18B7B0]" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t("assistant.title", { defaultValue: "Asistente IA" })}
            </h1>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        {/* Offline state */}
        {!isOnline && (
          <div className="my-auto flex flex-col items-center px-6 py-8">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
              <WifiOff className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-gray-50">
              {t("errors.noConnection", { defaultValue: "Sin conexión" })}
            </p>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("errors.needsConnection", { defaultValue: "Necesitas conexión a internet para usar el ingreso con IA" })}
            </p>
          </div>
        )}

        {/* Welcome / Idle state */}
        {isOnline && flowState === "idle" && (
          <div className="my-auto flex flex-col items-center px-6 py-8">
            {/* Hero Icon */}
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#18B7B0]/15">
              <Sparkles size={36} className="text-[#18B7B0]" strokeWidth={1.8} />
            </div>

            {/* Title */}
            <h2 className="mb-3 text-center text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
              {t("assistant.greeting")}
            </h2>

            {/* Subtitle */}
            <p className="mb-8 max-w-[300px] text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {t("assistant.greetingSubtitle")}
            </p>

            {/* Example suggestions */}
            <div className="mb-6 flex w-full max-w-sm flex-col gap-2">
              <button
                type="button"
                onClick={() => handleTextSubmit(t("assistant.example1Value", { defaultValue: "Gasté 50 mil en almuerzo y 30 en taxi" }))}
                className="flex items-center gap-3 rounded-2xl bg-white dark:bg-gray-900 px-4 py-3 text-left shadow-sm dark:shadow-none transition-all active:scale-[0.98]"
              >
                <Type size={16} className="shrink-0 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t("assistant.example1")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowImageOptions((prev) => !prev)}
                className="flex items-center gap-3 rounded-2xl bg-white dark:bg-gray-900 px-4 py-3 text-left shadow-sm dark:shadow-none transition-all active:scale-[0.98]"
              >
                <Camera size={16} className="shrink-0 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t("assistant.example2")}
                </span>
              </button>
              {/* Inline camera/gallery sub-options */}
              {showImageOptions && (
                <div className="ml-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCaptureFromSource("camera")}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 px-4 py-2.5 transition-all active:scale-[0.97]"
                  >
                    <Camera size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {t("imageInput.takePhoto")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCaptureFromSource("gallery")}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 px-4 py-2.5 transition-all active:scale-[0.97]"
                  >
                    <ImageIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {t("imageInput.selectGallery")}
                    </span>
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  // Scroll down to focus input bar and trigger recording would need ref - just visual hint
                }}
                className="flex items-center gap-3 rounded-2xl bg-white dark:bg-gray-900 px-4 py-3 text-left shadow-sm dark:shadow-none transition-all active:scale-[0.98]"
              >
                <Mic size={16} className="shrink-0 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t("assistant.example3")}
                </span>
              </button>
            </div>

            {/* Tip chip */}
            <div className="flex items-center gap-2 rounded-full bg-[#18B7B0]/10 px-4 py-2">
              <Lightbulb size={14} className="shrink-0 text-[#18B7B0]" />
              <span className="text-xs text-[#18B7B0]">
                {t("assistant.tip")}
              </span>
            </div>
          </div>
        )}

        {/* Processing state */}
        {isOnline && flowState === "processing" && (
          <div className="my-auto flex flex-col items-center px-6 py-8">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#18B7B0]/15">
              <Loader2 size={36} className="animate-spin text-[#18B7B0]" />
            </div>
            <p className="mb-4 text-base font-medium text-gray-900 dark:text-gray-50">
              {t("common.processing", { defaultValue: "Procesando..." })}
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#18B7B0] to-violet-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-gray-500">
                {progress}%
              </p>
            </div>
          </div>
        )}

        {/* Preview state */}
        {isOnline && (flowState === "preview" || flowState === "saving") && (
          <div className="flex flex-1 flex-col overflow-hidden px-4 pb-[calc(var(--sab)+16px)]">
            <TransactionPreview
              drafts={drafts}
              onUpdateDraft={handleUpdateDraft}
              onDeleteDraft={handleDeleteDraft}
              onMergeDrafts={handleMergeDrafts}
              onSaveAll={handleSaveAllAndGoBack}
              onCancel={handleRetry}
              onClose={handleClosePreview}
              isSaving={flowState === "saving"}
              isFullScreen
            />
          </div>
        )}

        {/* Error state */}
        {isOnline && flowState === "error" && (
          <div className="my-auto flex flex-col items-center px-6 py-8">
            {/* Free user rate limit - modal handles it */}
            {error === "RATE_LIMIT_FREE" && !rewardedWasConsumed ? null : (
              <>
                <div className="mb-4 rounded-xl bg-red-100 dark:bg-red-900/20 p-4">
                  <p className="text-center text-sm text-red-600 dark:text-red-400">
                    {getErrorMessage(error, t)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-xl bg-gray-200 dark:bg-gray-800 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t("common.retry")}
                </button>
              </>
            )}
          </div>
        )}

        {/* Success state */}
        {isOnline && flowState === "success" && (
          <div className="my-auto flex flex-col items-center px-6 py-8">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <Sparkles className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-gray-50">
              {t("success.title", { defaultValue: "Transacciones guardadas" })}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("review.transactionsFound", { count: drafts.length })}
            </p>
          </div>
        )}
      </main>

      {/* Input bar - hidden during processing/preview/success */}
      {isOnline && !hideInputBar && (
        <ChatInputBar
          onSendText={handleTextSubmit}
          onSendAudio={handleAudioCapture}
          onCaptureImage={handleCaptureFromSource}
          disabled={!isOnline}
          autoFocusText={initialMode === "text"}
          autoStartRecording={initialMode === "audio"}
        />
      )}

      {/* Rewarded video modal */}
      {showRewardedModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setShowRewardedModal(false);
            }}
          />
          <div className="relative mx-6 w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 shadow-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowRewardedModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 transition-all active:scale-95"
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </button>

            {/* Icon */}
            <div className="mb-5 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#18B7B0] to-violet-500 shadow-lg shadow-[#18B7B0]/20">
                <Sparkles size={32} className="text-white" strokeWidth={1.8} />
              </div>
            </div>

            <h3 className="mb-2 text-center text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {t("rewards.watchAdTitle")}
            </h3>
            <p className="mb-6 text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {t("rewards.watchAdSubtitle")}
            </p>

            {isNative() && isRewardedVideoReady() && (
              <button
                type="button"
                onClick={handleWatchRewardedVideo}
                disabled={isLoadingReward}
                className="mb-3 w-full rounded-2xl bg-white py-4 text-base font-bold text-gray-900 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoadingReward ? t("rewards.loadingAd") : t("rewards.watchAdButton")}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowRewardedModal(false);
                setShowPaywall(true);
              }}
              className={`w-full rounded-2xl py-4 text-base font-bold transition-all active:scale-[0.98] ${
                isNative()
                  ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white"
                  : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg"
              }`}
            >
              {t("rewards.upgradeToPro")}
            </button>
          </div>
        </div>
      )}

      {/* Paywall modal */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="batch_entry_limit"
        onSelectPlan={handleSelectPlan}
      />

      {/* Batch review spotlight tour */}
      <SpotlightTour
        config={batchReviewTour}
        isActive={isTourActive}
        onComplete={completeTour}
      />
    </div>
  );
}

/** Translate error codes to user-friendly messages */
function getErrorMessage(error: string | null, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (!error) return t("errors.generic");
  if (error === "RATE_LIMIT_FREE") return t("errors.rateLimitFree", { defaultValue: "Has alcanzado el límite diario. Intenta de nuevo mañana o hazte Pro." });
  if (error === "RATE_LIMIT_PRO") return t("errors.rateLimitPro");
  if (error === "TIMEOUT") return t("errors.timeout");
  if (error === "NO_RESPONSE") return t("errors.noResponse");
  return t("errors.generic");
}
