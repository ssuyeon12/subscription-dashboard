/**
 * 분양정보 조회 프록시
 * API: 한국부동산원_청약홈 분양정보 조회 서비스 (ApplyhomeInfoDetailSvc)
 * Endpoint: GET /api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail
 * 응답: JSON { data: [...], totalCount, ... }
 */
import { NextRequest, NextResponse } from "next/server";
import { appendCond, OdcloudResponse } from "@/lib/xml-parser";

const BASE_URL =
  "https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("pageNo") ?? "1";
  const perPage = searchParams.get("numOfRows") ?? "20";
  // 지역코드: 100=서울, 200=강원 … (공급지역코드 SUBSCRPT_AREA_CODE)
  const subscrptAreaCode = searchParams.get("sggCd") ?? "";
  // 날짜는 YYYY-MM-DD 형식 (모집공고일 기준)
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";

  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({ page, perPage, serviceKey: apiKey });
  if (subscrptAreaCode) appendCond(params, "SUBSCRPT_AREA_CODE", "EQ", subscrptAreaCode);
  if (startDate) appendCond(params, "RCRIT_PBLANC_DE", "GTE", startDate);
  if (endDate) appendCond(params, "RCRIT_PBLANC_DE", "LTE", endDate);

  try {
    const res = await fetch(`${BASE_URL}?${params}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("saleinfo API HTTP error:", res.status, text.slice(0, 300));
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: 502 });
    }
    const json: OdcloudResponse = await res.json();
    return NextResponse.json({ items: json.data ?? [], totalCount: json.totalCount ?? 0 });
  } catch (err) {
    console.error("saleinfo API error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
