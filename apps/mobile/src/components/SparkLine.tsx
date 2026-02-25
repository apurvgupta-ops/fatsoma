import React from "react";
import { View } from "react-native";
import Svg, { Polyline, Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { colors } from "../theme";

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  max: number;
  color?: string;
}

export function SparkLine({
  data,
  width = 120,
  height = 40,
  max,
  color,
}: SparkLineProps) {
  if (data.length < 2) return null;

  const lineColor =
    color ?? (data[data.length - 1] >= data[data.length - 2] ? colors.stock.green : colors.stock.red);

  const padX = 2;
  const padY = 4;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = data
    .map((v, i) => {
      const x = padX + (i / (data.length - 1)) * chartW;
      const y = padY + chartH - (v / max) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.2" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#grad)" rx={4} />
        <Polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
