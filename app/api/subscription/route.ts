/**
 * 청약 신청·당첨자 통계 조회 프록시
 * API: 한국부동산원_청약홈 청약 신청·당첨자 정보 조회 서비스 (ApplyhomeStatSvc)
 *
 * type 파라미터로 엔드포인트 선택:
 *   - "applicant-area"  → getAPTReqstAreaStat  (지역별 신청자)
 *   - "applicant-age"   → getAPTReqstAgeStat   (연령별 신청자)
 *   - "winner-area"     → getAPTPrzwnerAreaStat (지역별 당첨자)
 *   - "winner-age"      → getAPTPrzwnerAgeStat  (연령별 당첨자)
 *   - "compet-area"     → getAPTCmpetrtAreaStat (지역별 경쟁률)
 *   - "score"           → getAPTApsPrzwnerStat  (지역별 가점제 당첨자)
 *
 * 날짜 파라미터 STAT_DE 형식: YYYYMM
 */
import { NextRequest, NextResponse } from "next/server";
import { appendCond, OdcloudResponse } from "@/lib/xml-parser";

const BASE = "https://api.odcloud.kr/api/ApplyhomeStatSvc/v1";

const ENDPOINT_MAP: Record<string, string> = {
  "applicant-area": "getAPTReqstAreaStat",
  "applicant-age":  "getAPTReqstAgeStat",
  "winner-area":    "getAPTPrzwnerAreaStat",
  "winner-age":     "getAPTPrzwnerAgeStat",
  "compet-area":    "getAPTCmpetrtAreaStat",
  "score":          "getAPTApsPrzwnerStat",
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "applicant-area";
  const page = searchParams.get("pageNo") ?? "1";
  const perPage = searchParams.get("numOfRows") ?? "50";
  // STAT_DE: YYYYMM
  const startMonth = searchParams.get("startMonth") ?? "";
  const endMonth = searchParams.get("endMonth") ?? "";
  const subscrptAreaCode = searchParams.get("sggCd") ?? "";

  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const endpoint = ENDPOINT_MAP[type] ?? ENDPOINT_MAP["applicant-area"];
  const params = new URLSearchParams({ page, perPage, serviceKey: apiKey });
  if (startMonth) appendCond(params, "STAT_DE", "GTE", startMonth);
  if (endMonth) appendCond(params, "STAT_DE", "LTE", endMonth);
  if (subscrptAreaCode) appendCond(params, "SUBSCRPT_AREA_CODE", "EQ", subscrptAreaCode);

  try {
    const res = await fetch(`${BASE}/${endpoint}?${params}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("subscription API HTTP error:", res.status, text.slice(0, 300));
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: 502 });
    }
    const json: OdcloudResponse = await res.json();
    return NextResponse.json({ items: json.data ?? [], totalCount: json.totalCount ?? 0 });
  } catch (err) {
    console.error("subscription API error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
