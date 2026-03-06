/**
 * TripReportDocument
 * @react-pdf Document component for trip expense reports.
 * Single document with header, budget progress, category breakdown, and expense list.
 */

import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, COLORS } from '../../utils/pdf-styles';
import { formatAmountPure, formatShortDate, formatDateRange } from '../../utils/pdf-format';
import type { TripReportData } from '../../services/pdf-data.service';
import PDFProgressBar from '../primitives/PDFProgressBar';
import PDFCategoryBar from '../primitives/PDFCategoryBar';

interface Props {
  data: TripReportData;
}

export default function TripReportDocument({ data }: Props) {
  const { trip, currencyInfo, labels, summary, categoryBreakdown, expenses, locale } = data;

  const fmt = (val: number) =>
    formatAmountPure(val, currencyInfo.locale, currencyInfo.code, currencyInfo.decimals);

  const statusLabels: Record<string, string> = {
    planning: labels.statusPlanning,
    active: labels.statusActive,
    completed: labels.statusCompleted,
  };

  const dateRangeText = trip.endDate
    ? formatDateRange(trip.startDate, trip.endDate, locale)
    : `${labels.since} ${formatShortDate(trip.startDate, locale)}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.brandName}>SmartSpend</Text>
            <Text style={{ fontSize: 8, color: COLORS.gray400, marginTop: 2 }}>
              {labels.title}
            </Text>
          </View>
          <View>
            <Text style={styles.reportTitle}>{statusLabels[trip.status] ?? trip.status}</Text>
            <Text style={styles.dateRange}>{dateRangeText}</Text>
          </View>
        </View>

        {/* Trip info */}
        <Text style={styles.tripTitle}>{trip.name}</Text>
        <Text style={styles.tripSubtitle}>{trip.destination}</Text>

        {/* Budget summary */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { width: '31%' }]}>
            <Text style={styles.metricLabel}>{labels.budget}</Text>
            <Text style={[styles.metricValue, { fontSize: 14, color: COLORS.gray800 }]}>
              {fmt(summary.totalBudget)}
            </Text>
          </View>
          <View style={[styles.metricCard, { width: '31%' }]}>
            <Text style={styles.metricLabel}>{labels.spent}</Text>
            <Text style={[styles.metricValue, {
              fontSize: 14,
              color: summary.isOverBudget ? COLORS.negative : COLORS.expense,
            }]}>
              {fmt(summary.totalSpent)}
            </Text>
          </View>
          <View style={[styles.metricCard, { width: '31%' }]}>
            <Text style={styles.metricLabel}>
              {summary.isOverBudget ? labels.exceeded : labels.available}
            </Text>
            <Text style={[styles.metricValue, {
              fontSize: 14,
              color: summary.isOverBudget ? COLORS.negative : COLORS.income,
            }]}>
              {fmt(Math.abs(summary.remaining))}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ marginTop: 4 }}>
          <PDFProgressBar
            percentage={summary.progressPercent}
            isOverBudget={summary.isOverBudget}
          />
          <Text style={{ fontSize: 8, color: COLORS.gray400, textAlign: 'center', marginTop: 2 }}>
            {summary.progressPercent}% {labels.budgetUsed}
          </Text>
        </View>

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{labels.expensesByCategory}</Text>
            {categoryBreakdown.map((cat) => (
              <PDFCategoryBar
                key={cat.category}
                name={cat.name}
                color={cat.category === 'transport' ? '#3B82F6' :
                       cat.category === 'accommodation' ? '#8B5CF6' :
                       cat.category === 'food' ? '#F59E0B' :
                       cat.category === 'activities' ? '#10B981' :
                       cat.category === 'shopping' ? '#EC4899' :
                       '#6B7280'}
                amount={fmt(cat.amount)}
                percentage={cat.percentage}
              />
            ))}
          </View>
        )}

        {/* Expense list */}
        {expenses.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{labels.expenseDetails}</Text>
            {expenses.map((expense, i) => (
              <View key={i} style={styles.txRow} wrap={false}>
                <Text style={[styles.txCategory, { width: 60 }]}>
                  {formatShortDate(expense.date, locale)}
                </Text>
                <Text style={styles.txName}>{expense.name}</Text>
                <Text style={[styles.txAmount, { color: COLORS.gray800 }]}>
                  {fmt(expense.amount)}
                </Text>
              </View>
            ))}

            {/* Total row */}
            <View style={[styles.txRow, {
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: COLORS.gray200,
            }]}>
              <Text style={[styles.txName, { fontFamily: 'Helvetica-Bold' }]}>
                {labels.total}
              </Text>
              <Text style={[styles.txAmount, { fontFamily: 'Helvetica-Bold', color: COLORS.gray900 }]}>
                {fmt(summary.totalSpent)}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {labels.generatedWith} • {data.generatedAt}
          </Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
}
