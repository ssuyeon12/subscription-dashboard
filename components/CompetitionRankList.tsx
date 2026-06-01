"use client";

import { CompetitionRate } from "@/types/subscription";

interface Props {
  items: CompetitionRate[];
  isLoading: boolean;
  selected: string | null;
  onSelect: (key: string) => void;
}

function rateColor(rate: string): string {
  const v = parseFloat(rate);
  if (isNaN(v)) return "text-gray-400";
  if (v >= 100) return "text-red-500";
  if (v >= 40) return "text-orange-500";
  if (v >= 20) return "text-amber-500";
  if (v >= 10) return "text-blue-500";
  return "text-teal-600";
}

function rateBarColor(rate: string): string {
  const v = parseFloat(rate);
  if (isNaN(v)) return "bg-gray-200";
  if (v >= 100) return "bg-red-400";
  if (v >= 40) return "bg-orange-400";
  if (v >= 20) return "bg-amber-400";
  if (v >= 10) return "bg-blue-400";
  return "bg-teal-400";
}

export default function CompetitionRankList({ items, isLoading, selected, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // 1순위(SUBSCRPT_RANK_CODE=1), 해당지역(RESIDE_SECD="01") 기준
  const filtered = items.filter(
    (it) => it.SUBSCRPT_RANK_CODE === 1 && it.RESIDE_SECD === "01" && it.CMPET_RATE !== "-"
  );

  // 단지별 최고 경쟁률
  const byHouse = new Map<string, { name: string; rate: number; key: string }>();
  for (const it of filtered) {
    const key = String(it.HOUSE_MANAGE_NO);
    const rate = parseFloat(it.CMPET_RATE);
    if (!isNaN(rate)) {
      const existing = byHouse.get(key);
      if (!existing || rate > existing.rate) {
        byHouse.set(key, { name: it.HOUSE_NM ?? `단지 ${key}`, rate, key });
      }
    }
  }

  const ranked = Array.from(byHouse.values())
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10);

  if (ranked.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">경쟁률 데이터가 없습니다.</div>;
  }

  const maxRate = ranked[0]?.rate ?? 1;

  return (
    <div className="space-y-1.5">
      {ranked.map((item, idx) => {
        const isSelected = selected === item.key;
        const barWidth = Math.max(4, Math.round((item.rate / maxRate) * 100));
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
              isSelected
                ? "border-2 border-blue-500 bg-blue-50"
                : "border border-gray-100 bg-white hover:bg-gray-50"
            }`}
          >
            <span className="w-5 text-xs font-bold text-gray-400 text-right shrink-0">{idx + 1}</span>
            <span className="flex-1 text-left text-gray-800 font-medium truncate">{item.name}</span>
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0">
              <div
                className={`h-full rounded-full ${rateBarColor(String(item.rate))}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className={`w-14 text-right text-xs font-semibold shrink-0 ${rateColor(String(item.rate))}`}>
              {item.rate.toFixed(1)}:1
            </span>
          </button>
        );
      })}
    </div>
  );
}
