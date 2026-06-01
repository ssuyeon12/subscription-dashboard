/**
 * 청약접수 경쟁률 조회 프록시
 * API: ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet
 * 캐시 TTL: 5분
 *
 * 경쟁률 API에는 지역 필드(SUBSCRPT_AREA_CODE)가 없으므로
 * 항상 전국 기준으로 반환하고, saleinfo에서 단지명만 enrichment한다.
 */
import { NextRequest, NextResponse } from "next/server";
import { OdcloudResponse } from "@/lib/xml-parser";
import { cacheGet, cacheSet, TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

const BASE_URL =
  "https://api.odcloud.kr/api/ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet";
const SALEINFO_URL =
  "https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("pageNo") ?? "1";
  const perPage = searchParams.get("numOfRows") ?? "100";

  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // sggCd는 캐시 키에만 포함 (실제 필터에는 사용 안 함 — API 미지원)
  const cacheKey = `competition:${page}:${perPage}`;
  const cached = cacheGet<{ items: Record<string, unknown>[] }>(cacheKey);
  if (cached) {
    return NextResponse.json({
      items: cached.data.items,
      matchCount: cached.data.items.length,
      totalCount: cached.data.items.length,
      cached: true,
      ttlRemaining: cached.ttlRemaining,
    });
  }

  const params = new URLSearchParams({ page, perPage, serviceKey: apiKey });

  try {
    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) {
      const text = await res.text();
      console.error("competition API HTTP error:", res.status, text.slice(0, 300));
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: 502 });
    }
    const json: OdcloudResponse = await res.json();
    let items = (json.data ?? []) as Record<string, unknown>[];

    // 단지명 enrichment (실패해도 원본 반환)
    const nameMap = await fetchHouseNameMap(apiKey);
    items = items.map((item) => {
      const no = String(item.HOUSE_MANAGE_NO ?? "");
      const found = nameMap.get(no);
      return found ? { ...item, HOUSE_NM: found } : item;
    });

    cacheSet(cacheKey, { items }, TTL.competition);
    return NextResponse.json({
      items,
      matchCount: items.length,
      totalCount: json.totalCount ?? items.length,
      cached: false,
      ttlRemaining: TTL.competition,
    });
  } catch (err) {
    console.error("competition API error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

/**
 * 분양정보 API에서 HOUSE_MANAGE_NO → HOUSE_NM 맵 반환
 * perPage=500으로 최근 단지명을 충분히 가져온다.
 */
async function fetchHouseNameMap(apiKey: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const sp = new URLSearchParams({ page: "1", perPage: "500", serviceKey: apiKey });
    const res = await fetch(`${SALEINFO_URL}?${sp}`);
    if (!res.ok) return map;
    const json: OdcloudResponse = await res.json();
    for (const row of (json.data ?? []) as Record<string, unknown>[]) {
      const no = String(row.HOUSE_MANAGE_NO ?? "");
      const nm = String(row.HOUSE_NM ?? "");
      if (no && nm) map.set(no, nm);
    }
  } catch {
    // graceful degradation
  }
  return map;
}
