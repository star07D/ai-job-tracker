"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
interface Props {
  stats: {
    applied?: number;
    interview?: number;
    accepted?: number;
    rejected?: number;
  };
}

function useTokens() {
  const { resolvedTheme } = useTheme();
  const [t, setT] = useState({
    grid: "#e4e7ec",
    axis: "#8b92a0",
    applied: "#5a6675",
    interview: "#9c6408",
    accepted: "#0f7a4e",
    rejected: "#c33350",
    surface: "#ffffff",
    border: "#d3d8e0",
    fg: "#111318",
  });

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const v = (name: string, fb: string) =>
      cs.getPropertyValue(name).trim() || fb;
    setT({
      grid: v("--border", "#e4e7ec"),
      axis: v("--fg-subtle", "#8b92a0"),
      applied: v("--st-applied", "#5a6675"),
      interview: v("--st-interview", "#9c6408"),
      accepted: v("--st-accepted", "#0f7a4e"),
      rejected: v("--st-rejected", "#c33350"),
      surface: v("--surface", "#ffffff"),
      border: v("--border-strong", "#d3d8e0"),
      fg: v("--fg", "#111318"),
    });
  }, [resolvedTheme]);

  return t;
}

export default function StatsChart({ stats }: Props) {
  const t = useTokens();
  const data = [
    { name: "Applied", value: stats.applied || 0, fill: t.applied },
    { name: "Interview", value: stats.interview || 0, fill: t.interview },
    { name: "Accepted", value: stats.accepted || 0, fill: t.accepted },
    { name: "Rejected", value: stats.rejected || 0, fill: t.rejected },
  ];

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke={t.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            stroke={t.axis}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            fontFamily="var(--font-mono)"
          />
          <YAxis
            stroke={t.axis}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            allowDecimals={false}
            width={38}
          />
          <Tooltip
            cursor={{ fill: "var(--accent-soft)" }}
            contentStyle={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              color: t.fg,
              fontSize: 13,
              boxShadow: "var(--shadow-pop)",
            }}
            labelStyle={{ color: t.fg, fontWeight: 600 }}
          />
          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            maxBarSize={54}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
