import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

type Props = {
  title: string;
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
    <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="text-gray-900"
          aria-label="Volver"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {rightActions && <div className="flex items-center gap-2">{rightActions}</div>}
    </header>
  );
}
