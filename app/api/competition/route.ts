/**
 * 청약접수 경쟁률 조회 프록시
 * API: ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet
 * 캐시 TTL: 5분
 *
 * 경쟁률 API에는 SUBSCRPT_AREA_CODE 필드가 없음.
 * 지역 필터(sggCd)가 있을 때:
 *   1) saleinfo API를 해당 지역 필터로 조회 → HOUSE_MANAGE_NO 목록 확보
 *   2) 경쟁률 전체 데이터에서 해당 번호만 필터링
 * sggCd 없을 때: 전국 전체 반환
 */
import { NextRequest, NextResponse } from "next/server";
import { appendCond, OdcloudResponse } from "@/lib/xml-parser";
import { cacheGet, cacheSet, TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

const COMP_URL =
  "https://api.odcloud.kr/api/ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet";
const SALE_URL =
  "https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page     = searchParams.get("pageNo")    ?? "1";
  const perPage  = searchParams.get("numOfRows") ?? "100";
  const sggCd    = searchParams.get("sggCd")     ?? "";

  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const cacheKey = `competition:${page}:${perPage}:${sggCd}`;
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

  try {
    // 1) 경쟁률 전체 조회 (지역 필드 없으므로 전국)
    const compParams = new URLSearchParams({ page, perPage, serviceKey: apiKey });
    const compRes = await fetch(`${COMP_URL}?${compParams}`);
    if (!compRes.ok) {
      const text = await compRes.text();
      console.error("competition API error:", compRes.status, text.slice(0, 200));
      return NextResponse.json({ error: `Upstream error ${compRes.status}` }, { status: 502 });
    }
    const compJson: OdcloudResponse = await compRes.json();
    let items = (compJson.data ?? []) as Record<string, unknown>[];

    // 2) saleinfo에서 단지명 + 지역코드 enrichment
    //    sggCd 있으면 해당 지역만 조회(빠름), 없으면 최근 전국 500건 조회
    const saleMap = await fetchSaleMap(apiKey, sggCd);

    // 3) 단지명 붙이기
    items = items.map((item) => {
      const no = String(item.HOUSE_MANAGE_NO ?? "");
      const info = saleMap.get(no);
      if (!info) return item;
      return { ...item, HOUSE_NM: info.name, SUBSCRPT_AREA_CODE: info.areaCode };
    });

    // 4) 지역 필터: sggCd가 있으면 해당 지역 단지만 남김
    if (sggCd) {
      const regionNos = new Set(
        [...saleMap.entries()]
          .filter(([, v]) => v.areaCode === sggCd)
          .map(([k]) => k)
      );
      items = items.filter((item) =>
        regionNos.has(String(item.HOUSE_MANAGE_NO ?? ""))
      );
    }

    cacheSet(cacheKey, { items }, TTL.competition);
    return NextResponse.json({
      items,
      matchCount: items.length,
      totalCount: compJson.totalCount ?? items.length,
      cached: false,
      ttlRemaining: TTL.competition,
    });
  } catch (err) {
    console.error("competition API error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

/**
 * saleinfo API에서 HOUSE_MANAGE_NO → { name, areaCode } 맵 반환.
 *
 * sggCd 있을 때: 해당 지역 필터로 조회 (결과가 적어 빠름, 커버리지 높음)
 * sggCd 없을 때: 최근 전국 500건 조회 (단지명 enrichment 용)
 */
async function fetchSaleMap(
  apiKey: string,
  sggCd: string
): Promise<Map<string, { name: string; areaCode: string }>> {
  const map = new Map<string, { name: string; areaCode: string }>();
  try {
    const sp = new URLSearchParams({ page: "1", perPage: "500", serviceKey: apiKey });
    if (sggCd) {
      // 지역 필터 적용 → 해당 지역 단지만 조회해 매칭률 극대화
      appendCond(sp, "SUBSCRPT_AREA_CODE", "EQ", sggCd);
    }

    const res = await fetch(`${SALE_URL}?${sp}`);
    if (!res.ok) return map;

    const json: OdcloudResponse = await res.json();
    for (const row of (json.data ?? []) as Record<string, unknown>[]) {
      const no   = String(row.HOUSE_MANAGE_NO   ?? "");
      const nm   = String(row.HOUSE_NM          ?? "");
      const area = String(row.SUBSCRPT_AREA_CODE ?? "");
      if (no) map.set(no, { name: nm, areaCode: area });
    }
  } catch {
    // graceful degradation
  }
  return map;
}
