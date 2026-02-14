import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronUp, ChevronDown, LayoutGrid, PieChart, BarChart3, TrendingUp, LineChart } from "lucide-react";

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  quickStats: LayoutGrid,
  donutChart: PieChart,
  barChart: BarChart3,
  trendChart: TrendingUp,
  futureBalance: LineChart,
};

type Props = {
  sectionId: string;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (index: number, direction: "up" | "down") => void;
};

export default function SortableSectionCard({ sectionId, index, isFirst, isLast, onMove }: Props) {
  const { t } = useTranslation("stats");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const SectionIcon = SECTION_ICONS[sectionId] ?? null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm transition-shadow ${
        isDragging ? "z-50 shadow-lg opacity-90 scale-[1.02]" : ""
      }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="touch-none rounded-lg p-1 transition-colors active:bg-gray-100 dark:active:bg-gray-800"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
      </button>

      {SectionIcon && (
        <SectionIcon className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
      )}
      <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-50">
        {t(`layout.sections.${sectionId}`)}
      </span>

      {/* Arrow buttons (accessibility fallback) */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onMove(index, "up")}
          disabled={isFirst}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 disabled:opacity-30"
        >
          <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, "down")}
          disabled={isLast}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 disabled:opacity-30"
        >
          <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </div>
  );
}
