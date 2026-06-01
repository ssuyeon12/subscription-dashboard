"use client";

import { SaleInfo } from "@/types/subscription";

function formatDate(d: string) {
  if (!d || d.length < 8) return d ?? "-";
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
}

function statusBadge(start: string, end: string) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
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
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        데이터 불러오는 중...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        해당 조건의 분양정보가 없습니다.
      </div>
    );
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
            <tr key={item.houseManageNo ?? i} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 font-medium text-gray-900">{item.houseName}</td>
              <td className="py-3 text-gray-600">{item.sggNm}</td>
              <td className="py-3 text-gray-600">{item.totSuplyHshldco?.toLocaleString() ?? "-"}세대</td>
              <td className="py-3 text-gray-600">
                {formatDate(item.rceptBgnde)} ~ {formatDate(item.rceptEndde)}
              </td>
              <td className="py-3 text-gray-600">{formatDate(item.przwnerPresnatnDe)}</td>
              <td className="py-3 text-gray-600">{item.mvnPrearnge ?? "-"}</td>
              <td className="py-3">{statusBadge(item.rceptBgnde, item.rceptEndde)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
