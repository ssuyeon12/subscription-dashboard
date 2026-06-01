"use client";

import { SaleInfo } from "@/types/subscription";

function formatDate(d: string) {
  if (!d) return "-";
  // YYYY-MM-DD 형식 그대로 사용
  return d.length === 10 ? d : "-";
}

function formatMvnYm(ym: string) {
  if (!ym || ym.length < 6) return "-";
  return `${ym.slice(0, 4)}.${ym.slice(4, 6)}`;
}

function statusBadge(start: string, end: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (!start || !end) return null;
  if (today < start) return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">예정</span>;
  if (today <= end) return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">접수중</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">마감</span>;
}

interface Props {
  items: SaleInfo[];
  isLoading: boolean;
}

export default function SaleInfoTable({ items, isLoading }: Props) {
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
            <th className="pb-3 font-medium">단지명</th>
            <th className="pb-3 font-medium">지역</th>
            <th className="pb-3 font-medium">공급세대</th>
            <th className="pb-3 font-medium">청약기간</th>
            <th className="pb-3 font-medium">당첨발표</th>
            <th className="pb-3 font-medium">입주예정</th>
            <th className="pb-3 font-medium">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item, i) => (
            <tr key={item.HOUSE_MANAGE_NO ?? i} className="hover:bg-gray-50 transition-colors">
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
              <td className="py-3">{statusBadge(item.RCEPT_BGNDE, item.RCEPT_ENDDE)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
