import { NavLink } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";

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

const DRAWER_WIDTH = 320; // max-w-xs = 320px
const DRAG_THRESHOLD = 0.4; // 40% del ancho para decidir si cierra

export default function SideMenu({ open, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  // Manejar apertura/cierre con animación
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      // Pequeño delay para que el DOM se actualice antes de animar
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Esperar a que termine la animación antes de ocultar
      const timer = setTimeout(() => {
        setIsVisible(false);
        setDragOffset(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handlers para drag
  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    currentXRef.current = clientX;
  }, []);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return;

    currentXRef.current = clientX;
    const diff = startXRef.current - clientX;

    // Solo permitir arrastrar hacia la izquierda (cerrar)
    if (diff > 0) {
      setDragOffset(Math.min(diff, DRAWER_WIDTH));
    } else {
      setDragOffset(0);
    }
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // Si se arrastró más del threshold, cerrar
    if (dragOffset > DRAWER_WIDTH * DRAG_THRESHOLD) {
      onClose();
    }

    setDragOffset(0);
  }, [isDragging, dragOffset, onClose]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse events (para desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  if (!isVisible) return null;

  // Calcular estilos basados en estado
  const drawerTranslate = isAnimating ? -dragOffset : -DRAWER_WIDTH;
  const backdropOpacity = isAnimating
    ? Math.max(0, 1 - dragOffset / DRAWER_WIDTH) * 0.3
    : 0;

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black"
        onClick={onClose}
        aria-label="Cerrar menú"
        style={{
          opacity: backdropOpacity,
          transition: isDragging ? "none" : "opacity 300ms ease-out",
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="absolute left-0 top-0 h-full w-[84%] max-w-xs border-r bg-white shadow-2xl select-none"
        style={{
          transform: `translateX(${drawerTranslate}px)`,
          transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle visual indicator */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-1 rounded-full bg-gray-300 opacity-50" />

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

        {/* espacio inferior estilo "safe area" */}
        <div className="absolute bottom-0 left-0 right-0 border-t px-4 py-3 text-[11px] text-gray-500">
          Tip: el logout lo dejamos en <span className="font-medium">Settings</span>.
        </div>
      </div>
    </div>
  );
}
