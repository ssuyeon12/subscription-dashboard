"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
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

  // 1순위 해당지역(RESIDE_SECD=01) 경쟁률 상위 10개
  const rank1 = items.filter(
    (item) => item.SUBSCRPT_RANK_CODE === 1 && item.RESIDE_SECD === "01" && item.CMPET_RATE !== "-"
  );

  const aggregated = rank1
    .map((item) => ({
      key: `${item.HOUSE_MANAGE_NO}-${item.HOUSE_TY}`,
      name: item.HOUSE_NM
        ? `${item.HOUSE_NM}(${item.HOUSE_TY ?? "-"})`
        : `No.${String(item.HOUSE_MANAGE_NO).slice(-4)}(${item.HOUSE_TY ?? "-"})`,
      fullName: item.HOUSE_NM ?? `주택관리번호: ${item.HOUSE_MANAGE_NO}`,
      rate: parseFloat(item.CMPET_RATE) || 0,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10);

  if (!aggregated.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm text-center px-4 gap-1">
        <span>경쟁률 데이터가 없습니다.</span>
        <span className="text-xs text-gray-300">최근 접수 완료된 단지의 경쟁률이 표시됩니다.</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={aggregated} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}:1`} />
        <Tooltip
          formatter={(v) => [`${Number(v).toLocaleString()}:1`, "경쟁률"]}
          labelFormatter={(label) => {
            const item = aggregated.find((a) => a.name === label);
            return item ? `${item.fullName} / ${label.match(/\(([^)]+)\)/)?.[1] ?? ""}` : label;
          }}
        />
        <Bar dataKey="rate" name="경쟁률" radius={[4, 4, 0, 0]}>
          {aggregated.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
