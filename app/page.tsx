"use client";

import { Suspense } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import FilterBar from "@/components/FilterBar";
import SaleInfoTable from "@/components/SaleInfoTable";
import CompetitionChart from "@/components/CompetitionChart";
import AgeDistributionChart from "@/components/SpecialSupplyChart";
import WinnerStats from "@/components/WinnerStats";
import DataFreshness from "@/components/DataFreshness";
import { fetchSaleInfo, fetchCompetition, fetchSubscription } from "@/lib/api";
import { getDefaultMonthRange, yyyymmToDate } from "@/lib/constants";
import { SaleInfo, CompetitionRate, AreaStat, AgeStat } from "@/types/subscription";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">불러오는 중…</div>}>
      <Dashboard />
    </Suspense>
  );
}

interface ApiResult {
  items: unknown[];
  matchCount?: number;
  totalCount?: number;
  cached?: boolean;
  ttlRemaining?: number;
}

const defaults = getDefaultMonthRange();

function Dashboard() {
  const [sggCd, setSggCd] = useQueryState("sggCd", parseAsString.withDefault(""));
  const [startMonth, setStartMonth] = useQueryState("start", parseAsString.withDefault(defaults.startMonth));
  const [endMonth, setEndMonth] = useQueryState("end", parseAsString.withDefault(defaults.endMonth));

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

  const statParams = {
    numOfRows: 50,
    sggCd,
    startMonth,
    endMonth,
  };

  const saleQuery = useQuery<ApiResult & { items: SaleInfo[] }>({
    queryKey: ["saleinfo", saleParams],
    queryFn: () => fetchSaleInfo(saleParams),
  });

  const compQuery = useQuery<ApiResult & { items: CompetitionRate[] }>({
    queryKey: ["competition"],
    queryFn: () => fetchCompetition({ numOfRows: 50 }),
    staleTime: 1000 * 60 * 5,
  });

  const areaStatQuery = useQuery<ApiResult & { items: AreaStat[] }>({
    queryKey: ["subscription-area", statParams],
    queryFn: () => fetchSubscription({ ...statParams, type: "applicant-area" }),
  });

  const ageStatQuery = useQuery<ApiResult & { items: AgeStat[] }>({
    queryKey: ["subscription-age", statParams],
    queryFn: () => fetchSubscription({ ...statParams, type: "applicant-age" }),
  });

  const saleCount = saleQuery.data?.matchCount ?? saleQuery.data?.items?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <FilterBar
        sggCd={sggCd}
        startMonth={toInputMonth(startMonth)}
        endMonth={toInputMonth(endMonth)}
        onChange={handleFilter}
      />

      {/* 요약 카드 */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-base font-semibold text-gray-700">청약 신청 현황 요약</h2>
          <DataFreshness
            cached={areaStatQuery.data?.cached}
            ttlRemaining={areaStatQuery.data?.ttlRemaining}
          />
        </div>
        <WinnerStats
          items={areaStatQuery.data?.items ?? []}
          isLoading={areaStatQuery.isLoading}
        />
      </section>

      {/* 차트 2개 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-gray-700">경쟁률 Top 10</h2>
            <DataFreshness
              cached={compQuery.data?.cached}
              ttlRemaining={compQuery.data?.ttlRemaining}
            />
          </div>
          <p className="text-xs text-gray-400 mb-4">1순위 해당지역 기준 · 최근 접수 완료 단지</p>
          <CompetitionChart
            items={compQuery.data?.items ?? []}
            isLoading={compQuery.isLoading}
          />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-gray-700">연령별 청약 신청 현황</h2>
            <DataFreshness
              cached={ageStatQuery.data?.cached}
              ttlRemaining={ageStatQuery.data?.ttlRemaining}
            />
          </div>
          <p className="text-xs text-gray-400 mb-4">월별 누적 · 매월 26일 업데이트</p>
          <AgeDistributionChart
            items={ageStatQuery.data?.items ?? []}
            isLoading={ageStatQuery.isLoading}
          />
        </section>
      </div>

      {/* 분양정보 테이블 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-700">APT 분양정보 목록</h2>
            <p className="text-xs text-gray-400">모집공고일 기준 · 단지명 클릭 시 청약홈 이동</p>
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
          items={saleQuery.data?.items ?? []}
          isLoading={saleQuery.isLoading}
        />
      </section>

      <footer className="text-center text-xs text-gray-400 pt-4 pb-8">
        데이터 출처: 공공데이터포털 한국부동산원 청약홈 API ·
        분양정보 15분 / 경쟁률 5분 / 통계 60분 캐시
      </footer>
    </div>
  );
}
