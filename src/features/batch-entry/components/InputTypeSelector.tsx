/**
 * Input Type Selector
 * Allows user to choose between text, image, or voice input
 */

import { useTranslation } from "react-i18next";
import { Mic, Camera, Type } from "lucide-react";
import type { BatchInputType } from "../types/batch-entry.types";

type Props = {
  onSelect: (type: BatchInputType) => void;
};

type InputOption = {
  type: BatchInputType;
  icon: typeof Mic;
  translationKey: "voice" | "image" | "text";
  bgColor: string;
  iconBg: string;
  iconColor: string;
};

const INPUT_OPTIONS: InputOption[] = [
  {
    type: "audio",
    icon: Mic,
    translationKey: "voice",
    bgColor: "bg-violet-50 dark:bg-violet-900/30",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    type: "image",
    icon: Camera,
    translationKey: "image",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    type: "text",
    icon: Type,
    translationKey: "text",
    bgColor: "bg-amber-50 dark:bg-amber-900/30",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
];

export default function InputTypeSelector({ onSelect }: Props) {
  const { t } = useTranslation("batch");

  return (
    <div className="space-y-2">
      {INPUT_OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.type}
            type="button"
            onClick={() => onSelect(option.type)}
            className={`flex w-full items-center gap-4 rounded-2xl ${option.bgColor} px-4 py-4 transition-all active:scale-[0.98]`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${option.iconBg}`}
            >
              <Icon className={`h-6 w-6 ${option.iconColor}`} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-gray-50">
                {t(`inputTypes.${option.translationKey}.label`)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t(`inputTypes.${option.translationKey}.hint`)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
