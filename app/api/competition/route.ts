/**
 * 청약접수 경쟁률 조회 프록시
 * API: ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet
 * 캐시 TTL: 5분
 */
import { NextRequest, NextResponse } from "next/server";
import { appendCond, OdcloudResponse } from "@/lib/xml-parser";
import { cacheGet, cacheSet, TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

const BASE_URL =
  "https://api.odcloud.kr/api/ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("pageNo") ?? "1";
  const perPage = searchParams.get("numOfRows") ?? "30";
  const houseManageNo = searchParams.get("houseManageNo") ?? "";
  const resideSecd = searchParams.get("resideSecd") ?? "";

  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const cacheKey = `competition:${page}:${perPage}:${houseManageNo}:${resideSecd}`;
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
  if (houseManageNo) appendCond(params, "HOUSE_MANAGE_NO", "EQ", houseManageNo);
  if (resideSecd) appendCond(params, "RESIDE_SECD", "EQ", resideSecd);

  try {
    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) {
      const text = await res.text();
      console.error("competition API HTTP error:", res.status, text.slice(0, 300));
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: 502 });
    }
    const json: OdcloudResponse = await res.json();
    cacheSet(cacheKey, json, TTL.competition);
    return NextResponse.json({
      items: json.data ?? [],
      matchCount: json.matchCount ?? 0,
      totalCount: json.totalCount ?? 0,
      cached: false,
      ttlRemaining: TTL.competition,
    });
  } catch (err) {
    console.error("competition API error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
