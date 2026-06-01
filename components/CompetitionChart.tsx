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
import { CompetitionRate } from "@/types/subscription";

interface Props {
  items: CompetitionRate[];
  isLoading: boolean;
}

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"];

export default function CompetitionChart({ items, isLoading }: Props) {
  if (isLoading) {
    return <div className="flex items-center justify-center h-48 text-gray-400">데이터 불러오는 중...</div>;
  }

  // 단지별 최대 1순위 경쟁률 집계 (상위 10개)
  const aggregated = items
    .filter((item) => item.gnrlRnk1CrsplAplyPcnt > 0)
    .sort((a, b) => b.gnrlRnk1CrsplAplyPcnt - a.gnrlRnk1CrsplAplyPcnt)
    .slice(0, 10)
    .map((item) => ({
      name: item.houseName?.length > 10 ? item.houseName.slice(0, 10) + "…" : item.houseName,
      "1순위 경쟁률": item.gnrlRnk1CrsplAplyPcnt,
      "2순위 경쟁률": item.gnrlRnk2CrsplAplyPcnt ?? 0,
    }));

  if (!aggregated.length) {
    return <div className="flex items-center justify-center h-48 text-gray-400">경쟁률 데이터가 없습니다.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={aggregated} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}:1`} />
        <Tooltip formatter={(v) => `${Number(v).toLocaleString()}:1`} />
        <Bar dataKey="1순위 경쟁률" radius={[4, 4, 0, 0]}>
          {aggregated.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
