/**
 * export.service.ts
 * Servicio para exportar datos a CSV
 */

import type { Transaction, Category, Budget } from '@/types/budget.types';
import { downloadCSV as downloadCSVFile } from '@/shared/utils/download.utils';

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
 * Descarga un string como archivo CSV (ahora usa el utility multiplataforma)
 */
async function downloadCSV(content: string, filename: string): Promise<void> {
  // Remove .csv extension if present (utility will add it)
  const filenameWithoutExt = filename.endsWith('.csv') ? filename.slice(0, -4) : filename;
  await downloadCSVFile(content, filenameWithoutExt);
}

/**
 * Exporta transacciones a CSV
 */
export async function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[]
): Promise<void> {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const data = transactions.map(t => ({
    Fecha: t.date,
    Nombre: t.name,
    Categoría: categoryMap.get(t.category) || t.category,
    Tipo: t.type === 'expense' ? 'Gasto' : 'Ingreso',
    Monto: t.amount,
    Recurrente: t.isRecurring ? 'Sí' : 'No',
    Notas: t.notes || '',
    ID: t.id,
  }));

  const headers = ['Fecha', 'Nombre', 'Categoría', 'Tipo', 'Monto', 'Recurrente', 'Notas', 'ID'];
  const csv = arrayToCSV(data, headers);

  const today = new Date().toISOString().split('T')[0];
  await downloadCSV(csv, `transacciones_${today}.csv`);
}

/**
 * Exporta categorías a CSV
 */
export async function exportCategoriesToCSV(categories: Category[]): Promise<void> {
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
  await downloadCSV(csv, `categorias_${today}.csv`);
}

/**
 * Exporta presupuestos a CSV
 */
export async function exportBudgetsToCSV(
  budgets: Budget[],
  categories: Category[]
): Promise<void> {
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
  await downloadCSV(csv, `presupuestos_${today}.csv`);
}

/**
 * Exporta todo (transacciones + categorías + presupuestos) en archivos separados
 */
export async function exportAll(
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[]
): Promise<void> {
  await exportTransactionsToCSV(transactions, categories);

  // Pequeño delay para que no se descarguen todos al mismo tiempo
  await new Promise(resolve => setTimeout(resolve, 300));
  await exportCategoriesToCSV(categories);

  await new Promise(resolve => setTimeout(resolve, 300));
  await exportBudgetsToCSV(budgets, categories);
}
