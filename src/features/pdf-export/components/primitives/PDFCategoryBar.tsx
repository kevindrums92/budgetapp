/**
 * PDFCategoryBar
 * Horizontal colored bar for category breakdown
 */

import { View, Text } from '@react-pdf/renderer';
import { Svg, Rect } from '@react-pdf/renderer';
import { styles } from '../../utils/pdf-styles';

interface Props {
  name: string;
  color: string;
  amount: string;
  percentage: number;
}

export default function PDFCategoryBar({ name, color, amount, percentage }: Props) {
  const barWidth = Math.max(percentage, 2); // min 2% for visibility

  return (
    <View style={styles.categoryRow}>
      <Text style={styles.categoryName}>{name}</Text>
      <View style={styles.categoryBarContainer}>
        <Svg width="100%" height="14">
          <Rect
            x="0"
            y="0"
            width={`${barWidth}%`}
            height="14"
            rx="7"
            fill={color}
            opacity={0.85}
          />
        </Svg>
      </View>
      <Text style={styles.categoryAmount}>{amount}</Text>
      <Text style={styles.categoryPercent}>{percentage}%</Text>
    </View>
  );
}
