import { useNavigate } from "react-router-dom";

export default function FabAdd() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/add")}
      className="fixed right-6 z-40 h-14 w-14 rounded-full bg-black text-2xl text-white shadow-lg active:scale-95"
      style={{ bottom: "calc(var(--sab) + 96px)" }}
      aria-label="Agregar movimiento"
    >
      +
    </button>
  );
}