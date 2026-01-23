import { useMemo } from "react";
import { useBudgetStore } from "@/state/budget.store";
import MonthSelector from "@/shared/components/navigation/MonthSelector";
import { User } from "lucide-react";

type Props = {
  showMonthSelector?: boolean;
};

export default function TopHeader({ showMonthSelector = true }: Props) {

  // ✅ Read from Zustand store (single source of truth)
  const avatarUrl = useBudgetStore((s) => s.user.avatarUrl);
  const cloudMode = useBudgetStore((s) => s.cloudMode);
  const cloudStatus = useBudgetStore((s) => s.cloudStatus);

  const Avatar = useMemo(() => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="h-10 w-10 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-500">
        <User size={20} strokeWidth={1.8} />
      </div>
    );
  }, [avatarUrl]);

  // Sync indicator (cloud status dot)
  const syncDot = useMemo(() => {
    if (cloudMode === "guest") {
      return "bg-gray-400";
    }
    if (!navigator.onLine || cloudStatus === "offline") {
      return "bg-gray-400";
    }
    if (cloudStatus === "syncing") {
      return "bg-[#18B7B0]";
    }
    return "bg-green-500"; // ok
  }, [cloudMode, cloudStatus]);

  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
      <div className="mx-auto max-w-xl px-4 pt-6 pb-2">
        <div className="flex items-start justify-between">
          {/* Left: Logo + App Name + Month Selector */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl bg-[#18B7B0] shadow-lg shadow-[#18B7B0]/20">
              <svg width="26" height="26" viewBox="0 0 60 60" fill="none">
                <rect x="10" y="35" width="8" height="15" rx="1" fill="white" fillOpacity="0.5"/>
                <rect x="26" y="25" width="8" height="25" rx="1" fill="white" fillOpacity="0.5"/>
                <rect x="42" y="20" width="8" height="30" rx="1" fill="white" fillOpacity="0.5"/>
                <path d="M8 40 L22 28 L36 32 L52 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Name + Month Selector */}
            <div>
              <h1 className="text-lg font-bold leading-tight text-gray-900">SmartSpend</h1>
              {showMonthSelector && (
                <div className="mt-1">
                  <MonthSelector />
                </div>
              )}
            </div>
          </div>

          {/* Right: User Avatar + Sync Indicator */}
          <div className="relative flex items-center justify-center">
            {Avatar}
            {/* Sync indicator dot */}
            <span className={`absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white ${syncDot}`} />
          </div>
        </div>
      </div>
    </header>
  );
}
