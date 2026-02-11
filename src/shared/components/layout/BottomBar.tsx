import { NavLink, useNavigate } from "react-router-dom";
import { Home, Wallet, BarChart3, Settings, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

function Tab({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: typeof Home;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] ${
          isActive ? "text-[#18B7B0]" : "text-gray-500 dark:text-gray-400"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
          <span className="leading-none tracking-tight">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function HeroButton() {
  const navigate = useNavigate();
  const { t } = useTranslation("assistant");

  return (
    <div className="-mt-4 flex flex-1 flex-col items-center justify-center">
      <button
        type="button"
        onClick={() => navigate("/assistant")}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#18B7B0] shadow-lg transition-transform active:scale-95"
      >
        <Sparkles size={24} className="text-white" strokeWidth={2.2} />
      </button>
      <span className="mt-1 text-[11px] leading-none tracking-tight text-gray-500 dark:text-gray-400">
        {t("bottomBar.label")}
      </span>
    </div>
  );
}

export default function BottomBar() {
  const { t } = useTranslation();

  return (
    <div data-tour="home-bottom-bar" className="fixed inset-x-0 -bottom-1 z-50 bg-white dark:bg-gray-900 pt-1">
      {/* iOS-ish: blur + borde sutil + sombra hacia arriba */}
      <div
        className={[
          "relative",
          "border-t border-gray-200/70 dark:border-gray-800/70",
          "bg-white/99 dark:bg-gray-900/99 backdrop-blur-xl",
          "shadow-[0_-10px_30px_rgba(0,0,0,0.10)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.50)]",
          "pt-3 pb-[calc(env(safe-area-inset-bottom)+10px)]",
        ].join(" ")}
      >
        <div className="grid grid-cols-5">
          <Tab to="/" label={t("navigation.home")} icon={Home} />
          <Tab to="/plan" label={t("navigation.plan")} icon={Wallet} />
          <HeroButton />
          <Tab to="/stats" label={t("navigation.stats")} icon={BarChart3} />
          <Tab to="/profile" label={t("navigation.settings")} icon={Settings} />
        </div>
      </div>
    </div>
  );
}
