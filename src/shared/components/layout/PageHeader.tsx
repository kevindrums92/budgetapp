import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

type Props = {
  title: React.ReactNode;
  onBack?: () => void;
  rightActions?: React.ReactNode;
};

export default function PageHeader({ title, onBack, rightActions }: Props) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-white dark:bg-gray-900 px-4 py-4 shadow-sm dark:shadow-black/30">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="text-gray-900 dark:text-gray-50"
          aria-label="Volver"
        >
          <ChevronLeft size={24} />
        </button>
        {typeof title === "string" ? (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h1>
        ) : (
          title
        )}
      </div>

      {rightActions && <div className="flex items-center gap-2">{rightActions}</div>}
    </header>
  );
}
