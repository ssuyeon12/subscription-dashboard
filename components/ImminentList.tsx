"use client";

import { SaleInfo } from "@/types/subscription";

interface Props {
  items: SaleInfo[];
  isLoading: boolean;
}

function getDDay(endDate: string): number | null {
  if (!endDate) return null;
  const today = new Date(new Date().toISOString().slice(0, 10));
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getStatus(start: string, end: string): "open" | "upcoming" | "closed" {
  const today = new Date().toISOString().slice(0, 10);
  if (!start || !end) return "closed";
  if (today < start) return "upcoming";
  if (today <= end) return "open";
  return "closed";
}

function formatDateBlock(dateStr: string) {
  if (!dateStr || dateStr.length < 10) return { month: "--", day: "--" };
  const parts = dateStr.split("-");
  return { month: parts[1] ?? "--", day: parts[2] ?? "--" };
}

export default function ImminentList({ items, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const relevant = items
    .filter((it) => {
      const status = getStatus(it.RCEPT_BGNDE, it.RCEPT_ENDDE);
      return status === "open" || status === "upcoming";
    })
    .sort((a, b) => {
      // 마감일 가까운 순 (접수중 우선, 그 다음 예정)
      const sa = getStatus(a.RCEPT_BGNDE, a.RCEPT_ENDDE);
      const sb = getStatus(b.RCEPT_BGNDE, b.RCEPT_ENDDE);
      if (sa !== sb) return sa === "open" ? -1 : 1;
      return (a.RCEPT_ENDDE ?? "").localeCompare(b.RCEPT_ENDDE ?? "");
    })
    .slice(0, 4);

  if (relevant.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
        접수중 또는 예정 단지가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {relevant.map((item) => {
        const status = getStatus(item.RCEPT_BGNDE, item.RCEPT_ENDDE);
        const dday = status === "open" ? getDDay(item.RCEPT_ENDDE) : getDDay(item.RCEPT_BGNDE);
        const dateStr = status === "open" ? item.RCEPT_ENDDE : item.RCEPT_BGNDE;
        const { month, day } = formatDateBlock(dateStr);
        const isImminent = dday !== null && dday <= 3;

        return (
          <div
            key={item.HOUSE_MANAGE_NO}
            className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-colors"
          >
            {/* 날짜 블록 */}
            <div className={`shrink-0 rounded-lg px-2 py-1 text-center min-w-[40px] ${
              isImminent ? "bg-red-50 text-red-600" : status === "open" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
            }`}>
              <div className="text-xs font-medium leading-tight">{month}월</div>
              <div className="text-base font-bold leading-tight">{day}</div>
            </div>

            {/* 내용 */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{item.HOUSE_NM}</p>
              <p className="text-xs text-gray-400 truncate">{item.SUBSCRPT_AREA_CODE_NM}</p>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {status === "open" ? (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700">접수중</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">예정</span>
                )}
                {isImminent && dday !== null && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-600 font-semibold">
                    D-{dday}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
