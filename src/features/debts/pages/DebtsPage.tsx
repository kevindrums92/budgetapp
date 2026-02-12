import DebtListTab from "../components/DebtListTab";

export default function DebtsPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <main className="mx-auto max-w-xl px-4 pt-6 pb-28">
        <DebtListTab />
      </main>
    </div>
  );
}
