import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: true,
  parseTagValue: true,
});

export function parseXML(xml: string): Record<string, unknown> {
  return parser.parse(xml);
}

// 공공 API 응답에서 items 배열을 안전하게 추출
export function extractItems(parsed: Record<string, unknown>): Record<string, unknown>[] {
  try {
    const response = parsed as {
      response?: { body?: { items?: { item?: unknown } } };
    };
    const item = response?.response?.body?.items?.item;
    if (!item) return [];
    return Array.isArray(item) ? item as Record<string, unknown>[] : [item as Record<string, unknown>];
  } catch {
    return [];
  }
}

export function extractTotalCount(parsed: Record<string, unknown>): number {
  try {
    const response = parsed as {
      response?: { body?: { totalCount?: number } };
    };
    return response?.response?.body?.totalCount ?? 0;
  } catch {
    return 0;
  }
}
