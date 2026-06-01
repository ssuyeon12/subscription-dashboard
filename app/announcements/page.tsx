"use client";

import { Suspense } from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import FilterBar from "@/components/FilterBar";
import DataFreshness from "@/components/DataFreshness";
import { fetchSaleInfo } from "@/lib/api";
import { getDefaultMonthRange, yyyymmToDate, SGG_CODES } from "@/lib/constants";
import { SaleInfo } from "@/types/subscription";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">불러오는 중…</div>}>
      <AnnouncementsPage />
    </Suspense>
  );
}

const defaults = getDefaultMonthRange();

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "upcoming", label: "예정" },
  { value: "open", label: "접수중" },
  { value: "closed", label: "마감" },
];

function getStatus(start: string, end: string): "upcoming" | "open" | "closed" | "unknown" {
  const today = new Date().toISOString().slice(0, 10);
  if (!start || !end) return "unknown";
  if (today < start) return "upcoming";
  if (today <= end) return "open";
  return "closed";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "upcoming") return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">예정</span>;
  if (status === "open") return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">접수중</span>;
  if (status === "closed") return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">마감</span>;
  return null;
}

function formatDate(d: string) {
  return d?.length === 10 ? d : "-";
}

function formatMvnYm(ym: string) {
  if (!ym || ym.length < 6) return "-";
  return `${ym.slice(0, 4)}.${ym.slice(4, 6)}`;
}

interface ApiResult {
  items: SaleInfo[];
  matchCount?: number;
  cached?: boolean;
  ttlRemaining?: number;
}

function AnnouncementsPage() {
  const [sggCd, setSggCd] = useQueryState("sggCd", parseAsString.withDefault(""));
  const [startMonth, setStartMonth] = useQueryState("start", parseAsString.withDefault(defaults.startMonth));
  const [endMonth, setEndMonth] = useQueryState("end", parseAsString.withDefault(defaults.endMonth));
  const [statusFilter, setStatusFilter] = useQueryState("status", parseAsString.withDefault(""));
  const [perPage] = useQueryState("per", parseAsInteger.withDefault(50));

  function handleFilter(key: string, value: string) {
    const v = key === "startMonth" || key === "endMonth" ? value.replace("-", "") : value;
    if (key === "sggCd") setSggCd(v || null);
    else if (key === "startMonth") setStartMonth(v);
    else if (key === "endMonth") setEndMonth(v);
  }

  const toInputMonth = (ym: string) =>
    ym.length >= 6 ? `${ym.slice(0, 4)}-${ym.slice(4, 6)}` : "";

  const saleParams = {
    numOfRows: perPage,
    sggCd,
    startDate: yyyymmToDate(startMonth, false),
    endDate: yyyymmToDate(endMonth, true),
  };

  const { data, isLoading } = useQuery<ApiResult>({
    queryKey: ["saleinfo", saleParams],
    queryFn: () => fetchSaleInfo(saleParams),
  });

  const allItems = data?.items ?? [];
  const items = statusFilter
    ? allItems.filter((item) => getStatus(item.RCEPT_BGNDE, item.RCEPT_ENDDE) === statusFilter)
    : allItems;

  const openCount = allItems.filter((i) => getStatus(i.RCEPT_BGNDE, i.RCEPT_ENDDE) === "open").length;
  const upcomingCount = allItems.filter((i) => getStatus(i.RCEPT_BGNDE, i.RCEPT_ENDDE) === "upcoming").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">APT 분양정보</h1>
        <p className="text-sm text-gray-500 mt-0.5">모집공고일 기준 · 단지명 클릭 시 청약홈 이동</p>
      </div>

      <FilterBar
        sggCd={sggCd}
        startMonth={toInputMonth(startMonth)}
        endMonth={toInputMonth(endMonth)}
        onChange={handleFilter}
      />

      {/* 요약 배지 */}
      {!isLoading && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-600">
            전체 <strong>{(data?.matchCount ?? allItems.length).toLocaleString()}</strong>건
          </span>
          {openCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
              접수중 {openCount}건
            </span>
          )}
          {upcomingCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
              예정 {upcomingCount}건
            </span>
          )}
          <DataFreshness cached={data?.cached} ttlRemaining={data?.ttlRemaining} />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        {/* 상태 탭 필터 */}
        <div className="flex gap-2 mb-4 border-b border-gray-100 pb-4">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value || null)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                statusFilter === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">데이터 불러오는 중...</div>
        ) : !items.length ? (
          <div className="flex items-center justify-center h-48 text-gray-400">해당 조건의 분양정보가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-left">
                  <th className="pb-3 font-medium">단지명</th>
                  <th className="pb-3 font-medium">지역</th>
                  <th className="pb-3 font-medium whitespace-nowrap">공급세대</th>
                  <th className="pb-3 font-medium whitespace-nowrap">특별공급 접수</th>
                  <th className="pb-3 font-medium whitespace-nowrap">일반공급 접수</th>
                  <th className="pb-3 font-medium whitespace-nowrap">당첨발표</th>
                  <th className="pb-3 font-medium whitespace-nowrap">계약기간</th>
                  <th className="pb-3 font-medium whitespace-nowrap">입주예정</th>
                  <th className="pb-3 font-medium">시공사</th>
                  <th className="pb-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item, i) => {
                  const status = getStatus(item.RCEPT_BGNDE, item.RCEPT_ENDDE);
                  const regionName = SGG_CODES.find((s) => s.code === item.SUBSCRPT_AREA_CODE)?.name
                    ?? item.SUBSCRPT_AREA_CODE_NM;
                  return (
                    <tr key={item.HOUSE_MANAGE_NO ?? i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium text-gray-900">
                        {item.PBLANC_URL ? (
                          <a
                            href={item.PBLANC_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 hover:underline"
                          >
                            {item.HOUSE_NM}
                          </a>
                        ) : (
                          item.HOUSE_NM
                        )}
                      </td>
                      <td className="py-3 text-gray-600 whitespace-nowrap">{regionName}</td>
                      <td className="py-3 text-gray-600 text-right pr-4">
                        {item.TOT_SUPLY_HSHLDCO?.toLocaleString() ?? "-"}
                      </td>
                      <td className="py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(item.SPSPLY_RCEPT_BGNDE)} ~<br />
                        {formatDate(item.SPSPLY_RCEPT_ENDDE)}
                      </td>
                      <td className="py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(item.RCEPT_BGNDE)} ~<br />
                        {formatDate(item.RCEPT_ENDDE)}
                      </td>
                      <td className="py-3 text-gray-600 whitespace-nowrap text-xs">
                        {formatDate(item.PRZWNER_PRESNATN_DE)}
                      </td>
                      <td className="py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(item.CNTRCT_CNCLS_BGNDE)} ~<br />
                        {formatDate(item.CNTRCT_CNCLS_ENDDE)}
                      </td>
                      <td className="py-3 text-gray-600 whitespace-nowrap">{formatMvnYm(item.MVN_PREARNGE_YM)}</td>
                      <td className="py-3 text-gray-500 text-xs max-w-[120px] truncate" title={item.CNSTRCT_ENTRPS_NM}>
                        {item.CNSTRCT_ENTRPS_NM ?? "-"}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
