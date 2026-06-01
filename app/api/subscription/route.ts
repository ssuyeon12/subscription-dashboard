import { NextRequest, NextResponse } from "next/server";
import { parseXML, extractItems, extractTotalCount } from "@/lib/xml-parser";

const BASE_URL = "https://apis.data.go.kr/B552124/APT_VGCPPL";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const pageNo = searchParams.get("pageNo") ?? "1";
  const numOfRows = searchParams.get("numOfRows") ?? "20";
  const sggCd = searchParams.get("sggCd") ?? "";
  const startMonth = searchParams.get("startMonth") ?? "";
  const endMonth = searchParams.get("endMonth") ?? "";

  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo,
    numOfRows,
    _type: "xml",
    ...(sggCd && { sggCd }),
    ...(startMonth && { startMonth }),
    ...(endMonth && { endMonth }),
  });

  try {
    const res = await fetch(`${BASE_URL}/getAPT_VGCPPL?${params}`, {
      next: { revalidate: 3600 },
    });
    const xml = await res.text();
    const parsed = parseXML(xml);
    return NextResponse.json({
      items: extractItems(parsed),
      totalCount: extractTotalCount(parsed),
    });
  } catch (err) {
    console.error("subscription API error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
