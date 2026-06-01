"use client";

import { Suspense, useState, useEffect } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import FilterBar from "@/components/FilterBar";
import SaleInfoTable from "@/components/SaleInfoTable";
import CompetitionRankList from "@/components/CompetitionRankList";
import UnitDetailPanel from "@/components/UnitDetailPanel";
import ImminentList from "@/components/ImminentList";
import DataFreshness from "@/components/DataFreshness";
import { fetchSaleInfo, fetchCompetition } from "@/lib/api";
import { getDefaultMonthRange, yyyymmToDate } from "@/lib/constants";
import { SaleInfo, CompetitionRate } from "@/types/subscription";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">불러오는 중…</div>}>
      <Dashboard />
    </Suspense>
  );
}

interface ApiResult<T> {
  items: T[];
  matchCount?: number;
  totalCount?: number;
  cached?: boolean;
  ttlRemaining?: number;
}

const defaults = getDefaultMonthRange();

function rateColor(rate: number): string {
  if (rate >= 100) return "text-red-500";
  if (rate >= 40) return "text-orange-500";
  if (rate >= 20) return "text-amber-500";
  if (rate >= 10) return "text-blue-500";
  return "text-teal-600";
}

function getStatus(start: string, end: string): "open" | "upcoming" | "closed" {
  const today = new Date().toISOString().slice(0, 10);
  if (!start || !end) return "closed";
  if (today < start) return "upcoming";
  if (today <= end) return "open";
  return "closed";
}

