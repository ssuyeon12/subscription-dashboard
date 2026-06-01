"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { CompetitionRate } from "@/types/subscription";

interface Props {
  items: CompetitionRate[];
  isLoading: boolean;
}

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"];

// 단지명이 길면 잘라서 표시
function shortName(name: string) {
  // "단지명(주택형)" 에서 단지명만 최대 6자
  const match = name.match(/^(.+)\(([^)]+)\)$/);
  if (match) {
    const nm = match[1].length > 6 ? match[1].slice(-6) : match[1];
    return `${nm}\n(${match[2]})`;
  }
  return name.length > 10 ? name.slice(-10) : name;
}

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
      shortLabel: item.HOUSE_NM
        ? shortName(`${item.HOUSE_NM}(${item.HOUSE_TY ?? "-"})`)
        : `No.${String(item.HOUSE_MANAGE_NO).slice(-4)}\n(${item.HOUSE_TY ?? "-"})`,
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

  const maxRate = Math.max(...aggregated.map((a) => a.rate));

  return (
    <div className="space-y-3">
      {/* 바 차트 */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={aggregated} margin={{ top: 24, right: 16, left: 0, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            angle={-35}
            textAnchor="end"
            interval={0}
            tickFormatter={(v) => {
              const match = v.match(/^(.+)\(([^)]+)\)$/);
              if (match) {
                const nm = match[1].length > 7 ? "…" + match[1].slice(-6) : match[1];
                return `${nm}(${match[2]})`;
              }
              return v;
            }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}:1`}
            domain={[0, Math.ceil(maxRate * 1.15)]}
          />
          <Tooltip
            formatter={(v) => [`${Number(v).toFixed(2)}:1`, "경쟁률"]}
            labelFormatter={(label) => {
              const item = aggregated.find((a) => a.name === label);
              return item ? item.fullName : label;
            }}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="rate" name="경쟁률" radius={[4, 4, 0, 0]} minPointSize={4}>
            <LabelList
              dataKey="rate"
              position="top"
              formatter={(v) => `${Number(v).toFixed(1)}:1`}
              style={{ fontSize: 10, fill: "#374151", fontWeight: 600 }}
            />
            {aggregated.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* 순위 테이블 (값이 작아도 명확히 보이도록) */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="pb-1.5 text-left font-medium w-5">#</th>
              <th className="pb-1.5 text-left font-medium">단지명 (주택형)</th>
              <th className="pb-1.5 text-right font-medium">공급</th>
              <th className="pb-1.5 text-right font-medium">접수</th>
              <th className="pb-1.5 text-right font-medium pr-1">경쟁률</th>
            </tr>
          </thead>
          <tbody>
            {aggregated.map((item, i) => {
              const original = rank1.find(
                (r) =>
                  `${r.HOUSE_MANAGE_NO}-${r.HOUSE_TY}` === item.key
              );
              return (
                <tr key={item.key} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-1.5 text-gray-400">{i + 1}</td>
                  <td className="py-1.5 text-gray-800 font-medium">
                    {item.fullName}
                    <span className="text-gray-400 font-normal ml-1">
                      ({original?.HOUSE_TY ?? "-"})
                    </span>
                  </td>
                  <td className="py-1.5 text-right text-gray-600">
                    {Number(original?.SUPLY_HSHLDCO ?? 0).toLocaleString()}
                  </td>
                  <td className="py-1.5 text-right text-gray-600">
                    {Number(original?.REQ_CNT ?? 0).toLocaleString()}
                  </td>
                  <td className="py-1.5 text-right pr-1">
                    <span className={`font-bold ${
                      item.rate >= 10 ? "text-red-500" :
                      item.rate >= 3  ? "text-orange-500" : "text-gray-700"
                    }`}>
                      {item.rate.toFixed(2)}:1
                    </span>
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
