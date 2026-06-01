"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SpecialSupply } from "@/types/subscription";

interface Props {
  items: SpecialSupply[];
  isLoading: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

export default function SpecialSupplyChart({ items, isLoading }: Props) {
  if (isLoading) {
    return <div className="flex items-center justify-center h-48 text-gray-400">데이터 불러오는 중...</div>;
  }

  const totals = items.reduce(
    (acc, item) => {
      acc["다자녀가구"] = (acc["다자녀가구"] ?? 0) + (item.mlfamRcpCnt ?? 0);
      acc["노부모부양"] = (acc["노부모부양"] ?? 0) + (item.oldParntsSuportRcpCnt ?? 0);
      acc["신혼부부"] = (acc["신혼부부"] ?? 0) + (item.newlyMarriedRcpCnt ?? 0);
      acc["생애최초"] = (acc["생애최초"] ?? 0) + (item.firstLiveRcpCnt ?? 0);
      acc["기관추천"] = (acc["기관추천"] ?? 0) + (item.insttRecomendRcpCnt ?? 0);
      acc["기타"] = (acc["기타"] ?? 0) + (item.etcRcpCnt ?? 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const data = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  if (!data.length) {
    return <div className="flex items-center justify-center h-48 text-gray-400">특별공급 데이터가 없습니다.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `${Number(v).toLocaleString()}건`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
