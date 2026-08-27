"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Props {
  stats: {
    applied?: number;
    interview?: number;
    accepted?: number;
    rejected?: number;
  };
}

export default function StatsChart({ stats }: Props) {
  const data = [
    {
      name: "Applied",
      value: stats.applied || 0,
    },
    {
      name: "Interview",
      value: stats.interview || 0,
    },
    {
      name: "Accepted",
      value: stats.accepted || 0,
    },
    {
      name: "Rejected",
      value: stats.rejected || 0,
    },
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Overview</h2>

          <p className="text-slate-400 text-sm mt-1">
            Track your job application progress
          </p>
        </div>
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

            <XAxis dataKey="name" stroke="#94a3b8" />

            <YAxis stroke="#94a3b8" />

            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid #334155",
                borderRadius: "16px",
                color: "white",
              }}
            />

            <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
