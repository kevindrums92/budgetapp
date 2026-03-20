import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Zap,
  Smartphone,
  CreditCard,
  ArrowRight,
  Check,
  Lightbulb,
  Mic,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PageHeader from "@/shared/components/layout/PageHeader";

export default function ShortcutsSetupPage() {
  const { t } = useTranslation("shortcuts");
  const [expandedSection, setExpandedSection] = useState<"auto" | "manual" | null>("auto");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function toggleSection(section: "auto" | "manual") {
    setExpandedSection((prev) => (prev === section ? null : section));
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader title={t("title")} />

      <div className="flex-1 px-4 pt-6 pb-8 space-y-6">
        {/* Header description */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {t("subtitle")}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t("description")}
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-4">
            {t("howItWorks.title")}
          </h3>
          <div className="space-y-3">
            {[
              { icon: <CreditCard className="h-4 w-4" />, text: t("howItWorks.step1"), color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
              { icon: <Zap className="h-4 w-4" />, text: t("howItWorks.step2"), color: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" },
              { icon: <ArrowRight className="h-4 w-4" />, text: t("howItWorks.step3"), color: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" },
              { icon: <Check className="h-4 w-4" />, text: t("howItWorks.step4"), color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.color}`}>
                  {step.icon}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{i + 1}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{step.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Setup Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
            {t("setup.title")}
          </h3>

          {/* Automatic Setup (iOS 17.2+) */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("auto")}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {t("setup.auto.title")}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t("setup.auto.description")}
                </p>
              </div>
              {expandedSection === "auto" ? (
                <ChevronUp className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
              )}
            </button>

            {expandedSection === "auto" && (
              <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                <ol className="space-y-2.5">
                  {(["1", "2", "3", "4", "5", "6", "7"] as const).map((step) => (
                    <li key={step} className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                        {step}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t(`setup.auto.steps.${step}`)}
                      </span>
                    </li>
                  ))}
                </ol>

                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                  {t("setup.auto.note")}
                </p>
              </div>
            )}
          </div>

          {/* Manual Setup */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("manual")}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                <Mic className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {t("setup.manual.title")}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t("setup.manual.description")}
                </p>
              </div>
              {expandedSection === "manual" ? (
                <ChevronUp className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
              )}
            </button>

            {expandedSection === "manual" && (
              <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                <ol className="space-y-2.5">
                  {(["1", "2", "3", "4", "5", "6", "7"] as const).map((step) => (
                    <li key={step} className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                        {step}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t(`setup.manual.steps.${step}`)}
                      </span>
                    </li>
                  ))}
                </ol>

              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">
            {t("tips.title")}
          </h3>
          <div className="space-y-3">
            {[
              { icon: <Lightbulb className="h-4 w-4" />, text: t("tips.smartCategory"), color: "text-emerald-500" },
              { icon: <Mic className="h-4 w-4" />, text: t("tips.siri"), color: "text-blue-500" },
              { icon: <LayoutGrid className="h-4 w-4" />, text: t("tips.widget"), color: "text-purple-500" },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`shrink-0 mt-0.5 ${tip.color}`}>{tip.icon}</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {tip.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
