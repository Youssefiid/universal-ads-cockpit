import React from "react";

export function KpiCard({
  label,
  value,
  delta,
  isGood,
  subtitle,
  sparkline = [10, 15, 12, 18, 22, 20, 26, 30],
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  isGood: boolean;
  subtitle: string;
  sparkline?: number[];
  icon?: React.ComponentType<{ className?: string }>;
}) {
  // Generate SVG path from sparkline numbers
  const min = Math.min(...sparkline);
  const max = Math.max(...sparkline, min + 1);
  const width = 60;
  const height = 22;

  const points = sparkline.map((val, idx) => {
    const x = (idx / (sparkline.length - 1)) * width;
    const y = height - ((val - min) / (max - min)) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  return (
    <div className="overview-kpi-card">
      <div className="overview-kpi-head">
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {Icon && <Icon className="w-4 h-4 text-indigo-400" />}
          <span className="overview-kpi-label">{label}</span>
        </div>
        <span className={`overview-kpi-delta ${isGood ? "delta-good" : "delta-bad"}`}>
          {isGood ? "▲" : "▼"} {delta}
        </span>
      </div>

      <div className="overview-kpi-value">{value}</div>

      <div className="overview-kpi-foot">
        <span>{subtitle}</span>
        <svg viewBox={`0 0 ${width} ${height}`} className="overview-kpi-sparkline">
          <path
            d={pathD}
            fill="none"
            stroke={isGood ? "#10b981" : "#ef4444"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
