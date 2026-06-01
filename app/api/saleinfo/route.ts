/**
 * 분양정보 조회 프록시
 * API: ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail
 * 캐시 TTL: 15분
 */
import { NextRequest, NextResponse } from "next/server";
import { appendCond, OdcloudResponse } from "@/lib/xml-parser";
import { cacheGet, cacheSet, TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

const BASE_URL =
  "https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("pageNo") ?? "1";
  const perPage = searchParams.get("numOfRows") ?? "20";
  const subscrptAreaCode = searchParams.get("sggCd") ?? "";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";

  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const cacheKey = `saleinfo:${page}:${perPage}:${subscrptAreaCode}:${startDate}:${endDate}`;
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
  if (subscrptAreaCode) appendCond(params, "SUBSCRPT_AREA_CODE", "EQ", subscrptAreaCode);
  if (startDate) appendCond(params, "RCRIT_PBLANC_DE", "GTE", startDate);
  if (endDate) appendCond(params, "RCRIT_PBLANC_DE", "LTE", endDate);

  try {
    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) {
      const text = await res.text();
      console.error("saleinfo API HTTP error:", res.status, text.slice(0, 300));
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: 502 });
    }
    const json: OdcloudResponse = await res.json();
    cacheSet(cacheKey, json, TTL.saleinfo);
    return NextResponse.json({
      items: json.data ?? [],
      matchCount: json.matchCount ?? 0,   // ★ 필터 결과 수 (KPI/페이지네이션에 사용)
      totalCount: json.totalCount ?? 0,   // 전체 dataset 크기 (FE에서 직접 사용 X)
      cached: false,
      ttlRemaining: TTL.saleinfo,
    });
  } catch (err) {
    console.error("saleinfo API error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
