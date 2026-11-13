// Theme-aware chart tokens. Colors come from the CSS palette so charts match
// the rest of the UI in both dark and light themes.
export const CHART = {
  green: "#34d399",
  cyan: "#22d3ee",
  violet: "#a78bfa",
  amber: "#fbbf24",
  rose: "#fb7185",
  blue: "#60a5fa",
  grid: "rgba(140, 165, 184, 0.16)",
  axis: "#7d93a4",
};

export const tooltipStyle = {
  background: "#121b24",
  border: "1px solid #22323f",
  borderRadius: 12,
  color: "#e7eef5",
  fontSize: 12,
  padding: "8px 10px",
  boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
};

export const axisTick = { fill: CHART.axis, fontSize: 11 };

export const chartMargin = { top: 8, right: 10, left: -18, bottom: 0 };

export function tooltipCursor(fill = "rgba(52,211,153,0.06)") {
  return { fill };
}