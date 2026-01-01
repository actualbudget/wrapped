import { format, startOfYear, endOfYear, eachDayOfInterval } from "date-fns";
import { useState } from "react";

import type { CalendarDay } from "../../types";

import styles from "./CalendarHeatmap.module.css";

interface CalendarHeatmapProps {
  data: CalendarDay[];
  year?: number;
}

export function CalendarHeatmap({ data, year = 2025 }: CalendarHeatmapProps) {
  const [viewMode, setViewMode] = useState<"count" | "amount">("count");
  const [tooltip, setTooltip] = useState<{
    date: string;
    count: number;
    amount: number;
    x: number;
    y: number;
  } | null>(null);

  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  // Create a map for quick lookup
  const dataMap = new Map(data.map((d) => [d.date, d]));

  // Get max value for gradient calculation based on view mode
  const maxValue =
    viewMode === "count"
      ? Math.max(...data.map((d) => d.count), 1)
      : Math.max(...data.map((d) => d.amount), 1);

  // Group days by week
  const weeks: Array<Array<{ date: Date; day: CalendarDay | null }>> = [];
  let currentWeek: Array<{ date: Date; day: CalendarDay | null }> = [];

  // Prepend 2 transparent blocks to align the calendar
  currentWeek.push({ date: new Date(), day: null });
  currentWeek.push({ date: new Date(), day: null });

  allDays.forEach((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayData = dataMap.get(dayStr) || null;

    currentWeek.push({ date: day, day: dayData });

    // If we've reached 7 days in the current week (including the 2 prepended blocks), start a new week
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Add the last week and fill with transparent blocks to make it 7 days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: new Date(), day: null });
    }
    weeks.push(currentWeek);
  }

  const getColor = (value: number): string => {
    if (value === 0) return "#ebedf0";
    const intensity = Math.min(value / maxValue, 1);

    // Gradient from light purple to vibrant purple/pink
    if (intensity < 0.25) return "#c084fc";
    if (intensity < 0.5) return "#a855f7";
    if (intensity < 0.75) return "#9333ea";
    return "#7e22ce";
  };

  const handleDayHover = (day: CalendarDay | null, date: Date, event: React.MouseEvent) => {
    if (!day) {
      setTooltip(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      date: format(date, "MMM d, yyyy"),
      count: day.count,
      amount: day.amount,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleDayLeave = () => {
    setTooltip(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.heatmap}>
        <div className={styles.toggleContainer}>
          <button
            className={`${styles.toggleButton} ${viewMode === "count" ? styles.active : ""}`}
            onClick={() => setViewMode("count")}
          >
            Count
          </button>
          <button
            className={`${styles.toggleButton} ${viewMode === "amount" ? styles.active : ""}`}
            onClick={() => setViewMode("amount")}
          >
            Amount
          </button>
        </div>
        <div className={styles.weeks}>
          {weeks.map((week, weekIndex) => {
            const firstDayDate = week.find((d) => d.day !== null)?.date || week[0]?.date;
            const weekKey = firstDayDate ? format(firstDayDate, "yyyy-MM-dd") : `week-${weekIndex}`;
            return (
              <div key={weekKey} className={styles.week}>
                {week.map(({ date, day }, dayIndex) => {
                  const isValidDay = day !== null && date >= yearStart && date <= yearEnd;
                  const value = viewMode === "count" ? day?.count || 0 : day?.amount || 0;
                  const color = isValidDay ? getColor(value) : "transparent";
                  const dayKey = day
                    ? day.date
                    : format(date, "yyyy-MM-dd") || `day-${weekIndex}-${dayIndex}`;

                  return (
                    <div
                      key={dayKey}
                      className={`${styles.day} ${isValidDay ? styles.active : ""}`}
                      style={{ backgroundColor: color }}
                      onMouseEnter={(e) => isValidDay && handleDayHover(day, date, e)}
                      onMouseLeave={handleDayLeave}
                      title={
                        isValidDay
                          ? viewMode === "count"
                            ? `${format(date, "MMM d")}: ${day!.count} transaction${day!.count !== 1 ? "s" : ""}`
                            : `${format(date, "MMM d")}: $${day!.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                          : ""
                      }
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className={styles.legend}>
          <span>Less</span>
          <div className={styles.legendColors}>
            <div style={{ backgroundColor: "#ebedf0" }} />
            <div style={{ backgroundColor: "#c084fc" }} />
            <div style={{ backgroundColor: "#a855f7" }} />
            <div style={{ backgroundColor: "#9333ea" }} />
            <div style={{ backgroundColor: "#7e22ce" }} />
          </div>
          <span>More</span>
        </div>
      </div>

      {tooltip && (
        <div
          className={styles.tooltip}
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          {viewMode === "count" ? (
            <>
              <strong>{tooltip.count}</strong> transaction{tooltip.count !== 1 ? "s" : ""} on{" "}
              {tooltip.date}
            </>
          ) : (
            <>
              <strong>
                ${tooltip.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </strong>{" "}
              on {tooltip.date}
            </>
          )}
        </div>
      )}
    </div>
  );
}
