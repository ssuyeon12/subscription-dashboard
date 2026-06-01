export interface FetchParams {
  pageNo?: number;
  numOfRows?: number;
  sggCd?: string;
  startMonth?: string;
  endMonth?: string;
}

async function apiFetch(path: string, params: FetchParams) {
  const query = new URLSearchParams();
  if (params.pageNo) query.set("pageNo", String(params.pageNo));
  if (params.numOfRows) query.set("numOfRows", String(params.numOfRows));
  if (params.sggCd) query.set("sggCd", params.sggCd);
  if (params.startMonth) query.set("startMonth", params.startMonth);
  if (params.endMonth) query.set("endMonth", params.endMonth);

  const res = await fetch(`/api/${path}?${query}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const fetchSaleInfo = (params: FetchParams) => apiFetch("saleinfo", params);
export const fetchCompetition = (params: FetchParams) => apiFetch("competition", params);
export const fetchSubscription = (params: FetchParams) => apiFetch("subscription", params);
