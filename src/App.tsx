import { useState } from "react";
import HeaderBalance from "@/components/HeaderBalance";
import TransactionList from "@/components/TransactionList";
import FabAdd from "@/components/FabAdd";
import AddTransactionModal from "@/components/AddTransactionModal";

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <HeaderBalance />
      <TransactionList />

      <FabAdd onClick={() => setOpen(true)} />
      <AddTransactionModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
