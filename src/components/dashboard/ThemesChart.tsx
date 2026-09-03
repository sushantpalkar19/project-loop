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
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface ThemeDataPoint {
  themeId: string;
  name: string;
  color: string | null;
  count: number;
}

interface ThemesChartProps {
  data: ThemeDataPoint[];
  loading?: boolean;
}

const DEFAULT_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ThemeDataPoint & { fill: string } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-900 mb-1">{item.name}</p>
      <p className="text-slate-600">
        <span className="font-medium">{item.count}</span> associated feedback
        {item.count !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function ThemesChart({ data, loading }: ThemesChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-600" />
            Top Themes
          </CardTitle>
          <CardDescription>Themes ranked by feedback volume</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <Tag className="w-4 h-4 text-purple-600" />
            Top Themes
          </CardTitle>
          <CardDescription>Themes ranked by feedback volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[216px] gap-2.5 text-center px-4">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div className="space-y-0.5 max-w-[260px]">
              <p className="text-xs font-bold text-slate-800">No themes discovered yet</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                LOOP automatically identifies recurring topics from classified customer feedback.
              </p>
            </div>
            <Link href="/feedback">
              <Button variant="outline" size="sm" className="h-7 text-xs font-semibold mt-1">
                View Feedback
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by count descending, take top 10
  const chartData = data
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item, i) => ({
      ...item,
      fill: item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 font-bold">
          <Tag className="w-4 h-4 text-purple-600" />
          Top Themes
        </CardTitle>
        <CardDescription>Themes ranked by feedback volume</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[238px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={32}>
                {chartData.map((entry) => (
                  <Cell key={entry.themeId} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
