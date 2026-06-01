"use client";

/**
 * 청약 요약 통계 카드
 * 데이터 출처: ApplyhomeStatSvc → getAPTReqstAreaStat (지역별 신청자)
 * 응답 필드: STAT_DE, SUBSCRPT_AREA_CODE_NM, AGE_30, AGE_40, AGE_50, AGE_60
 */
import { AreaStat } from "@/types/subscription";

interface Props {
  items: AreaStat[];
  isLoading: boolean;
}

function StatCard({ label, value, sub, color = "blue" }: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "purple" | "orange";
}) {
  const gradients = {
    blue: "from-blue-50 to-indigo-50 border-blue-100",
    green: "from-emerald-50 to-teal-50 border-emerald-100",
    purple: "from-purple-50 to-violet-50 border-purple-100",
    orange: "from-amber-50 to-orange-50 border-amber-100",
  };
  return (
    <div className={`bg-gradient-to-br ${gradients[color]} rounded-xl p-4 border`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function WinnerStats({ items, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="총 신청건수" value="-" sub="데이터 없음" color="blue" />
        <StatCard label="30대 이하 신청" value="-" color="green" />
        <StatCard label="커버 지역수" value="-" color="purple" />
        <StatCard label="조회 기간" value="-" color="orange" />
      </div>
    );
  }

  const totalApplicants = items.reduce(
    (sum, i) => sum + (i.AGE_30 ?? 0) + (i.AGE_40 ?? 0) + (i.AGE_50 ?? 0) + (i.AGE_60 ?? 0),
    0
  );
  const total30 = items.reduce((sum, i) => sum + (i.AGE_30 ?? 0), 0);
  const regions = [...new Set(items.map((i) => i.SUBSCRPT_AREA_CODE_NM))].filter(Boolean).length;
  const months = [...new Set(items.map((i) => i.STAT_DE))].length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="총 신청건수" value={totalApplicants} sub="건" color="blue" />
      <StatCard label="30대 이하 신청" value={total30}
        sub={`전체의 ${totalApplicants > 0 ? ((total30 / totalApplicants) * 100).toFixed(0) : 0}%`}
        color="green" />
      <StatCard label="조회 지역수" value={regions} sub="개 지역" color="purple" />
      <StatCard label="조회 기간" value={months} sub="개월" color="orange" />
    </div>
  );
}
