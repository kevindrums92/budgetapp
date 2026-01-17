import { useState } from "react";
import { Plus } from "lucide-react";
import HeaderBalance from "@/components/HeaderBalance";
import TransactionList from "@/components/TransactionList";
import AddActionSheet from "@/components/AddActionSheet";

export default function HomePage() {
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderBalance />
      <main className="pb-28 pt-4">
        <TransactionList />
      </main>

      {/* FAB para agregar transacción */}
      <button
        type="button"
        onClick={() => setAddSheetOpen(true)}
        className={[
          "fixed right-4 z-40",
          "grid h-14 w-14 place-items-center rounded-full",
          "bg-black text-white",
          "shadow-[0_8px_24px_rgba(0,0,0,0.25)]",
          "active:scale-95 transition-transform",
        ].join(" ")}
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
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
