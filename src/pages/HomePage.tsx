import HeaderBalance from "@/components/HeaderBalance";
import TransactionList from "@/components/TransactionList";

export default function HomePage() {
  return (
    <div>
      <HeaderBalance />
      <main className="mx-auto max-w-xl px-4 pb-28">
        <TransactionList />
      </main>
    </div>
  );
}
