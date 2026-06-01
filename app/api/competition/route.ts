/**
 * 청약접수 경쟁률 조회 프록시
 * API: 한국부동산원_청약홈 청약접수 경쟁률 및 특별공급 신청현황 조회 서비스 (ApplyhomeInfoCmpetRtSvc)
 * Endpoint: GET /api/ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet
 * 응답: JSON { data: [...], totalCount, ... }
 *
 * 주요 응답 필드:
 *   HOUSE_MANAGE_NO, PBLANC_NO, HOUSE_TY(주택형), SUPLY_HSHLDCO(공급세대수),
 *   SUBSCRPT_RANK_CODE(청약순위), RESIDE_SECD(거주코드), RESIDE_SENM(거주지역),
 *   REQ_CNT(접수건수), CMPET_RATE(경쟁률)
 */
import { NextRequest, NextResponse } from "next/server";
import { appendCond, OdcloudResponse } from "@/lib/xml-parser";

const BASE_URL =
  "https://api.odcloud.kr/api/ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("pageNo") ?? "1";
  const perPage = searchParams.get("numOfRows") ?? "30";
  const houseManageNo = searchParams.get("houseManageNo") ?? "";
  // 거주구분코드: 01=해당지역, 02=기타지역, 03=기타경기
  const resideSecd = searchParams.get("resideSecd") ?? "";

  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({ page, perPage, serviceKey: apiKey });
  if (houseManageNo) appendCond(params, "HOUSE_MANAGE_NO", "EQ", houseManageNo);
  if (resideSecd) appendCond(params, "RESIDE_SECD", "EQ", resideSecd);

  try {
    const res = await fetch(`${BASE_URL}?${params}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("competition API HTTP error:", res.status, text.slice(0, 300));
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: 502 });
    }
    const json: OdcloudResponse = await res.json();
    return NextResponse.json({ items: json.data ?? [], totalCount: json.totalCount ?? 0 });
  } catch (err) {
    console.error("competition API error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
