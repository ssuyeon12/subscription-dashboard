"use client";

import { WinnerInfo } from "@/types/subscription";

interface Props {
  items: WinnerInfo[];
  isLoading: boolean;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function WinnerStats({ items, isLoading }: Props) {
  if (isLoading) {
    return <div className="flex items-center justify-center h-32 text-gray-400">데이터 불러오는 중...</div>;
  }

  const totalHouses = items.length;
  const totalUnits = items.reduce((sum, i) => sum + (i.totSuplyHshldco ?? 0), 0);
  const avgRate =
    items.filter((i) => i.gnrlRnk1CrsplAplyPcnt > 0).length > 0
      ? (
          items.reduce((sum, i) => sum + (i.gnrlRnk1CrsplAplyPcnt ?? 0), 0) /
          items.filter((i) => i.gnrlRnk1CrsplAplyPcnt > 0).length
        ).toFixed(1)
      : "-";

  const regions = [...new Set(items.map((i) => i.sggNm))].filter(Boolean).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="총 단지수" value={totalHouses} sub="건" />
      <StatCard label="총 공급세대" value={totalUnits} sub="세대" />
      <StatCard label="평균 1순위 경쟁률" value={avgRate !== "-" ? `${avgRate}:1` : "-"} />
      <StatCard label="청약 지역수" value={regions} sub="개 지역" />
    </div>
  );
}
