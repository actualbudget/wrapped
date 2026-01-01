import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from "recharts";

interface ChartDataItem {
  id: string; // Unique identifier for the item
  name: string; // Display name (may be truncated)
  fullName: string; // Full name for tooltip
  amount: number; // Original amount
  [key: string]: unknown; // Allow additional properties
}

interface ClickableBarChartProps {
  data: ChartDataItem[];
  colors: string[];
  height?: number;
  margin?: { top?: number; right?: number; left?: number; bottom?: number };
  tooltipFormatter?: (item: ChartDataItem, displayValue: number) => React.ReactNode;
}

export function ClickableBarChart({
  data,
  colors,
  height = 600,
  margin = { top: 20, right: 30, left: 100, bottom: 5 },
  tooltipFormatter,
}: ClickableBarChartProps) {
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

  const handleItemClick = (itemId: string) => {
    setHiddenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  interface PayloadItem {
    value?: number;
    payload?: ChartDataItem & { originalAmount?: number };
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string> & {
    payload?: PayloadItem[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const value = entry.value;
      const item = data.find((d) => d.name === label);
      const isHidden = item && hiddenItems.has(item.id);

      // Use original amount - either from payload's originalAmount or from data
      const payloadData = entry.payload;
      const displayValue = payloadData?.originalAmount ?? (isHidden && item ? item.amount : value);

      return (
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            color: "#ffffff",
          }}
        >
          <p style={{ margin: "0 0 8px 0", color: "#ffffff", fontWeight: "bold" }}>
            {item?.fullName || label}
          </p>
          {tooltipFormatter ? (
            tooltipFormatter(item!, displayValue ?? 0)
          ) : (
            <p style={{ margin: 0, color: "#ffffff" }}>
              Amount: $
              {typeof displayValue === "number"
                ? Math.round(displayValue).toLocaleString("en-US")
                : "0"}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Transform data to keep hidden items clickable
  const transformedData = data.map((entry) => {
    const isHidden = hiddenItems.has(entry.id);
    // Keep a minimum value for hidden bars so they remain clickable
    // Use a percentage of the max visible amount
    const visibleEntries = data.filter((e) => !hiddenItems.has(e.id));
    const maxVisibleAmount =
      visibleEntries.length > 0 ? Math.max(...visibleEntries.map((e) => e.amount)) : entry.amount;
    const minClickableAmount = maxVisibleAmount * 0.05; // 5% of max for better clickability
    return {
      ...entry,
      amount: isHidden ? minClickableAmount : entry.amount,
      originalAmount: entry.amount, // Store original for tooltip
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={transformedData} layout="vertical" margin={margin}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis type="number" stroke="rgba(255, 255, 255, 0.8)" />
        <YAxis type="category" dataKey="name" stroke="rgba(255, 255, 255, 0.8)" width={90} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.1)" }} />
        <Bar dataKey="amount" animationDuration={1000}>
          {data.map((entry, index) => {
            const isHidden = hiddenItems.has(entry.id);
            return (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                opacity={isHidden ? 0.15 : 1}
                onClick={() => handleItemClick(entry.id)}
                style={{ cursor: "pointer" }}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
