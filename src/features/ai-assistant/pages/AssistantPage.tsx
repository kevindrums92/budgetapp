import { useState, useRef, useEffect } from "react";
import { Sparkles, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useKeyboardDismiss } from "@/hooks/useKeyboardDismiss";
import { usePaywallPurchase } from "@/hooks/usePaywallPurchase";
import PageHeader from "@/shared/components/layout/PageHeader";
import PaywallModal from "@/shared/components/modals/PaywallModal";
import { useAssistant } from "../hooks/useAssistant";
import ChatBubble from "../components/ChatBubble";
import ChatInput from "../components/ChatInput";
import TypingIndicator from "../components/TypingIndicator";
import WelcomePrompts from "../components/WelcomePrompts";
import RateLimitBanner from "../components/RateLimitBanner";

export default function AssistantPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("assistant");
  const {
    messages,
    isLoading,
    remainingMessages,
    error,
    sendMessage,
  } = useAssistant();

  const [inputValue, setInputValue] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useKeyboardDismiss();

  const { handleSelectPlan } = usePaywallPurchase({
    onSuccess: () => {
      setShowPaywall(false);
    },
  });

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const question = inputValue.trim();
    setInputValue("");
    await sendMessage(question);
  };

  const handlePromptClick = async (question: string) => {
    await sendMessage(question);
  };

  const isRateLimited = error === "errors.rateLimitFree";

  return (
    <div className="flex h-dvh flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <PageHeader
        title={
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t("page.title")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("page.subtitle")}
            </p>
          </div>
        }
      />

      <RateLimitBanner remaining={remainingMessages} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <WelcomePrompts onPromptClick={handlePromptClick} />
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            onRetry={
              msg.isError ? () => sendMessage(msg.content) : undefined
            }
          />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - sticky bottom */}
      <div className="sticky bottom-0 shrink-0 bg-white px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:bg-gray-900">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={isLoading || isRateLimited}
        />
      </div>

      {/* Rate limit upsell modal for free users */}
      {isRateLimited && !showPaywall && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => navigate(-1)} />

          <div className="relative mx-6 w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-gray-800 to-gray-900 p-6 shadow-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-all active:scale-95"
            >
              <X size={16} className="text-gray-400" />
            </button>

            {/* Icon */}
            <div className="mb-5 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#18B7B0] to-violet-500 shadow-lg shadow-[#18B7B0]/20">
                <Sparkles size={32} className="text-white" strokeWidth={1.8} />
              </div>
            </div>

            {/* Title */}
            <h3 className="mb-2 text-center text-xl font-extrabold tracking-tight text-white">
              {t("upsell.title")}
            </h3>

            {/* Subtitle */}
            <p className="mb-6 text-center text-sm leading-relaxed text-gray-400">
              {t("upsell.subtitle")}
            </p>

            {/* Benefits */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#18B7B0]/20">
                  <Check size={14} className="text-[#18B7B0]" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-gray-200">
                  {t("upsell.benefit1")}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#18B7B0]/20">
                  <Check size={14} className="text-[#18B7B0]" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-gray-200">
                  {t("upsell.benefit2")}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#18B7B0]/20">
                  <Check size={14} className="text-[#18B7B0]" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-gray-200">
                  {t("upsell.benefit3")}
                </span>
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={() => setShowPaywall(true)}
              className="w-full rounded-2xl bg-white py-4 text-base font-bold text-gray-900 shadow-lg transition-all active:scale-[0.98]"
            >
              {t("upsell.cta")}
            </button>
          </div>
        </div>
      )}

      {/* Paywall modal */}
      <PaywallModal
        open={showPaywall}
        onClose={() => {
          setShowPaywall(false);
          navigate(-1);
        }}
        trigger="ai_assistant_limit"
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}
