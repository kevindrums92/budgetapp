/**
 * PDFMetricCard
 * Key metric display box (income, expenses, balance, savings rate)
 */

import { View, Text } from '@react-pdf/renderer';
import { styles, COLORS } from '../../utils/pdf-styles';

interface Props {
  label: string;
  value: string;
  color?: string;
  bgColor?: string;
}

export default function PDFMetricCard({
  label,
  value,
  color = COLORS.gray900,
  bgColor = COLORS.gray50,
}: Props) {
  return (
    <View style={[styles.metricCard, { backgroundColor: bgColor }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}
