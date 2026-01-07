import { useState } from "react";
import HeaderBalance from "@/components/HeaderBalance";
import TransactionList from "@/components/TransactionList";
import FabAdd from "@/components/FabAdd";
import AddTransactionModal from "@/components/AddTransactionModal";
import AuthBar from "@/components/AuthBar";
import CloudSyncGate from "@/components/CloudSyncGate";


export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <HeaderBalance />
      <AuthBar />
      <CloudSyncGate />
      <TransactionList />

      <FabAdd onClick={() => setOpen(true)} />
      <AddTransactionModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
