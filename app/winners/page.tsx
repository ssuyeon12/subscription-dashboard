"use client";

import { Suspense } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import DataFreshness from "@/components/DataFreshness";
import FilterBar from "@/components/FilterBar";
import { fetchSubscription } from "@/lib/api";
import { getDefaultMonthRange } from "@/lib/constants";
import { AreaStat, AgeStat } from "@/types/subscription";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">불러오는 중…</div>}>
      <WinnersPage />
    </Suspense>
  );
}

const defaults = getDefaultMonthRange();

const AGE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"];
const AGE_LABELS = ["30대 이하", "40대", "50대", "60대 이상"];
const AGE_KEYS = ["AGE_30", "AGE_40", "AGE_50", "AGE_60"] as const;

const RSIDE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#f43f5e", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#14b8a6", "#84cc16", "#ef4444", "#f59e0b", "#10b981", "#0ea5e9", "#6366f1"];

interface ApiResult<T> {
  items: T[];
  matchCount?: number;
  cached?: boolean;
  ttlRemaining?: number;
}

function WinnersPage() {
  const [sggCd, setSggCd] = useQueryState("sggCd", parseAsString.withDefault(""));
  const [startMonth, setStartMonth] = useQueryState("start", parseAsString.withDefault(defaults.startMonth));
  const [endMonth, setEndMonth] = useQueryState("end", parseAsString.withDefault(defaults.endMonth));
  const [viewType, setViewType] = useQueryState("view", parseAsString.withDefault("applicant"));

  function handleFilter(key: string, value: string) {
    const v = key === "startMonth" || key === "endMonth" ? value.replace("-", "") : value;
    if (key === "sggCd") setSggCd(v || null);
    else if (key === "startMonth") setStartMonth(v);
    else if (key === "endMonth") setEndMonth(v);
  }

  const toInputMonth = (ym: string) =>
    ym.length >= 6 ? `${ym.slice(0, 4)}-${ym.slice(4, 6)}` : "";

  const statParams = { numOfRows: 100, sggCd, startMonth, endMonth };

  const areaType = viewType === "winner" ? "winner-area" : "applicant-area";
  const ageType = viewType === "winner" ? "winner-age" : "applicant-age";

  const areaQuery = useQuery<ApiResult<AreaStat>>({
    queryKey: ["stat-area", areaType, statParams],
    queryFn: () => fetchSubscription({ ...statParams, type: areaType }),
  });

  const ageQuery = useQuery<ApiResult<AgeStat>>({
    queryKey: ["stat-age", ageType, statParams],
    queryFn: () => fetchSubscription({ ...statParams, type: ageType }),
  });

  const areaItems = areaQuery.data?.items ?? [];
  const ageItems = ageQuery.data?.items ?? [];

  // 지역별 합산 (지역명 기준)
  const regionMap = new Map<string, { name: string; total: number; age30: number; age40: number; age50: number; age60: number }>();
  for (const item of areaItems) {
    const name = item.SUBSCRPT_AREA_CODE_NM || item.SUBSCRPT_AREA_CODE;
    const prev = regionMap.get(name) ?? { name, total: 0, age30: 0, age40: 0, age50: 0, age60: 0 };
    regionMap.set(name, {
      name,
      total: prev.total + (item.AGE_30 ?? 0) + (item.AGE_40 ?? 0) + (item.AGE_50 ?? 0) + (item.AGE_60 ?? 0),
      age30: prev.age30 + (item.AGE_30 ?? 0),
      age40: prev.age40 + (item.AGE_40 ?? 0),
      age50: prev.age50 + (item.AGE_50 ?? 0),
      age60: prev.age60 + (item.AGE_60 ?? 0),
    });
  }
  const regionData = [...regionMap.values()].sort((a, b) => b.total - a.total);

  // 월별 연령 추이 (ageItems)
  const monthMap = new Map<string, { month: string; age30: number; age40: number; age50: number; age60: number }>();
  for (const item of ageItems) {
    const month = item.STAT_DE ?? "";
    const label = month.length >= 6 ? `${month.slice(0, 4)}.${month.slice(4, 6)}` : month;
    const prev = monthMap.get(label) ?? { month: label, age30: 0, age40: 0, age50: 0, age60: 0 };
    monthMap.set(label, {
      month: label,
      age30: prev.age30 + (item.AGE_30 ?? 0),
      age40: prev.age40 + (item.AGE_40 ?? 0),
      age50: prev.age50 + (item.AGE_50 ?? 0),
      age60: prev.age60 + (item.AGE_60 ?? 0),
    });
  }
  const monthData = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  // 전체 연령 비율 (파이차트)
  const totalAge = AGE_KEYS.map((key, i) => ({
    name: AGE_LABELS[i],
    value: ageItems.reduce((s, item) => s + (item[key] ?? 0), 0),
  }));
  const totalAll = totalAge.reduce((s, a) => s + a.value, 0);

  // 요약 KPI
  const totalApplicants = areaItems.reduce(
    (s, i) => s + (i.AGE_30 ?? 0) + (i.AGE_40 ?? 0) + (i.AGE_50 ?? 0) + (i.AGE_60 ?? 0),
    0
  );
  const total30 = areaItems.reduce((s, i) => s + (i.AGE_30 ?? 0), 0);
  const regionCount = regionMap.size;
  const monthCount = monthMap.size;

  const isLoading = areaQuery.isLoading || ageQuery.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">당첨자 통계</h1>
        <p className="text-sm text-gray-500 mt-0.5">청약 신청자 / 당첨자 연령·지역별 현황 · 매월 26일 업데이트</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <FilterBar
          sggCd={sggCd}
          startMonth={toInputMonth(startMonth)}
          endMonth={toInputMonth(endMonth)}
          onChange={handleFilter}
        />
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 h-fit">
          {[
            { value: "applicant", label: "신청자" },
            { value: "winner", label: "당첨자" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setViewType(opt.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewType === opt.value ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 카드 */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-gray-500 mb-1">총 {viewType === "winner" ? "당첨" : "신청"}건수</p>
            <p className="text-2xl font-bold text-gray-900">{totalApplicants.toLocaleString()}</p>
            <p className="text-xs text-gray-400">건</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-xs text-gray-500 mb-1">30대 이하 비율</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalApplicants > 0 ? ((total30 / totalApplicants) * 100).toFixed(1) : "-"}
              <span className="text-base font-normal">%</span>
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
            <p className="text-xs text-gray-500 mb-1">조회 지역수</p>
            <p className="text-2xl font-bold text-gray-900">{regionCount}<span className="text-base font-normal"> 곳</span></p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
            <p className="text-xs text-gray-500 mb-1">조회 기간</p>
            <p className="text-2xl font-bold text-gray-900">{monthCount}<span className="text-base font-normal"> 개월</span></p>
            <DataFreshness cached={areaQuery.data?.cached} ttlRemaining={areaQuery.data?.ttlRemaining} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 월별 연령 누적 바 차트 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-1">월별 연령대 {viewType === "winner" ? "당첨" : "신청"} 추이</h2>
          <p className="text-xs text-gray-400 mb-4">누적 막대 · 월별 연령대별 건수</p>
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">불러오는 중...</div>
          ) : !monthData.length ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip formatter={(v, name) => [Number(v).toLocaleString(), name]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {AGE_KEYS.map((key, i) => (
                  <Bar key={key} dataKey={key} name={AGE_LABELS[i]} stackId="a" fill={AGE_COLORS[i]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 연령 비율 파이차트 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-1">연령대 비율</h2>
          <p className="text-xs text-gray-400 mb-4">전체 기간 합산 기준</p>
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">불러오는 중...</div>
          ) : !totalAll ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">데이터가 없습니다</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={240}>
                <PieChart>
                  <Pie
                    data={totalAge}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {totalAge.map((_, i) => (
                      <Cell key={i} fill={AGE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [Number(v).toLocaleString(), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {totalAge.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: AGE_COLORS[i] }} />
                    <span className="text-sm text-gray-700">{entry.name}</span>
                    <span className="text-sm font-semibold text-gray-900 ml-1">
                      {totalAll > 0 ? ((entry.value / totalAll) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                  합계 {totalAll.toLocaleString()}건
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 지역별 현황 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">지역별 {viewType === "winner" ? "당첨자" : "신청자"} 현황</h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">불러오는 중...</div>
        ) : !regionData.length ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">데이터가 없습니다</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={regionData.slice(0, 10)}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString()} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={45} />
                <Tooltip formatter={(v) => [Number(v).toLocaleString(), "건수"]} />
                <Bar dataKey="total" name="총 건수" radius={[0, 4, 4, 0]}>
                  {regionData.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={RSIDE_COLORS[i % RSIDE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-left">
                    <th className="pb-2 font-medium">지역</th>
                    <th className="pb-2 font-medium text-right">합계</th>
                    <th className="pb-2 font-medium text-right">30대↓</th>
                    <th className="pb-2 font-medium text-right">40대</th>
                    <th className="pb-2 font-medium text-right">50대</th>
                    <th className="pb-2 font-medium text-right">60대↑</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {regionData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-900">{row.name}</td>
                      <td className="py-2 text-right font-semibold text-gray-800">{row.total.toLocaleString()}</td>
                      <td className="py-2 text-right text-blue-600">{row.age30.toLocaleString()}</td>
                      <td className="py-2 text-right text-indigo-600">{row.age40.toLocaleString()}</td>
                      <td className="py-2 text-right text-purple-600">{row.age50.toLocaleString()}</td>
                      <td className="py-2 text-right text-pink-600">{row.age60.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
