"use client";

/**
 * 연령별 청약 신청자 현황 도넛 파이차트
 * 데이터 출처: ApplyhomeStatSvc → getAPTReqstAgeStat (연령별 신청자)
 * 응답 필드: STAT_DE, AGE_30, AGE_40, AGE_50, AGE_60
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { AgeStat } from "@/types/subscription";

interface Props {
  items: AgeStat[];
  isLoading: boolean;
}

const AGE_CONFIG = [
  { key: "AGE_30" as const, label: "30대 이하", color: "#3b82f6" },
  { key: "AGE_40" as const, label: "40대",     color: "#6366f1" },
  { key: "AGE_50" as const, label: "50대",     color: "#f59e0b" },
  { key: "AGE_60" as const, label: "60대 이상", color: "#ef4444" },
];

export default function AgeDistributionChart({ items, isLoading }: Props) {
  if (isLoading) {
    return <div className="flex items-center justify-center h-48 text-gray-400">데이터 불러오는 중...</div>;
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm text-center gap-1">
        <span>연령별 신청 데이터가 없습니다.</span>
        <span className="text-xs text-gray-300">매월 26일에 전월 데이터가 업데이트됩니다.</span>
      </div>
    );
  }

  // 전체 기간 합산
  const totals = AGE_CONFIG.map(({ key, label, color }) => ({
    label,
    color,
    value: items.reduce((s, item) => s + (item[key] ?? 0), 0),
  }));
  const grand = totals.reduce((s, t) => s + t.value, 0);

  return (
    <div className="flex items-center gap-2">
      {/* 도넛 파이차트 */}
      <div className="shrink-0" style={{ width: 180, height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={totals}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
            >
              {totals.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`${Number(v).toLocaleString()}건`, ""]}
              contentStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 + 비율 */}
      <div className="flex flex-col gap-2.5 flex-1">
        {totals.map((entry) => {
          const pct = grand > 0 ? (entry.value / grand) * 100 : 0;
          return (
            <div key={entry.label} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 w-16">{entry.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: entry.color }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
        <p className="text-xs text-gray-400 mt-1 pt-2 border-t border-gray-100">
          합계 {grand.toLocaleString()}건 · 전국 기준
        </p>
      </div>
    </div>
  );
}
