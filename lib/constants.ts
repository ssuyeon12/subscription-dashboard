/**
 * 공급지역코드 (SUBSCRPT_AREA_CODE)
 * 출처: 한국부동산원 청약홈 API 기술문서 코드명세
 */
export const SGG_CODES = [
  { code: "100", name: "서울" },
  { code: "200", name: "강원" },
  { code: "300", name: "대전" },
  { code: "312", name: "충남" },
  { code: "338", name: "세종" },
  { code: "360", name: "충북" },
  { code: "400", name: "인천" },
  { code: "410", name: "경기" },
  { code: "500", name: "광주" },
  { code: "513", name: "전남" },
  { code: "560", name: "전북" },
  { code: "600", name: "부산" },
  { code: "621", name: "경남" },
  { code: "680", name: "울산" },
  { code: "690", name: "제주" },
  { code: "700", name: "대구" },
  { code: "712", name: "경북" },
];

/**
 * 현재 달 기준 기본 필터 범위 (최근 3개월, YYYYMM 형식)
 * ApplyhomeStatSvc의 STAT_DE 파라미터에 사용
 */
export function getDefaultMonthRange() {
  const now = new Date();
  const end = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const startStr = `${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, "0")}`;
  return { startMonth: startStr, endMonth: end };
}

/**
 * YYYYMM → YYYY-MM-DD 변환 (분양정보 API는 YYYY-MM-DD 사용)
 */
export function yyyymmToDate(ym: string, lastDay = false): string {
  if (!ym || ym.length < 6) return "";
  const y = ym.slice(0, 4);
  const m = ym.slice(4, 6);
  if (lastDay) {
    const d = new Date(Number(y), Number(m), 0).getDate(); // 월 마지막 날
    return `${y}-${m}-${String(d).padStart(2, "0")}`;
  }
  return `${y}-${m}-01`;
}
