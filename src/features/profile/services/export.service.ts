/**
 * export.service.ts
 * Servicio para exportar datos a CSV
 */

import type { Transaction, CategoryDefinition, Budget } from '@/types/budget.types';
import { formatCOP } from '@/services/dates.service';

/**
 * Convierte un array de objetos a formato CSV
 */
function arrayToCSV(data: Record<string, any>[], headers: string[]): string {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] ?? '';
      // Escapar valores que contengan comas o comillas
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Descarga un string como archivo CSV
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Exporta transacciones a CSV
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: CategoryDefinition[]
): void {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const data = transactions.map(t => ({
    Fecha: t.date,
    Nombre: t.name,
    Categoría: categoryMap.get(t.categoryId) || t.categoryId,
    Tipo: t.type === 'expense' ? 'Gasto' : 'Ingreso',
    Monto: t.amount,
    Recurrente: t.isRecurring ? 'Sí' : 'No',
    Notas: t.notes || '',
    ID: t.id,
  }));

  const headers = ['Fecha', 'Nombre', 'Categoría', 'Tipo', 'Monto', 'Recurrente', 'Notas', 'ID'];
  const csv = arrayToCSV(data, headers);

  const today = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `transacciones_${today}.csv`);
}

/**
 * Exporta categorías a CSV
 */
export function exportCategoriesToCSV(categories: CategoryDefinition[]): void {
  const data = categories.map(c => ({
    Nombre: c.name,
    Tipo: c.type === 'expense' ? 'Gasto' : 'Ingreso',
    Icono: c.icon,
    Color: c.color,
    Grupo: c.groupId || '',
    ID: c.id,
  }));

  const headers = ['Nombre', 'Tipo', 'Icono', 'Color', 'Grupo', 'ID'];
  const csv = arrayToCSV(data, headers);

  const today = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `categorias_${today}.csv`);
}

/**
 * Exporta presupuestos a CSV
 */
export function exportBudgetsToCSV(
  budgets: Budget[],
  categories: CategoryDefinition[]
): void {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const data = budgets.map(b => ({
    Categoría: categoryMap.get(b.categoryId) || b.categoryId,
    Monto: b.amount,
    'Fecha Inicio': b.period.startDate,
    'Fecha Fin': b.period.endDate,
    Tipo: b.period.type,
    Recurrente: b.isRecurring ? 'Sí' : 'No',
    ID: b.id,
  }));

  const headers = ['Categoría', 'Monto', 'Fecha Inicio', 'Fecha Fin', 'Tipo', 'Recurrente', 'ID'];
  const csv = arrayToCSV(data, headers);

  const today = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `presupuestos_${today}.csv`);
}

/**
 * Exporta todo (transacciones + categorías + presupuestos) en archivos separados
 */
export function exportAll(
  transactions: Transaction[],
  categories: CategoryDefinition[],
  budgets: Budget[]
): void {
  exportTransactionsToCSV(transactions, categories);

  // Pequeño delay para que no se descarguen todos al mismo tiempo
  setTimeout(() => exportCategoriesToCSV(categories), 300);
  setTimeout(() => exportBudgetsToCSV(budgets, categories), 600);
}
