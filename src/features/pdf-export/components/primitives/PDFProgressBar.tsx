/**
 * PDFProgressBar
 * Budget progress bar for trip reports
 */

import { View } from '@react-pdf/renderer';
import { Svg, Rect } from '@react-pdf/renderer';
import { styles, COLORS } from '../../utils/pdf-styles';

interface Props {
  percentage: number;
  isOverBudget: boolean;
}

export default function PDFProgressBar({ percentage, isOverBudget }: Props) {
  const fillColor = isOverBudget ? COLORS.negative : COLORS.income;
  const fillWidth = Math.min(percentage, 100);

  return (
    <View style={styles.progressBarBg}>
      <Svg width="100%" height="10">
        <Rect
          x="0"
          y="0"
          width={`${fillWidth}%`}
          height="10"
          rx="5"
          fill={fillColor}
        />
      </Svg>
    </View>
  );
}
