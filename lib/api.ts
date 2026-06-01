export interface CommonParams {
  pageNo?: number;
  numOfRows?: number;
  sggCd?: string;       // SUBSCRPT_AREA_CODE (e.g. "100" = 서울)
  startMonth?: string;  // YYYYMM
  endMonth?: string;    // YYYYMM
}

async function apiFetch(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") query.set(k, String(v));
  }
  const res = await fetch(`/api/${path}?${query}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/** 분양정보 (ApplyhomeInfoDetailSvc) */
export function fetchSaleInfo(params: CommonParams & { startDate?: string; endDate?: string }) {
  return apiFetch("saleinfo", {
    pageNo: params.pageNo,
    numOfRows: params.numOfRows,
    sggCd: params.sggCd,
    startDate: params.startDate,
    endDate: params.endDate,
  });
}

/** 경쟁률 (ApplyhomeInfoCmpetRtSvc) */
export function fetchCompetition(params: CommonParams & { houseManageNo?: string; resideSecd?: string }) {
  return apiFetch("competition", {
    pageNo: params.pageNo,
    numOfRows: params.numOfRows,
    houseManageNo: params.houseManageNo,
    resideSecd: params.resideSecd,
  });
}

/** 신청/당첨자 통계 (ApplyhomeStatSvc) */
export type SubType =
  | "applicant-area"
  | "applicant-age"
  | "winner-area"
  | "winner-age"
  | "compet-area"
  | "score";

export function fetchSubscription(params: CommonParams & { type?: SubType }) {
  return apiFetch("subscription", {
    type: params.type ?? "applicant-area",
    pageNo: params.pageNo,
    numOfRows: params.numOfRows,
    sggCd: params.sggCd,
    startMonth: params.startMonth,
    endMonth: params.endMonth,
  });
}
