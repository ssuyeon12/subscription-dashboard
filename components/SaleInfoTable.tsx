"use client";

import { SaleInfo } from "@/types/subscription";

function formatDate(d: string) {
  if (!d) return "-";
  return d.length === 10 ? d : "-";
}

function formatMvnYm(ym: string) {
  if (!ym || ym.length < 6) return "-";
  return `${ym.slice(0, 4)}.${ym.slice(4, 6)}`;
}

function getStatus(start: string, end: string): "open" | "upcoming" | "closed" {
  const today = new Date().toISOString().slice(0, 10);
  if (!start || !end) return "closed";
  if (today < start) return "upcoming";
  if (today <= end) return "open";
  return "closed";
}

function StatusBadge({ start, end }: { start: string; end: string }) {
  const status = getStatus(start, end);
  if (status === "open") return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">접수중</span>;
  if (status === "upcoming") return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">예정</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">마감</span>;
}

function getDDayLabel(start: string, end: string): string | null {
  const status = getStatus(start, end);
  if (status === "closed") return null;
  const refDate = status === "upcoming" ? start : end;
  if (!refDate) return null;
  const today = new Date(new Date().toISOString().slice(0, 10));
  const ref = new Date(refDate);
  const diff = Math.ceil((ref.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (status === "upcoming") {
    return diff === 0 ? "D-Day" : `D-${diff}`;
  }
  // open: 마감까지 남은 일수
  if (diff <= 0) return "D-Day";
  return diff <= 3 ? `D-${diff}` : `${diff}일 남음`;
}

interface Props {
  items: SaleInfo[];
  isLoading: boolean;
  saved: Set<string>;
  onToggleSave: (id: string) => void;
}

export default function SaleInfoTable({ items, isLoading, saved, onToggleSave }: Props) {
  if (isLoading) {
    return <div className="flex items-center justify-center h-48 text-gray-400">데이터 불러오는 중...</div>;
  }
  if (!items.length) {
    return <div className="flex items-center justify-center h-48 text-gray-400">해당 조건의 분양정보가 없습니다.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500 text-left">
            <th className="pb-3 font-medium w-6"></th>
            <th className="pb-3 font-medium">단지명</th>
            <th className="pb-3 font-medium">지역</th>
            <th className="pb-3 font-medium">공급세대</th>
            <th className="pb-3 font-medium">청약기간</th>
            <th className="pb-3 font-medium">당첨발표</th>
            <th className="pb-3 font-medium">입주예정</th>
            <th className="pb-3 font-medium">상태</th>
            <th className="pb-3 font-medium">D-day</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item, i) => {
            const id = item.HOUSE_MANAGE_NO ?? String(i);
            const isSaved = saved.has(id);
            const ddayLabel = getDDayLabel(item.RCEPT_BGNDE, item.RCEPT_ENDDE);
            const status = getStatus(item.RCEPT_BGNDE, item.RCEPT_ENDDE);
            const isImminent = ddayLabel !== null && (ddayLabel === "D-Day" || ddayLabel.startsWith("D-") && parseInt(ddayLabel.slice(2)) <= 3);

            return (
              <tr key={id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3">
                  <button
                    onClick={() => onToggleSave(id)}
                    className="text-lg leading-none transition-colors hover:scale-110"
                    title={isSaved ? "관심 해제" : "관심 단지 추가"}
                  >
                    {isSaved ? "★" : "☆"}
                  </button>
                </td>
                <td className="py-3 font-medium text-gray-900">
                  {item.PBLANC_URL ? (
                    <a href={item.PBLANC_URL} target="_blank" rel="noopener noreferrer"
                      className="hover:text-blue-600 hover:underline">
                      {item.HOUSE_NM}
                    </a>
                  ) : item.HOUSE_NM}
                </td>
                <td className="py-3 text-gray-600">{item.SUBSCRPT_AREA_CODE_NM}</td>
                <td className="py-3 text-gray-600">
                  {item.TOT_SUPLY_HSHLDCO?.toLocaleString() ?? "-"}세대
                </td>
                <td className="py-3 text-gray-600 whitespace-nowrap">
                  {formatDate(item.RCEPT_BGNDE)} ~ {formatDate(item.RCEPT_ENDDE)}
                </td>
                <td className="py-3 text-gray-600 whitespace-nowrap">
                  {formatDate(item.PRZWNER_PRESNATN_DE)}
                </td>
                <td className="py-3 text-gray-600">{formatMvnYm(item.MVN_PREARNGE_YM)}</td>
                <td className="py-3">
                  <StatusBadge start={item.RCEPT_BGNDE} end={item.RCEPT_ENDDE} />
                </td>
                <td className="py-3">
                  {ddayLabel && (
                    <span className={`text-xs font-semibold ${
                      isImminent && status === "open"
                        ? "text-red-600"
                        : status === "upcoming"
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}>
                      {ddayLabel}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
