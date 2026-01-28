import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { icons, Repeat } from "lucide-react";
import { useCurrency } from "@/features/currency";
import type { Transaction, Category } from "@/types/budget.types";
import { kebabToPascal } from "@/shared/utils/string.utils";
import { isVirtualTransaction, type VirtualTransaction } from "@/shared/services/scheduler.service";
import VirtualTransactionModal from "./VirtualTransactionModal";

// Extended type that can be either real or virtual
type DisplayTransaction = Transaction | VirtualTransaction;

interface TransactionItemProps {
  transaction: DisplayTransaction;
  category?: Category;
}

export default function TransactionItem({
  transaction,
  category,
}: TransactionItemProps) {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const [showModal, setShowModal] = useState(false);

  const IconComponent = category
    ? icons[kebabToPascal(category.icon) as keyof typeof icons]
    : null;

  // Check if this is a virtual (future) transaction
  const isVirtual = isVirtualTransaction(transaction);

  // Virtual transactions show modal, real transactions navigate to edit
  const handleClick = () => {
    if (isVirtual) {
      setShowModal(true);
      return;
    }
    navigate(`/edit/${transaction.id}`);
  };

  return (
    <>
      {/* Modal for virtual transactions */}
      {showModal && isVirtual && (
        <VirtualTransactionModal
          transaction={transaction}
          categoryName={category?.name}
          onClose={() => setShowModal(false)}
        />
      )}
    <button
      type="button"
      onClick={handleClick}
      className={`w-full flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-3 active:bg-gray-50 dark:active:bg-gray-800 transition-colors ${
        isVirtual ? "opacity-50" : ""
      }`}
    >
      {/* Category Icon - tamaño reducido */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: category ? category.color + "20" : "#f3f4f6",
        }}
      >
        {IconComponent ? (
          <IconComponent
            className="h-5 w-5"
            style={{ color: category?.color }}
          />
        ) : (
          <div className="h-5 w-5 rounded-full bg-gray-300" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-semibold text-gray-900 dark:text-gray-50 text-sm">
            {transaction.name.trim() || category?.name || transaction.category}
          </p>
          {/* Show repeat icon only for active scheduled transactions */}
          {transaction.schedule?.enabled && (
            <Repeat className="h-3 w-3 shrink-0 text-gray-400 dark:text-gray-500" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {category?.name || transaction.category}
          </p>
          {/* Virtual transaction badge */}
          {isVirtual && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              Programada
            </span>
          )}
          {/* Status badges for real transactions */}
          {!isVirtual && transaction.status && transaction.status !== "paid" && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                transaction.status === "pending"
                  ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                  : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              }`}
            >
              {transaction.status === "pending" ? "Pendiente" : "Planeado"}
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p
          className={`whitespace-nowrap font-semibold text-sm ${
            transaction.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {transaction.type === "income" ? "+" : "-"}{formatAmount(transaction.amount)}
        </p>
      </div>
    </button>
    </>
  );
}
