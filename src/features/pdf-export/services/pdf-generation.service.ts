/**
 * PDF Generation Service
 * Lazily imports @react-pdf/renderer to avoid bundle bloat.
 * The library is only downloaded when the user actually triggers PDF export.
 */

import { logger } from '@/shared/utils/logger';
import type { FinancialReportData, TripReportData } from './pdf-data.service';

/**
 * Generate a financial report PDF as a Blob.
 * Dynamic imports ensure @react-pdf is code-split into a separate chunk.
 */
export async function generateFinancialReportPDF(
  data: FinancialReportData,
): Promise<Blob> {
  try {
    logger.info('PDFExport', 'Generating financial report PDF...');

    const [{ pdf }, { default: FinancialReportDocument }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('../components/documents/FinancialReportDocument'),
    ]);

    const blob = await pdf(
      FinancialReportDocument({ data }),
    ).toBlob();

    logger.info('PDFExport', `PDF generated, size: ${(blob.size / 1024).toFixed(1)}KB`);
    return blob;
  } catch (err) {
    logger.error('PDFExport', 'Financial report PDF generation failed:', err);
    throw err;
  }
}

/**
 * Generate a trip report PDF as a Blob.
 */
export async function generateTripReportPDF(
  data: TripReportData,
): Promise<Blob> {
  try {
    logger.info('PDFExport', 'Generating trip report PDF...');

    const [{ pdf }, { default: TripReportDocument }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('../components/documents/TripReportDocument'),
    ]);

    const blob = await pdf(
      TripReportDocument({ data }),
    ).toBlob();

    logger.info('PDFExport', `Trip PDF generated, size: ${(blob.size / 1024).toFixed(1)}KB`);
    return blob;
  } catch (err) {
    logger.error('PDFExport', 'Trip report PDF generation failed:', err);
    throw err;
  }
}
