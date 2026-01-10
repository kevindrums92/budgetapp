import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import CloudStatusMini from "@/components/CloudStatusMini";

type Props = {
  open: boolean;
  onClose: () => void;
};

type UserInfo = {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

const DRAWER_WIDTH = 320;
const DRAG_THRESHOLD = 0.4;

export default function UserDrawer({ open, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [user, setUser] = useState<UserInfo>({ email: null, name: null, avatarUrl: null });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const drawerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  // Online/offline listeners
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Load user info
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      if (!navigator.onLine) {
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const u = data.session?.user ?? null;
      const meta: Record<string, unknown> = u?.user_metadata ?? {};

      setUser({
        email: u?.email ?? null,
        name: (meta.full_name as string) || (meta.name as string) || null,
        avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || null,
      });
      setLoading(false);
    }

    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      const meta: Record<string, unknown> = u?.user_metadata ?? {};

      setUser({
        email: u?.email ?? null,
        name: (meta.full_name as string) || (meta.name as string) || null,
        avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || null,
      });
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Manejar apertura/cierre con animación
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      // Usar setTimeout para asegurar que el browser haya renderizado el estado inicial
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
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

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      currentXRef.current = clientX;
      const diff = startXRef.current - clientX;
      if (diff > 0) {
        setDragOffset(Math.min(diff, DRAWER_WIDTH));
      } else {
        setDragOffset(0);
      }
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > DRAWER_WIDTH * DRAG_THRESHOLD) {
      onClose();
    }
    setDragOffset(0);
  }, [isDragging, dragOffset, onClose]);

  // Touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX),
    [handleDragStart]
  );
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX),
    [handleDragMove]
  );
  const handleTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);

  // Mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => handleDragStart(e.clientX),
    [handleDragStart]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const handleMouseUp = () => handleDragEnd();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Auth actions
  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setLoading(false);
  }

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    onClose();
  }

  if (!isVisible) return null;

  const drawerTranslate = isAnimating ? -dragOffset : -DRAWER_WIDTH;
  const backdropOpacity = isAnimating
    ? Math.max(0, 1 - dragOffset / DRAWER_WIDTH) * 0.3
    : 0;

  const isLoggedIn = !!user.email;

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black"
        onClick={onClose}
        aria-label="Cerrar panel"
        style={{
          opacity: backdropOpacity,
          transition: isDragging ? "none" : "opacity 300ms ease-out",
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="absolute left-0 top-0 bottom-0 w-[84%] max-w-xs border-r bg-white shadow-2xl select-none flex flex-col"
        style={{
          transform: `translateX(${drawerTranslate}px)`,
          transition: isDragging
            ? "none"
            : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-1 rounded-full bg-gray-300 opacity-50" />

        {/* User info header */}
        <div className="border-b px-4 py-5">
          {/* Avatar */}
          <div className="mb-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="h-14 w-14 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gray-200 text-lg font-semibold text-gray-600">
                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          {/* Name & Email */}
          {isLoggedIn ? (
            <>
              <div className="text-base font-semibold text-gray-900">
                {user.name || "Usuario"}
              </div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </>
          ) : (
            <>
              <div className="text-base font-semibold text-gray-900">Invitado</div>
              <div className="text-sm text-gray-500">No has iniciado sesión</div>
            </>
          )}

          {/* Cloud status */}
          <div className="mt-2">
            <CloudStatusMini />
          </div>

          {/* Actions */}
          <div className="mt-6">
            {!isOnline ? (
              <p className="text-sm text-gray-500">Sin conexión</p>
            ) : isLoggedIn ? (
              <button
                type="button"
                onClick={signOut}
                disabled={loading}
                className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Cerrando..." : "Cerrar sesión"}
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Cargando..." : "Entrar con Google"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
