"use client";

/**
 * 연령별 청약 신청자 현황 차트
 * 데이터 출처: ApplyhomeStatSvc → getAPTReqstAgeStat (연령별 신청자)
 * 응답 필드: STAT_DE, AGE_30, AGE_40, AGE_50, AGE_60
 */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { AgeStat } from "@/types/subscription";

interface Props {
  items: AgeStat[];
  isLoading: boolean;
}

const AGE_COLORS = {
  "30대 이하": "#3b82f6",
  "40대": "#10b981",
  "50대": "#f59e0b",
  "60대 이상": "#ef4444",
};

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

  // 월별 집계
  const chartData = items.map((item) => ({
    월: `${item.STAT_DE.slice(0, 4)}.${item.STAT_DE.slice(4, 6)}`,
    "30대 이하": item.AGE_30 ?? 0,
    "40대": item.AGE_40 ?? 0,
    "50대": item.AGE_50 ?? 0,
    "60대 이상": item.AGE_60 ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="월" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => `${Number(v).toLocaleString()}건`} />
        <Legend />
        {(Object.keys(AGE_COLORS) as (keyof typeof AGE_COLORS)[]).map((key) => (
          <Bar key={key} dataKey={key} stackId="a" fill={AGE_COLORS[key]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
