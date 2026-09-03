"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PieChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface SentimentData {
  POS: { count: number; percentage: number };
  NEU: { count: number; percentage: number };
  NEG: { count: number; percentage: number };
}

interface SentimentChartProps {
  data: SentimentData;
  loading?: boolean;
}

const SENTIMENT_COLORS: Record<string, string> = {
  POS: "#10b981",
  NEU: "#94a3b8",
  NEG: "#f43f5e",
};

const SENTIMENT_LABELS: Record<string, string> = {
  POS: "Positive",
  NEU: "Neutral",
  NEG: "Negative",
};

interface ChartBar {
  name: string;
  key: string;
  count: number;
  percentage: number;
  fill: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartBar }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-900 mb-1">{item.name}</p>
      <p className="text-slate-600">
        <span className="font-medium">{item.count}</span> feedback
        {item.count !== 1 ? "s" : ""}{" "}
        <span className="text-slate-400">({item.percentage}%)</span>
      </p>
    </div>
  );
}

export default function SentimentChart({ data, loading }: SentimentChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            Sentiment Breakdown
          </CardTitle>
          <CardDescription>Distribution of customer sentiment</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const total = data.POS.count + data.NEU.count + data.NEG.count;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            Sentiment Breakdown
          </CardTitle>
          <CardDescription>Distribution of customer sentiment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-xs text-slate-400">
            No sentiment data available yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData: ChartBar[] = ["POS", "NEU", "NEG"].map((key) => ({
    name: SENTIMENT_LABELS[key],
    key,
    count: data[key as keyof SentimentData].count,
    percentage: data[key as keyof SentimentData].percentage,
    fill: SENTIMENT_COLORS[key],
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 font-bold">
          <PieChart className="w-4 h-4 text-indigo-600" />
          Sentiment Breakdown
        </CardTitle>
        <CardDescription>Distribution of customer sentiment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs">
          {chartData.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-slate-600 font-medium">{item.name}</span>
              <span className="text-slate-400 font-mono text-[11px]">
                ({item.count})
              </span>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="h-[216px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
