import { NavLink } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

function Item({
  to,
  label,
  onClick,
}: {
  to: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex w-full items-center justify-between px-4 py-3 text-sm font-medium ${
          isActive ? "bg-gray-100 text-gray-900" : "bg-white text-gray-800"
        }`
      }
    >
      <span>{label}</span>
      <span className="text-gray-400">›</span>
    </NavLink>
  );
}

export default function SideMenu({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Cerrar menú"
      />

      {/* Drawer */}
      <div className="absolute left-0 top-0 h-full w-[84%] max-w-xs border-r bg-white shadow-2xl">
        <div className="border-b px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Menú
          </div>
          <div className="mt-1 text-base font-semibold text-gray-900">
            Presupuesto
          </div>
        </div>

        <nav className="py-2">
          <Item to="/" label="Home" onClick={onClose} />
          <Item to="/budget" label="Budget" onClick={onClose} />
          <Item to="/stats" label="Stats" onClick={onClose} />
          <Item to="/settings" label="Settings" onClick={onClose} />
        </nav>

        {/* espacio inferior estilo “safe area” */}
        <div className="absolute bottom-0 left-0 right-0 border-t px-4 py-3 text-[11px] text-gray-500">
          Tip: el logout lo dejamos en <span className="font-medium">Settings</span>.
        </div>
      </div>
    </div>
  );
}
