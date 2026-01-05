type Props = {
  onClick: () => void;
};

export default function FabAdd({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg active:scale-95"
      aria-label="Agregar movimiento"
      title="Agregar"
    >
      <span className="text-3xl leading-none">+</span>
    </button>
  );
}
