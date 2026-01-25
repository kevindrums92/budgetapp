/**
 * Export service for CSV/Excel exports
 * Handles exporting transactions, budget, and trips to CSV format
 */

import type { Transaction, Category, Trip } from "@/types/budget.types";

/**
 * Export transactions to CSV format
 * CSV includes UTF-8 BOM for Excel compatibility
 *
 * @param transactions - Array of transactions to export
 * @param categories - Array of categories for name lookup
 * @param filename - Output filename (without extension)
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  filename: string = "transacciones"
): void {
  // Create category lookup map
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // CSV headers
  const headers = [
    "Fecha",
    "Tipo",
    "Categoría",
    "Descripción",
    "Monto",
    "Estado",
    "Recurrente",
    "Notas",
  ];

  // Convert transactions to CSV rows
  const rows = transactions.map((tx) => [
    tx.date,
    tx.type === "expense" ? "Gasto" : "Ingreso",
    categoryMap.get(tx.category) || tx.category,
    tx.name,
    tx.amount.toString(),
    tx.status === "pending" ? "Pendiente" : "Pagado",
    tx.isRecurring ? "Sí" : "No",
    tx.notes || "",
  ]);

  // Generate CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")),
  ].join("\n");

  // Add UTF-8 BOM for Excel compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });

  // Trigger download
  downloadBlob(blob, `${filename}.csv`);
}


/**
 * Export trips to CSV
 *
 * @param trips - Array of trips to export (with spent property added)
 * @param filename - Output filename (without extension)
 */
export function exportTripsToCSV(
  trips: Array<Trip & { spent: number }>,
  filename: string = "viajes"
): void {
  // CSV headers
  const headers = ["Nombre", "Destino", "Presupuesto", "Gastado", "Disponible", "Fecha Inicio", "Fecha Fin", "Estado"];

  // Convert trips to CSV rows
  const rows = trips.map((trip) => {
    const spent = trip.spent || 0;
    const available = trip.budget - spent;
    const statusLabels = {
      planning: "Planificando",
      active: "En curso",
      completed: "Completado",
    };

    return [
      trip.name,
      trip.destination,
      trip.budget.toString(),
      spent.toString(),
      available.toString(),
      trip.startDate,
      trip.endDate || "",
      statusLabels[trip.status],
    ];
  });

  // Add summary row
  const totalBudget = rows.reduce((sum, row) => sum + Number(row[1]), 0);
  const totalSpent = rows.reduce((sum, row) => sum + Number(row[2]), 0);
  const totalAvailable = totalBudget - totalSpent;

  rows.push([
    "TOTAL",
    totalBudget.toString(),
    totalSpent.toString(),
    totalAvailable.toString(),
    "",
    "",
  ]);

  // Generate CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")),
  ].join("\n");

  // Add UTF-8 BOM for Excel compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });

  // Trigger download
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Escape CSV cell content (handle commas, quotes, newlines)
 */
function escapeCsvCell(cell: string): string {
  // Convert to string if not already
  const str = String(cell);

  // If cell contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Trigger browser download of a blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  // Cleanup
  URL.revokeObjectURL(url);
}
