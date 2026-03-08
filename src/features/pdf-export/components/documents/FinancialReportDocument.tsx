/**
 * FinancialReportDocument
 * @react-pdf Document component for the custom date range financial report.
 *
 * Page 1: Summary (metrics + category breakdown)
 * Page 2+: Transaction detail (auto-paginated)
 * Last section: Insights
 */

import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, COLORS } from '../../utils/pdf-styles';
import { formatAmountPure, formatGroupDate } from '../../utils/pdf-format';
import type { FinancialReportData } from '../../services/pdf-data.service';
import PDFHeader from '../primitives/PDFHeader';
import PDFMetricCard from '../primitives/PDFMetricCard';
import PDFCategoryBar from '../primitives/PDFCategoryBar';
import PDFTransactionRow from '../primitives/PDFTransactionRow';

interface Props {
  data: FinancialReportData;
}

export default function FinancialReportDocument({ data }: Props) {
  const { currencyInfo, labels, summary, categoryBreakdown, transactions, insights, locale } = data;

  const fmt = (val: number) =>
    formatAmountPure(val, currencyInfo.locale, currencyInfo.code, currencyInfo.decimals);

  // Group transactions by date
  const txByDate = new Map<string, typeof transactions>();
  for (const tx of transactions) {
    const group = txByDate.get(tx.date) ?? [];
    group.push(tx);
    txByDate.set(tx.date, group);
  }

  return (
    <Document>
      {/* ==================== PAGE 1: SUMMARY ==================== */}
      <Page size="A4" style={styles.page}>
        <PDFHeader
          title={labels.title}
          startDate={data.dateRange.start}
          endDate={data.dateRange.end}
          locale={locale}
        />

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <PDFMetricCard
            label={labels.totalIncome}
            value={fmt(summary.totalIncome)}
            color={COLORS.income}
            bgColor={COLORS.incomeBg}
          />
          <PDFMetricCard
            label={labels.totalExpenses}
            value={fmt(summary.totalExpenses)}
            color={COLORS.expense}
            bgColor={COLORS.expenseBg}
          />
          <PDFMetricCard
            label={labels.netBalance}
            value={fmt(summary.netBalance)}
            color={summary.netBalance >= 0 ? COLORS.income : COLORS.negative}
            bgColor={summary.netBalance >= 0 ? COLORS.incomeBg : COLORS.negativeBg}
          />
          <PDFMetricCard
            label={labels.savingsRate}
            value={`${summary.savingsRate}%`}
            color={summary.savingsRate >= 0 ? COLORS.primary : COLORS.negative}
          />
        </View>

        {/* Transaction count */}
        <Text style={{ fontSize: 8, color: COLORS.gray400, marginBottom: 16, textAlign: 'center' }}>
          {summary.transactionCount} {labels.transactionsInPeriod}
        </Text>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{labels.expensesByCategory}</Text>
            {categoryBreakdown.map((cat) => (
              <PDFCategoryBar
                key={cat.name}
                name={cat.name}
                color={cat.color}
                amount={fmt(cat.amount)}
                percentage={cat.percentage}
              />
            ))}
          </View>
        )}

        {/* Insights section on page 1 */}
        {(insights.topCategory || insights.topDay) && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>{labels.analysis}</Text>

            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>{labels.dailyAverage}</Text>
              <Text style={styles.insightValue}>{fmt(insights.dailyAverage)}</Text>
            </View>

            {insights.topCategory && (
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>{labels.topCategory}</Text>
                <Text style={styles.insightValue}>
                  {insights.topCategory.name} ({fmt(insights.topCategory.amount)})
                </Text>
              </View>
            )}

            {insights.topDay && (
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>{labels.topDay}</Text>
                <Text style={styles.insightValue}>
                  {insights.topDay.name} ({fmt(insights.topDay.amount)})
                </Text>
              </View>
            )}

            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>{labels.daysInRange}</Text>
              <Text style={styles.insightValue}>{insights.daysInRange}</Text>
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

      {/* ==================== PAGE 2+: TRANSACTIONS ==================== */}
      {transactions.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>
            {labels.transactionDetails}
          </Text>

          {[...txByDate.entries()].map(([date, txs]) => (
            <View key={date} wrap={false}>
              <Text style={styles.txDateHeader}>
                {formatGroupDate(date, locale)}
              </Text>
              {txs.map((tx, i) => (
                <PDFTransactionRow
                  key={`${date}-${i}`}
                  name={tx.name}
                  categoryName={tx.categoryName}
                  categoryColor={tx.categoryColor}
                  amount={tx.amount}
                  type={tx.type}
                  currencyInfo={currencyInfo}
                />
              ))}
            </View>
          ))}

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
      )}
    </Document>
  );
}
