/**
 * 실제 공공 API 응답 필드명 기반 타입 정의 (영문 대문자)
 * API: ApplyhomeInfoDetailSvc / ApplyhomeInfoCmpetRtSvc / ApplyhomeStatSvc
 */

// ── 1. 분양정보 (ApplyhomeInfoDetailSvc → getAPTLttotPblancDetail) ──────────
export interface SaleInfo {
  HOUSE_MANAGE_NO: string;       // 주택관리번호
  PBLANC_NO: string;             // 공고번호
  HOUSE_NM: string;              // 주택명
  HOUSE_SECD: string;            // 주택구분코드
  HOUSE_SECD_NM: string;         // 주택구분코드명
  SUBSCRPT_AREA_CODE: string;    // 공급지역코드
  SUBSCRPT_AREA_CODE_NM: string; // 공급지역명
  HSSPLY_ADRES: string;          // 공급위치
  TOT_SUPLY_HSHLDCO: number;     // 공급세대수
  RCRIT_PBLANC_DE: string;       // 모집공고일 (YYYY-MM-DD)
  RCEPT_BGNDE: string;           // 청약접수시작일
  RCEPT_ENDDE: string;           // 청약접수종료일
  SPSPLY_RCEPT_BGNDE: string;    // 특별공급 접수시작일
  SPSPLY_RCEPT_ENDDE: string;    // 특별공급 접수종료일
  PRZWNER_PRESNATN_DE: string;   // 당첨자발표일
  CNTRCT_CNCLS_BGNDE: string;    // 계약시작일
  CNTRCT_CNCLS_ENDDE: string;    // 계약종료일
  MVN_PREARNGE_YM: string;       // 입주예정월 (YYYYMM)
  PBLANC_URL: string;            // 모집공고 URL
  BSNS_MBY_NM: string;           // 사업주체명(시행사)
  CNSTRCT_ENTRPS_NM: string;     // 건설업체명(시공사)
  HMPG_ADRES: string;            // 홈페이지주소
}

// ── 2. 경쟁률 (ApplyhomeInfoCmpetRtSvc → getAPTLttotPblancCmpet) ───────────
export interface CompetitionRate {
  HOUSE_MANAGE_NO: number;     // 주택관리번호
  PBLANC_NO: number;           // 공고번호
  MODEL_NO: string;            // 모델번호
  HOUSE_TY: string;            // 주택형
  HOUSE_NM?: string;           // 단지명 (enrichment: saleinfo API join)
  SUPLY_HSHLDCO: number;       // 공급세대수
  SUBSCRPT_RANK_CODE: number;  // 청약순위 (1 or 2)
  RESIDE_SECD: string;         // 거주코드 (01=해당지역, 02=기타지역, 03=기타경기)
  RESIDE_SENM: string;         // 거주지역명
  REQ_CNT: string;             // 접수건수
  CMPET_RATE: string;          // 경쟁률 (예: "401.00" 또는 "-")
}

// ── 3. 신청자/당첨자 통계 (ApplyhomeStatSvc) ──────────────────────────────
// 지역별 신청자 (getAPTReqstAreaStat) / 지역별 당첨자 (getAPTPrzwnerAreaStat)
export interface AreaStat {
  STAT_DE: string;               // 제공연월 (YYYYMM)
  SUBSCRPT_AREA_CODE: string;    // 공급지역코드
  SUBSCRPT_AREA_CODE_NM: string; // 공급지역명
  AGE_30: number;                // 30대 이하
  AGE_40: number;                // 40대
  AGE_50: number;                // 50대
  AGE_60: number;                // 60대 이상
}

// 연령별 신청자 (getAPTReqstAgeStat) / 연령별 당첨자 (getAPTPrzwnerAgeStat)
export interface AgeStat {
  STAT_DE: string;
  AGE_30: number;
  AGE_40: number;
  AGE_50: number;
  AGE_60: number;
}

export interface ApiResponse<T> {
  items: T[];
  totalCount: number;
}
