"use client";

import { Suspense } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import DataFreshness from "@/components/DataFreshness";
import { fetchCompetition } from "@/lib/api";
import { CompetitionRate } from "@/types/subscription";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis,
} from "recharts";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">불러오는 중…</div>}>
      <CompetitionsPage />
    </Suspense>
  );
}

const RANK_COLORS: Record<string, string[]> = {
  "1": ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#06b6d4"],
  "2": ["#93c5fd", "#a5b4fc", "#c4b5fd", "#d8b4fe", "#f9a8d4"],
};

const RESIDE_LABELS: Record<string, string> = {
  "01": "해당지역",
  "02": "기타지역",
  "03": "기타경기",
};

interface ApiResult {
  items: CompetitionRate[];
  matchCount?: number;
  cached?: boolean;
  ttlRemaining?: number;
}

function CompetitionsPage() {
  const [rankFilter, setRankFilter] = useQueryState("rank", parseAsString.withDefault("1"));
  const [resideFilter, setResideFilter] = useQueryState("reside", parseAsString.withDefault("01"));

  const { data, isLoading } = useQuery<ApiResult>({
    queryKey: ["competition"],
    queryFn: () => fetchCompetition({ numOfRows: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  const allItems = data?.items ?? [];

  // 필터링
  const filtered = allItems.filter((item) => {
    const rankMatch = rankFilter ? String(item.SUBSCRPT_RANK_CODE) === rankFilter : true;
    const resideMatch = resideFilter ? item.RESIDE_SECD === resideFilter : true;
    return rankMatch && resideMatch;
  });

  // 상위 15개 정렬
  const sorted = [...filtered]
    .map((item) => ({
      ...item,
      rateNum: parseFloat(item.CMPET_RATE) || 0,
      label: item.HOUSE_NM
        ? `${item.HOUSE_NM}(${item.HOUSE_TY ?? "-"})`
        : `No.${String(item.HOUSE_MANAGE_NO).slice(-4)}(${item.HOUSE_TY ?? "-"})`,
    }))
    .filter((item) => item.rateNum > 0)
    .sort((a, b) => b.rateNum - a.rateNum)
    .slice(0, 15);

  // 주택형별 세대수 vs 경쟁률 산점도 데이터
  const scatterData = filtered
    .filter((item) => parseFloat(item.CMPET_RATE) > 0 && Number(item.SUPLY_HSHLDCO) > 0)
    .map((item) => ({
      x: Number(item.SUPLY_HSHLDCO),
      y: parseFloat(item.CMPET_RATE),
      name: `${String(item.HOUSE_MANAGE_NO).slice(-4)} ${item.HOUSE_TY}`,
    }));

  // 통계
  const rates = filtered.map((i) => parseFloat(i.CMPET_RATE)).filter((r) => r > 0);
  const avgRate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const maxRate = rates.length ? Math.max(...rates) : 0;
  const totalReq = filtered.reduce((s, i) => s + (Number(i.REQ_CNT) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">경쟁률 현황</h1>
        <p className="text-sm text-gray-500 mt-0.5">접수 완료 단지 기준 · 주택형별 경쟁률</p>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">순위</label>
          <div className="flex gap-1">
            {["1", "2"].map((r) => (
              <button
                key={r}
                onClick={() => setRankFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  rankFilter === r ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {r}순위
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">거주지역</label>
          <div className="flex gap-1">
            {Object.entries(RESIDE_LABELS).map(([code, name]) => (
              <button
                key={code}
                onClick={() => setResideFilter(code)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  resideFilter === code ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto">
          <DataFreshness cached={data?.cached} ttlRemaining={data?.ttlRemaining} />
        </div>
      </div>

      {/* 요약 카드 */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-gray-500 mb-1">평균 경쟁률</p>
            <p className="text-2xl font-bold text-gray-900">{avgRate.toFixed(1)}<span className="text-base font-normal">:1</span></p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
            <p className="text-xs text-gray-500 mb-1">최고 경쟁률</p>
            <p className="text-2xl font-bold text-gray-900">{maxRate.toLocaleString()}<span className="text-base font-normal">:1</span></p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-xs text-gray-500 mb-1">총 신청건수</p>
            <p className="text-2xl font-bold text-gray-900">{totalReq.toLocaleString()}<span className="text-sm font-normal text-gray-500"> 건</span></p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 경쟁률 바 차트 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-1">
            {rankFilter}순위 {RESIDE_LABELS[resideFilter]} Top {sorted.length}
          </h2>
          <p className="text-xs text-gray-400 mb-4">주택형별 경쟁률 (높은 순)</p>
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">불러오는 중...</div>
          ) : !sorted.length ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={sorted} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}:1`} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toLocaleString()}:1`, "경쟁률"]}
                  labelFormatter={(label) => `주택형: ${label}`}
                />
                <Bar dataKey="rateNum" name="경쟁률" radius={[4, 4, 0, 0]}>
                  {sorted.map((_, i) => (
                    <Cell key={i} fill={(RANK_COLORS[rankFilter] ?? RANK_COLORS["1"])[i % 10]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 세대수 vs 경쟁률 산점도 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-1">공급세대수 vs 경쟁률</h2>
          <p className="text-xs text-gray-400 mb-4">X: 공급세대수, Y: 경쟁률 — 점 크기는 세대수 비례</p>
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">불러오는 중...</div>
          ) : !scatterData.length ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="x" name="공급세대수" tick={{ fontSize: 11 }} label={{ value: "공급세대수", position: "insideBottom", offset: -10, fontSize: 11 }} />
                <YAxis dataKey="y" name="경쟁률" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}:1`} />
                <ZAxis dataKey="x" range={[40, 400]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-sm">
                        <p className="font-medium text-gray-800">{d.name}</p>
                        <p className="text-gray-600">공급: {d.x?.toLocaleString()}세대</p>
                        <p className="text-gray-600">경쟁률: {d.y}:1</p>
                      </div>
                    );
                  }}
                />
                <Scatter data={scatterData} fill="#6366f1" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 전체 목록 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          경쟁률 목록 <span className="text-sm font-normal text-gray-400">({filtered.length}건)</span>
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">불러오는 중...</div>
        ) : !filtered.length ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">데이터가 없습니다</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-left">
                  <th className="pb-3 font-medium">단지명</th>
                  <th className="pb-3 font-medium">주택형</th>
                  <th className="pb-3 font-medium text-right pr-4">공급세대</th>
                  <th className="pb-3 font-medium">청약순위</th>
                  <th className="pb-3 font-medium">거주구분</th>
                  <th className="pb-3 font-medium text-right pr-4">접수건수</th>
                  <th className="pb-3 font-medium text-right">경쟁률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...filtered]
                  .sort((a, b) => (parseFloat(b.CMPET_RATE) || 0) - (parseFloat(a.CMPET_RATE) || 0))
                  .map((item, i) => (
                    <tr key={`${item.HOUSE_MANAGE_NO}-${item.HOUSE_TY}-${item.RESIDE_SECD}-${i}`}
                      className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 text-gray-900 font-medium">
                        {item.HOUSE_NM
                          ? item.HOUSE_NM
                          : <span className="font-mono text-xs text-gray-400">{item.HOUSE_MANAGE_NO}</span>}
                      </td>
                      <td className="py-2.5 text-gray-900 font-medium">{item.HOUSE_TY}</td>
                      <td className="py-2.5 text-gray-600 text-right pr-4">{Number(item.SUPLY_HSHLDCO).toLocaleString()}</td>
                      <td className="py-2.5 text-gray-600">{item.SUBSCRPT_RANK_CODE}순위</td>
                      <td className="py-2.5 text-gray-600">{RESIDE_LABELS[item.RESIDE_SECD] ?? item.RESIDE_SECD}</td>
                      <td className="py-2.5 text-gray-600 text-right pr-4">{Number(item.REQ_CNT).toLocaleString()}</td>
                      <td className="py-2.5 text-right">
                        <span className={`font-semibold ${
                          parseFloat(item.CMPET_RATE) > 100 ? "text-red-600" :
                          parseFloat(item.CMPET_RATE) > 10 ? "text-orange-500" : "text-gray-700"
                        }`}>
                          {item.CMPET_RATE}:1
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
