/**
 * 공공데이터포털 odcloud API JSON 응답 헬퍼
 * 응답 형식: { data: [...], currentCount, matchCount, page, perPage, totalCount }
 */

export interface OdcloudResponse<T = Record<string, unknown>> {
  data: T[];
  currentCount: number;
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

export function extractItems<T = Record<string, unknown>>(
  json: OdcloudResponse<T>
): T[] {
  return json?.data ?? [];
}

export function extractTotalCount<T = Record<string, unknown>>(
  json: OdcloudResponse<T>
): number {
  return json?.totalCount ?? 0;
}

/**
 * cond[] 쿼리 파라미터를 URLSearchParams에 추가하는 헬퍼
 * odcloud API는 ?cond[FIELD::OPERATOR]=value 형식 사용
 */
export function appendCond(
  params: URLSearchParams,
  field: string,
  operator: "EQ" | "LIKE" | "GTE" | "LTE" | "GT" | "LT",
  value: string
) {
  params.append(`cond[${field}::${operator}]`, value);
}
