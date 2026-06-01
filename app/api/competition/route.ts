/**
 * 청약접수 경쟁률 조회 프록시
 * API: ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet
 * 캐시 TTL: 5분
 *
 * 경쟁률 API에는 지역 필드(SUBSCRPT_AREA_CODE)가 없음.
 * sggCd 필터가 있을 때는 분양정보 API에서 해당 지역의 HOUSE_MANAGE_NO 목록을 구해
 * 경쟁률 결과를 필터링한다.
 */
import { NextRequest, NextResponse } from "next/server";
import { appendCond, OdcloudResponse } from "@/lib/xml-parser";
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
  const houseManageNo = searchParams.get("houseManageNo") ?? "";
  const resideSecd = searchParams.get("resideSecd") ?? "";
  const sggCd = searchParams.get("sggCd") ?? ""; // 지역 필터 (SUBSCRPT_AREA_CODE)

  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const cacheKey = `competition:${page}:${perPage}:${houseManageNo}:${resideSecd}:${sggCd}`;
  const cached = cacheGet<{ enriched: Record<string, unknown>[]; matchCount: number; totalCount: number }>(cacheKey);
  if (cached) {
    return NextResponse.json({
      items: cached.data.enriched,
      matchCount: cached.data.matchCount,
      totalCount: cached.data.totalCount,
      cached: true,
      ttlRemaining: cached.ttlRemaining,
    });
  }

  const params = new URLSearchParams({ page, perPage, serviceKey: apiKey });
  if (houseManageNo) appendCond(params, "HOUSE_MANAGE_NO", "EQ", houseManageNo);
  if (resideSecd) appendCond(params, "RESIDE_SECD", "EQ", resideSecd);

  try {
    // 1) 경쟁률 전체 조회 (지역 필드 없으므로 필터 없이 가져옴)
    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) {
      const text = await res.text();
      console.error("competition API HTTP error:", res.status, text.slice(0, 300));
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: 502 });
    }
    const json: OdcloudResponse = await res.json();
    let items = (json.data ?? []) as Record<string, unknown>[];

    // 2) saleinfo에서 단지명 + 지역코드 enrichment
    const saleMap = await fetchSaleInfoMap(apiKey, sggCd);

    // 3) 단지명 붙이기
    items = items.map((item) => {
      const no = String(item.HOUSE_MANAGE_NO ?? "");
      const sale = saleMap.get(no);
      return sale ? { ...item, HOUSE_NM: sale.name, SUBSCRPT_AREA_CODE: sale.areaCode } : item;
    });

    // 4) sggCd가 있으면 해당 지역 단지만 필터
    if (sggCd) {
      const regionNos = new Set([...saleMap.entries()]
        .filter(([, v]) => v.areaCode === sggCd)
        .map(([k]) => k));
      items = items.filter((item) => regionNos.has(String(item.HOUSE_MANAGE_NO ?? "")));
    }

    const payload = {
      enriched: items,
      matchCount: items.length,
      totalCount: json.totalCount ?? 0,
    };
    cacheSet(cacheKey, payload, TTL.competition);

    return NextResponse.json({
      items,
      matchCount: items.length,
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
 * 분양정보 API에서 HOUSE_MANAGE_NO → { name, areaCode } 맵 반환
 * - 지역 필터 없이 전체 최근 데이터를 충분히 가져온 뒤 메모리에서 매핑
 * - perPage=500 × 최대 2페이지(1000건)로 커버리지 확보
 */
async function fetchSaleInfoMap(
  apiKey: string,
  sggCd: string
): Promise<Map<string, { name: string; areaCode: string }>> {
  const map = new Map<string, { name: string; areaCode: string }>();
  try {
    // 전국 데이터를 넉넉히 가져와야 competition의 HOUSE_MANAGE_NO를 커버할 수 있음
    // (지역 필터를 saleinfo에 적용하면 매칭 누락 가능성 있음)
    const PER = "500";
    const pages = sggCd ? [1, 2] : [1]; // 지역 필터 시 2페이지까지

    for (const pg of pages) {
      const sp = new URLSearchParams({ page: String(pg), perPage: PER, serviceKey: apiKey });
      // 지역 필터 없이 전체 조회 후 메모리에서 필터링
      const saleRes = await fetch(`${SALEINFO_URL}?${sp}`);
      if (!saleRes.ok) break;

      const saleJson: OdcloudResponse = await saleRes.json();
      const rows = (saleJson.data ?? []) as Record<string, unknown>[];
      for (const row of rows) {
        const no = String(row.HOUSE_MANAGE_NO ?? "");
        const nm = String(row.HOUSE_NM ?? "");
        const area = String(row.SUBSCRPT_AREA_CODE ?? "");
        if (no) map.set(no, { name: nm, areaCode: area });
      }
      // 마지막 페이지면 중단
      if (rows.length < Number(PER)) break;
    }
  } catch {
    // graceful degradation
  }
  return map;
}
