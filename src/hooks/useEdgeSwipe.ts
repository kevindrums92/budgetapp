import { useEffect, useRef, useCallback, useState } from "react";

type UseEdgeSwipeOptions = {
  onOpen: () => void;
  edgeWidth?: number; // Ancho del área sensible desde el borde izquierdo
  threshold?: number; // Distancia mínima para activar
  disabled?: boolean;
};

export function useEdgeSwipe({
  onOpen,
  edgeWidth = 20,
  threshold = 50,
  disabled = false,
}: UseEdgeSwipeOptions) {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isEdgeSwipeRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled) return;

      const touch = e.touches[0];
      // Solo activar si el touch empieza en el borde izquierdo
      if (touch.clientX <= edgeWidth) {
        isEdgeSwipeRef.current = true;
        startXRef.current = touch.clientX;
        startYRef.current = touch.clientY;
        setIsSwiping(true);
      }
    },
    [edgeWidth, disabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isEdgeSwipeRef.current || disabled) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = Math.abs(touch.clientY - startYRef.current);

      // Si el movimiento vertical es mayor que el horizontal, cancelar
      if (deltaY > deltaX) {
        isEdgeSwipeRef.current = false;
        setIsSwiping(false);
        setSwipeProgress(0);
        return;
      }

      // Prevenir scroll mientras se hace swipe
      if (deltaX > 10) {
        e.preventDefault();
      }

      // Calcular progreso (0 a 1)
      const progress = Math.min(deltaX / threshold, 1);
      setSwipeProgress(Math.max(0, progress));
    },
    [threshold, disabled]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isEdgeSwipeRef.current) return;

    if (swipeProgress >= 1) {
      onOpen();
    }

    isEdgeSwipeRef.current = false;
    setIsSwiping(false);
    setSwipeProgress(0);
  }, [swipeProgress, onOpen]);

  useEffect(() => {
    if (disabled) return;

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

  return { swipeProgress, isSwiping };
}
