import { NavLink } from "react-router-dom";
import { Home, Wallet, BarChart3, Plane } from "lucide-react";

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
          isActive ? "text-[#18B7B0]" : "text-gray-500"
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

export default function BottomBar() {
  return (
    <div className="fixed inset-x-0 -bottom-1 z-50 bg-white pt-1">
      {/* iOS-ish: blur + borde sutil + sombra hacia arriba */}
      <div
        className={[
          "relative",
          "border-t border-gray-200/70",
          "bg-white/99 backdrop-blur-xl",
          "shadow-[0_-10px_30px_rgba(0,0,0,0.10)]",
          "pt-3 pb-[calc(env(safe-area-inset-bottom)+10px)]",
        ].join(" ")}
      >
        <div className="grid grid-cols-4">
          <Tab to="/" label="Home" icon={Home} />
          <Tab to="/budget" label="Budget" icon={Wallet} />
          <Tab to="/stats" label="Stats" icon={BarChart3} />
          <Tab to="/trips" label="Trips" icon={Plane} />
        </div>
      </div>
    </div>
  );
}
