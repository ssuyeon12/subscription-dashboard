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
    const items = json.data ?? [];

    // 단지명 enrichment: saleinfo API에서 HOUSE_MANAGE_NO → HOUSE_NM 매핑
    const enriched = await enrichWithHouseNames(items as Record<string, unknown>[], apiKey);

    const enrichedJson = { ...json, data: enriched };
    cacheSet(cacheKey, enrichedJson, TTL.competition);
    return NextResponse.json({
      items: enriched,
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

/**
 * 분양정보 API(getAPTLttotPblancDetail)에서 최근 단지명을 가져와
 * competition items에 HOUSE_NM 필드를 추가한다.
 * 실패해도 원본 items를 그대로 반환 (graceful degradation).
 */
async function enrichWithHouseNames(
  items: Record<string, unknown>[],
  apiKey: string
): Promise<Record<string, unknown>[]> {
  if (!items.length) return items;

  try {
    const SALEINFO_URL =
      "https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail";
    // 최근 2년 범위 + 충분한 rows로 단지명 목록 조회
    const sp = new URLSearchParams({ page: "1", perPage: "200", serviceKey: apiKey });
    const saleRes = await fetch(`${SALEINFO_URL}?${sp}`);
    if (!saleRes.ok) return items;

    const saleJson: OdcloudResponse = await saleRes.json();
    const saleData = (saleJson.data ?? []) as Record<string, unknown>[];

    // HOUSE_MANAGE_NO → HOUSE_NM 맵 구성
    const nameMap = new Map<string, string>();
    for (const row of saleData) {
      const no = String(row.HOUSE_MANAGE_NO ?? "");
      const nm = String(row.HOUSE_NM ?? "");
      if (no && nm) nameMap.set(no, nm);
    }

    // enrichment: HOUSE_NM 없으면 원래 값 유지
    return items.map((item) => {
      const no = String(item.HOUSE_MANAGE_NO ?? "");
      const foundName = nameMap.get(no);
      return foundName ? { ...item, HOUSE_NM: foundName } : item;
    });
  } catch {
    return items; // 실패 시 원본 반환
  }
}
