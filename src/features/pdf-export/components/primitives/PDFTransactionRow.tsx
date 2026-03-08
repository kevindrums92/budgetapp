/**
 * PDFTransactionRow
 * Single transaction row with category color dot
 */

import { View, Text } from '@react-pdf/renderer';
import { Svg, Circle } from '@react-pdf/renderer';
import { styles, COLORS } from '../../utils/pdf-styles';
import { formatAmountPure } from '../../utils/pdf-format';
import type { PDFCurrencyInfo } from '../../services/pdf-data.service';

interface Props {
  name: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  type: 'income' | 'expense';
  currencyInfo: PDFCurrencyInfo;
}

export default function PDFTransactionRow({
  name,
  categoryName,
  categoryColor,
  amount,
  type,
  currencyInfo,
}: Props) {
  const amountColor = type === 'income' ? COLORS.income : COLORS.gray800;
  const prefix = type === 'income' ? '+' : '-';
  const formatted = formatAmountPure(
    amount,
    currencyInfo.locale,
    currencyInfo.code,
    currencyInfo.decimals,
  );

  return (
    <View style={styles.txRow} wrap={false}>
      {/* Color dot */}
      <Svg width="8" height="8">
        <Circle cx="4" cy="4" r="4" fill={categoryColor} />
      </Svg>
      <Text style={styles.txName}>{name}</Text>
      <Text style={styles.txCategory}>{categoryName}</Text>
      <Text style={[styles.txAmount, { color: amountColor }]}>
        {prefix}{formatted}
      </Text>
    </View>
  );
}
