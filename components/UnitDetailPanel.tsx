"use client";

import { CompetitionRate } from "@/types/subscription";

interface Props {
  items: CompetitionRate[];
  houseName: string;
  isLoading: boolean;
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

export default function UnitDetailPanel({ items, houseName, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-2">
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 10h18M3 14h18M10 3v18M14 3v18" />
        </svg>
        <span>왼쪽에서 단지를 선택하세요</span>
      </div>
    );
  }

  // 1순위 해당지역만 표시
  const rank1 = items.filter(
    (it) => it.SUBSCRPT_RANK_CODE === 1 && it.RESIDE_SECD === "01"
  );
  const display = rank1.length > 0 ? rank1 : items.filter((it) => it.SUBSCRPT_RANK_CODE === 1);

  const maxRate = display.reduce((acc, it) => {
    const v = parseFloat(it.CMPET_RATE);
    return !isNaN(v) && v > acc ? v : acc;
  }, 1);

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3 font-medium truncate">{houseName} · 주택형별 경쟁률 (1순위 해당지역)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 text-left">
              <th className="pb-2 font-medium">주택형</th>
              <th className="pb-2 font-medium text-right">공급</th>
              <th className="pb-2 font-medium text-right">접수</th>
              <th className="pb-2 font-medium">경쟁률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {display.map((it, i) => {
              const rate = it.CMPET_RATE !== "-" ? parseFloat(it.CMPET_RATE) : NaN;
              const barPct = !isNaN(rate) ? Math.max(4, Math.round((rate / maxRate) * 100)) : 0;
              return (
                <tr key={`${it.HOUSE_MANAGE_NO}-${it.HOUSE_TY}-${i}`} className="hover:bg-gray-50">
                  <td className="py-2 font-medium text-gray-700">{it.HOUSE_TY}</td>
                  <td className="py-2 text-right text-gray-500">{it.SUPLY_HSHLDCO}</td>
                  <td className="py-2 text-right text-gray-500">{it.REQ_CNT !== "-" ? it.REQ_CNT : "-"}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        {barPct > 0 && (
                          <div
                            className={`h-full rounded-full ${rateBarColor(it.CMPET_RATE)}`}
                            style={{ width: `${barPct}%` }}
                          />
                        )}
                      </div>
                      <span className={`font-semibold ${rateColor(it.CMPET_RATE)}`}>
                        {it.CMPET_RATE !== "-" ? `${parseFloat(it.CMPET_RATE).toFixed(1)}:1` : "-"}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
