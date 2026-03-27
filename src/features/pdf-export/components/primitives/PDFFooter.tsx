/**
 * PDFFooter
 * Page numbers + generation timestamp at the bottom of each page
 */

import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../utils/pdf-styles';

interface Props {
  generatedAt: string;
  pageNumber: number;
  totalPages: number;
}

export default function PDFFooter({ generatedAt, pageNumber, totalPages }: Props) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        Generado con Lukas • {generatedAt}
      </Text>
      <Text style={styles.footerText}>
        {pageNumber} / {totalPages}
      </Text>
    </View>
  );
}
