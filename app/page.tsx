"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FilterBar from "@/components/FilterBar";
import SaleInfoTable from "@/components/SaleInfoTable";
import CompetitionChart from "@/components/CompetitionChart";
import SpecialSupplyChart from "@/components/SpecialSupplyChart";
import WinnerStats from "@/components/WinnerStats";
import { fetchSaleInfo, fetchCompetition, fetchSubscription } from "@/lib/api";
import { getDefaultMonthRange } from "@/lib/constants";
import { SaleInfo, CompetitionRate, SpecialSupply, WinnerInfo } from "@/types/subscription";

const defaults = getDefaultMonthRange();

export default function Dashboard() {
  const [filters, setFilters] = useState({
    sggCd: "",
    startMonth: defaults.startMonth,
    endMonth: defaults.endMonth,
  });

  function handleFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const params = { ...filters, numOfRows: 50 };

  const saleQuery = useQuery<{ items: SaleInfo[] }>({
    queryKey: ["saleinfo", params],
    queryFn: () => fetchSaleInfo(params),
  });

  const compQuery = useQuery<{ items: CompetitionRate[] }>({
    queryKey: ["competition", params],
    queryFn: () => fetchCompetition(params),
  });

  const subQuery = useQuery<{ items: (SpecialSupply & WinnerInfo)[] }>({
    queryKey: ["subscription", params],
    queryFn: () => fetchSubscription(params),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">청약 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">한국부동산원 청약홈 공공 API 기반 실시간 청약 정보</p>
      </div>

      <FilterBar
        sggCd={filters.sggCd}
        startMonth={filters.startMonth ? `${filters.startMonth.slice(0, 4)}-${filters.startMonth.slice(4)}` : ""}
        endMonth={filters.endMonth ? `${filters.endMonth.slice(0, 4)}-${filters.endMonth.slice(4)}` : ""}
        onChange={handleFilter}
      />

      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">청약 현황 요약</h2>
        <WinnerStats
          items={(subQuery.data?.items ?? []) as WinnerInfo[]}
          isLoading={subQuery.isLoading}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">단지별 경쟁률 Top 10</h2>
          <CompetitionChart
            items={compQuery.data?.items ?? []}
            isLoading={compQuery.isLoading}
          />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">특별공급 유형별 신청 현황</h2>
          <SpecialSupplyChart
            items={(subQuery.data?.items ?? []) as SpecialSupply[]}
            isLoading={subQuery.isLoading}
          />
        </section>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">분양정보 목록</h2>
          <span className="text-xs text-gray-400">총 {saleQuery.data?.items?.length ?? 0}건</span>
        </div>
        <SaleInfoTable
          items={saleQuery.data?.items ?? []}
          isLoading={saleQuery.isLoading}
        />
      </section>

      <footer className="text-center text-xs text-gray-400 pt-4">
        데이터 출처: 공공데이터포털 한국부동산원 청약홈 API · 1시간마다 갱신
      </footer>
    </div>
  );
}
