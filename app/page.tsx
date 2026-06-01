"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FilterBar from "@/components/FilterBar";
import SaleInfoTable from "@/components/SaleInfoTable";
import CompetitionChart from "@/components/CompetitionChart";
import AgeDistributionChart from "@/components/SpecialSupplyChart";
import WinnerStats from "@/components/WinnerStats";
import { fetchSaleInfo, fetchCompetition, fetchSubscription } from "@/lib/api";
import { getDefaultMonthRange, yyyymmToDate } from "@/lib/constants";
import { SaleInfo, CompetitionRate, AreaStat, AgeStat } from "@/types/subscription";

const defaults = getDefaultMonthRange();

export default function Dashboard() {
  const [filters, setFilters] = useState({
    sggCd: "",
    startMonth: defaults.startMonth, // YYYYMM
    endMonth: defaults.endMonth,     // YYYYMM
  });

  function handleFilter(key: string, value: string) {
    // FilterBar는 YYYY-MM 형식을 반환 → YYYYMM으로 변환
    const v = key === "startMonth" || key === "endMonth"
      ? value.replace("-", "")
      : value;
    setFilters((prev) => ({ ...prev, [key]: v }));
  }

  // 분양정보: 모집공고일 기준 날짜 범위 (YYYY-MM-DD)
  const saleParams = {
    numOfRows: 30,
    sggCd: filters.sggCd,
    startDate: yyyymmToDate(filters.startMonth, false),
    endDate: yyyymmToDate(filters.endMonth, true),
  };

  // 통계 API: YYYYMM 형식
  const statParams = {
    numOfRows: 50,
    sggCd: filters.sggCd,
    startMonth: filters.startMonth,
    endMonth: filters.endMonth,
  };

  const saleQuery = useQuery<{ items: SaleInfo[] }>({
    queryKey: ["saleinfo", saleParams],
    queryFn: () => fetchSaleInfo(saleParams),
  });

  const compQuery = useQuery<{ items: CompetitionRate[] }>({
    queryKey: ["competition"],
    queryFn: () => fetchCompetition({ numOfRows: 50 }),
    staleTime: 1000 * 60 * 60, // 1시간 캐시
  });

  // 지역별 신청자 통계 (WinnerStats용)
  const areaStatQuery = useQuery<{ items: AreaStat[] }>({
    queryKey: ["subscription-area", statParams],
    queryFn: () => fetchSubscription({ ...statParams, type: "applicant-area" }),
  });

  // 연령별 신청자 통계 (AgeDistributionChart용)
  const ageStatQuery = useQuery<{ items: AgeStat[] }>({
    queryKey: ["subscription-age", statParams],
    queryFn: () => fetchSubscription({ ...statParams, type: "applicant-age" }),
  });

  const toInputMonth = (ym: string) =>
    ym.length >= 6 ? `${ym.slice(0, 4)}-${ym.slice(4, 6)}` : "";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">청약 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">
          한국부동산원 청약홈 공공 API 기반 · 분양정보 / 경쟁률 / 신청·당첨 통계
        </p>
      </div>

      {/* 필터 */}
      <FilterBar
        sggCd={filters.sggCd}
        startMonth={toInputMonth(filters.startMonth)}
        endMonth={toInputMonth(filters.endMonth)}
        onChange={handleFilter}
      />

      {/* 요약 카드 */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">청약 신청 현황 요약</h2>
        <WinnerStats
          items={areaStatQuery.data?.items ?? []}
          isLoading={areaStatQuery.isLoading}
        />
      </section>

      {/* 차트 2개 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-1">경쟁률 Top 10</h2>
          <p className="text-xs text-gray-400 mb-4">1순위 해당지역 기준 · 최근 접수 완료 단지</p>
          <CompetitionChart
            items={compQuery.data?.items ?? []}
            isLoading={compQuery.isLoading}
          />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-1">연령별 청약 신청 현황</h2>
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
          <span className="text-xs text-gray-400">
            총 {saleQuery.data?.items?.length ?? 0}건
          </span>
        </div>
        <SaleInfoTable
          items={saleQuery.data?.items ?? []}
          isLoading={saleQuery.isLoading}
        />
      </section>

      <footer className="text-center text-xs text-gray-400 pt-4 pb-8">
        데이터 출처: 공공데이터포털 한국부동산원 청약홈 API (ApplyhomeInfoDetailSvc / ApplyhomeInfoCmpetRtSvc / ApplyhomeStatSvc) · 1시간 캐시
      </footer>
    </div>
  );
}
