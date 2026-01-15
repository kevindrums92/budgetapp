import { useState } from "react";
import { Plus } from "lucide-react";
import HeaderBalance from "@/components/HeaderBalance";
import TransactionList from "@/components/TransactionList";
import AddActionSheet from "@/components/AddActionSheet";

export default function HomePage() {
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  return (
    <div>
      <HeaderBalance />
      <main className="mx-auto max-w-xl px-4 pb-28">
        <TransactionList />
      </main>

      {/* FAB para agregar transacción */}
      <button
        type="button"
        onClick={() => setAddSheetOpen(true)}
        className={[
          "fixed bottom-24 right-4 z-40",
          "grid h-14 w-14 place-items-center rounded-full",
          "bg-black text-white",
          "shadow-[0_8px_24px_rgba(0,0,0,0.25)]",
          "active:scale-95 transition-transform",
        ].join(" ")}
        aria-label="Agregar movimiento"
      >
        <Plus size={26} strokeWidth={2.2} />
      </button>

      <AddActionSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
      />
    </div>
  );
}
