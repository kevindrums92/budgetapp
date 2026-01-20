import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBudgetStore } from "@/state/budget.store";
import CloudStatusMini from "@/shared/components/ui/CloudStatusMini";
import LogoMark from "@/shared/components/ui/LogoMark";
import MonthSelector from "@/shared/components/navigation/MonthSelector";
import { User } from "lucide-react";

type Props = {
  title: string;
  showMonthSelector?: boolean;
};

export default function TopHeader({ title, showMonthSelector = false }: Props) {
  const navigate = useNavigate();

  // ✅ Read from Zustand store (single source of truth)
  const avatarUrl = useBudgetStore((s) => s.user.avatarUrl);

  const Avatar = useMemo(() => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="h-9 w-9 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <div className="grid h-9 w-9 place-items-center rounded-full border bg-gray-100 text-gray-500">
        <User size={20} strokeWidth={1.8} />
      </div>
    );
  }, [avatarUrl]);

  return (
    <header className="sticky top-0 z-20 border-b bg-white/100 backdrop-blur">
      <div className="mx-auto max-w-xl px-4 py-3">
        <div className="relative flex items-center justify-between">
          {/* Left: avatar + status (clickeable) */}
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex flex-col items-start rounded-full hover:bg-gray-50 active:scale-95"
            aria-label="Abrir perfil"
          >
            <div className="h-10 w-10 flex items-center justify-center">
              {Avatar}
            </div>
            <CloudStatusMini />
          </button>

          {/* Center: title or month selector */}
          <div className="pointer-events-none absolute left-0 right-0 flex justify-center">
            {showMonthSelector ? (
              <div className="pointer-events-auto">
                <MonthSelector />
              </div>
            ) : (
              <div className="text-sm font-semibold text-gray-900">{title}</div>
            )}
          </div>

          {/* Right: logo */}
          <div className="flex h-10 w-10 items-center justify-center">
            <LogoMark size={28} />
          </div>
        </div>
      </div>
    </header>
  );
}
