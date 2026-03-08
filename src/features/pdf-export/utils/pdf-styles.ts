/**
 * PDF Styles
 * Brand-consistent styles for @react-pdf/renderer documents
 */

import { StyleSheet } from '@react-pdf/renderer';

// Brand colors
export const COLORS = {
  primary: '#18B7B0',
  primaryLight: '#E0F7F6',
  income: '#10B981',
  incomeBg: '#ECFDF5',
  expense: '#111827',
  expenseBg: '#F3F4F6',
  negative: '#EF4444',
  negativeBg: '#FEF2F2',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
};

export const styles = StyleSheet.create({
  // Page
  page: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },

  // Header
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  brandName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  reportTitle: {
    fontSize: 11,
    color: COLORS.gray500,
    textAlign: 'right',
  },
  dateRange: {
    fontSize: 9,
    color: COLORS.gray400,
    textAlign: 'right',
    marginTop: 2,
  },

  // Section titles
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray800,
    marginBottom: 12,
    marginTop: 20,
  },

  // Metric cards (2x2 grid)
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  metricCard: {
    width: '48%',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
  },
  metricLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },

  // Category bars
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryName: {
    fontSize: 9,
    color: COLORS.gray700,
    width: 100,
  },
  categoryBarContainer: {
    flex: 1,
    height: 14,
    backgroundColor: COLORS.gray100,
    borderRadius: 7,
    overflow: 'hidden',
  },
  categoryAmount: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray800,
    width: 80,
    textAlign: 'right',
  },
  categoryPercent: {
    fontSize: 8,
    color: COLORS.gray400,
    width: 36,
    textAlign: 'right',
  },

  // Transaction rows
  txDateHeader: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray500,
    marginTop: 10,
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  txName: {
    flex: 1,
    fontSize: 9,
    color: COLORS.gray800,
  },
  txCategory: {
    fontSize: 8,
    color: COLORS.gray400,
    width: 80,
  },
  txAmount: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    width: 80,
    textAlign: 'right',
  },

  // Insights
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray100,
  },
  insightLabel: {
    fontSize: 10,
    color: COLORS.gray600,
  },
  insightValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray800,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray200,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.gray400,
  },

  // Progress bar (trips)
  progressBarBg: {
    height: 10,
    backgroundColor: COLORS.gray100,
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 8,
  },

  // Trip header
  tripTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  tripSubtitle: {
    fontSize: 11,
    color: COLORS.gray500,
    marginBottom: 16,
  },
});
