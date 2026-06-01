/**
 * 청약 신청·당첨자 통계 조회 프록시
 * API: ApplyhomeStatSvc/v1/{endpoint}
 * 캐시 TTL: 60분 (매월 26일 갱신)
 *
 * type 파라미터:
 *   applicant-area  → getAPTReqstAreaStat
 *   applicant-age   → getAPTReqstAgeStat
 *   winner-area     → getAPTPrzwnerAreaStat
 *   winner-age      → getAPTPrzwnerAgeStat
 *   compet-area     → getAPTCmpetrtAreaStat
 *   score           → getAPTApsPrzwnerStat
 */
import { NextRequest, NextResponse } from "next/server";
import { appendCond, OdcloudResponse } from "@/lib/xml-parser";
import { cacheGet, cacheSet, TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

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
  const startMonth = searchParams.get("startMonth") ?? "";
  const endMonth = searchParams.get("endMonth") ?? "";
  const subscrptAreaCode = searchParams.get("sggCd") ?? "";

  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const endpoint = ENDPOINT_MAP[type] ?? ENDPOINT_MAP["applicant-area"];
  const cacheKey = `subscription:${type}:${page}:${perPage}:${startMonth}:${endMonth}:${subscrptAreaCode}`;
  const cached = cacheGet<OdcloudResponse>(cacheKey);
  if (cached) {
    return NextResponse.json({
      items: cached.data.data ?? [],
      matchCount: cached.data.matchCount ?? 0,
      totalCount: cached.data.totalCount ?? 0,
      cached: true,
      ttlRemaining: cached.ttlRemaining,
    });
  }

  const params = new URLSearchParams({ page, perPage, serviceKey: apiKey });
  if (startMonth) appendCond(params, "STAT_DE", "GTE", startMonth);
  if (endMonth) appendCond(params, "STAT_DE", "LTE", endMonth);
  if (subscrptAreaCode) appendCond(params, "SUBSCRPT_AREA_CODE", "EQ", subscrptAreaCode);

  try {
    const res = await fetch(`${BASE}/${endpoint}?${params}`);
    if (!res.ok) {
      const text = await res.text();
      console.error("subscription API HTTP error:", res.status, text.slice(0, 300));
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: 502 });
    }
    const json: OdcloudResponse = await res.json();
    cacheSet(cacheKey, json, TTL.subscription);
    return NextResponse.json({
      items: json.data ?? [],
      matchCount: json.matchCount ?? 0,
      totalCount: json.totalCount ?? 0,
      cached: false,
      ttlRemaining: TTL.subscription,
    });
  } catch (err) {
    console.error("subscription API error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