function Dashboard() {
  const [sggCd, setSggCd] = useQueryState("sggCd", parseAsString.withDefault(""));
  const [startMonth, setStartMonth] = useQueryState("start", parseAsString.withDefault(defaults.startMonth));
  const [endMonth, setEndMonth] = useQueryState("end", parseAsString.withDefault(defaults.endMonth));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("saved-houses");
      if (raw) setSaved(new Set(JSON.parse(raw) as string[]));
    } catch {
      // ignore
    }
  }, []);

  function handleToggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("saved-houses", JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function handleFilter(key: string, value: string) {
    const v = key === "startMonth" || key === "endMonth" ? value.replace("-", "") : value;
    if (key === "sggCd") setSggCd(v || null);
    else if (key === "startMonth") setStartMonth(v);
    else if (key === "endMonth") setEndMonth(v);
  }

  const toInputMonth = (ym: string) =>
    ym.length >= 6 ? `${ym.slice(0, 4)}-${ym.slice(4, 6)}` : "";

  const saleParams = {
    numOfRows: 30,
    sggCd,
    startDate: yyyymmToDate(startMonth, false),
    endDate: yyyymmToDate(endMonth, true),
  };

  const saleQuery = useQuery<ApiResult<SaleInfo>>({
    queryKey: ["saleinfo", saleParams],
    queryFn: () => fetchSaleInfo(saleParams),
  });

  // sggCd를 queryKey에 포함 → 지역 변경 시 재조회
  const compQuery = useQuery<ApiResult<CompetitionRate>>({
    queryKey: ["competition", sggCd],
    queryFn: () => fetchCompetition({ numOfRows: 100, sggCd }),
    staleTime: 1000 * 60 * 5,
  });

  const saleItems: SaleInfo[] = saleQuery.data?.items ?? [];
  const compItems: CompetitionRate[] = compQuery.data?.items ?? [];

  const today = new Date().toISOString().slice(0, 10);

  // KPI: 접수중 단지 수
  const openCount = saleItems.filter((it) => getStatus(it.RCEPT_BGNDE, it.RCEPT_ENDDE) === "open").length;
  // KPI: 예정 단지 수
  const upcomingCount = saleItems.filter((it) => getStatus(it.RCEPT_BGNDE, it.RCEPT_ENDDE) === "upcoming").length;

  // KPI: 최저 경쟁률 (1순위 해당지역)
  const rank1Local = compItems.filter(
    (it) => it.SUBSCRPT_RANK_CODE === 1 && it.RESIDE_SECD === "01" && it.CMPET_RATE !== "-"
  );

  let lowestItem: { name: string; rate: number } | null = null;
  let avgRate: number | null = null;

  if (rank1Local.length > 0) {
    // group by house
    const byHouse = new Map<string, { name: string; rate: number }>();
    for (const it of rank1Local) {
      const key = String(it.HOUSE_MANAGE_NO);
      const rate = parseFloat(it.CMPET_RATE);
      if (!isNaN(rate)) {
        const existing = byHouse.get(key);
        if (!existing || rate < existing.rate) {
          byHouse.set(key, { name: it.HOUSE_NM ?? `단지 ${key}`, rate });
        }
      }
    }
    const entries = Array.from(byHouse.values());
    entries.sort((a, b) => a.rate - b.rate);
    lowestItem = entries[0] ?? null;

    const allRates = rank1Local.map((it) => parseFloat(it.CMPET_RATE)).filter((v) => !isNaN(v));
    if (allRates.length > 0) {
      avgRate = allRates.reduce((a, b) => a + b, 0) / allRates.length;
    }
  }

  // Selected unit items
  const selectedItems = selectedKey
    ? compItems.filter((it) => String(it.HOUSE_MANAGE_NO) === selectedKey)
    : [];
  const selectedName = selectedItems[0]?.HOUSE_NM ?? selectedKey ?? "";

  const saleCount = saleQuery.data?.matchCount ?? saleItems.length;

  const kpiCards = [
    {
      label: "접수중",
      value: openCount,
      sub: "현재 청약 가능",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "청약 예정",
      value: upcomingCount,
      sub: "곧 시작 예정",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "최저 경쟁률",
      value: lowestItem ? `${lowestItem.rate.toFixed(1)}:1` : "-",
      sub: lowestItem?.name ?? "데이터 없음",
      color: lowestItem ? rateColor(lowestItem.rate) : "text-gray-400",
      bg: "bg-white",
    },
    {
      label: "전국 평균경쟁률",
      value: avgRate !== null ? `${avgRate.toFixed(1)}:1` : "-",
      sub: "1순위 해당지역 평균",
      color: avgRate !== null ? rateColor(avgRate) : "text-gray-400",
      bg: "bg-white",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <FilterBar
        sggCd={sggCd}
        startMonth={toInputMonth(startMonth)}
        endMonth={toInputMonth(endMonth)}
        onChange={handleFilter}
      />

      {/* KPI 카드 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className={`rounded-xl shadow-sm border border-gray-100 p-4 ${card.bg}`}>
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>
              {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
            </p>
            <p className="text-xs text-gray-400 mt-1 truncate">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* 2열 그리드: 경쟁률 랭킹 | 단지상세 + 임박단지 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌: 경쟁률 랭킹 */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-gray-700">경쟁률 Top 10</h2>
            <DataFreshness
              cached={compQuery.data?.cached}
              ttlRemaining={compQuery.data?.ttlRemaining}
            />
          </div>
          <p className="text-xs text-gray-400 mb-4">1순위 해당지역 기준 · 단지 클릭 시 상세 확인</p>
          <CompetitionRankList
            items={compItems}
            isLoading={compQuery.isLoading}
            selected={selectedKey}
            onSelect={setSelectedKey}
          />
        </section>

        {/* 우: 단지 상세 + 임박단지 */}
        <div className="flex flex-col gap-4">
          {/* 선택 단지 상세 */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
            <h2 className="text-base font-semibold text-gray-700 mb-3">선택 단지 주택형별 경쟁률</h2>
            <UnitDetailPanel
              items={selectedItems}
              houseName={selectedName}
              isLoading={compQuery.isLoading}
            />
          </section>

          {/* 접수 임박 단지 */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-700">접수 임박 단지</h2>
              <DataFreshness
                cached={saleQuery.data?.cached}
                ttlRemaining={saleQuery.data?.ttlRemaining}
              />
            </div>
            <ImminentList
              items={saleItems}
              isLoading={saleQuery.isLoading}
            />
          </section>
        </div>
      </div>

      {/* 분양정보 테이블 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-700">APT 분양정보 목록</h2>
            <p className="text-xs text-gray-400">모집공고일 기준 · 단지명 클릭 시 청약홈 이동 · ★ 클릭으로 관심 단지 저장</p>
          </div>
          <div className="flex items-center gap-3">
            <DataFreshness
              cached={saleQuery.data?.cached}
              ttlRemaining={saleQuery.data?.ttlRemaining}
            />
            <span className="text-xs text-gray-400">총 {saleCount.toLocaleString()}건</span>
          </div>
        </div>
        <SaleInfoTable
          items={saleItems}
          isLoading={saleQuery.isLoading}
          saved={saved}
          onToggleSave={handleToggleSave}
        />
      </section>

      <footer className="text-center text-xs text-gray-400 pt-4 pb-8">
        데이터 출처: 공공데이터포털 한국부동산원 청약홈 API ·
        분양정보 15분 / 경쟁률 5분 캐시
      </footer>
    </div>
  );
}
