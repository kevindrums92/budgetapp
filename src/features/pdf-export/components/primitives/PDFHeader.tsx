/**
 * PDFHeader
 * Brand banner at the top of each PDF page
 */

import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../utils/pdf-styles';
import { formatDateRange } from '../../utils/pdf-format';

interface Props {
  title: string;
  startDate: string;
  endDate: string;
  locale: string;
}

export default function PDFHeader({ title, startDate, endDate, locale }: Props) {
  return (
    <View style={styles.headerBar}>
      <Text style={styles.brandName}>SmartSpend</Text>
      <View>
        <Text style={styles.reportTitle}>{title}</Text>
        <Text style={styles.dateRange}>
          {formatDateRange(startDate, endDate, locale)}
        </Text>
      </View>
    </View>
  );
}
