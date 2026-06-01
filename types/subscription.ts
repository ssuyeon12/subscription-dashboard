// 분양정보
export interface SaleInfo {
  houseManageNo: string;   // 주택관리번호
  houseName: string;       // 주택명
  hssplyAdres: string;     // 공급위치
  sggNm: string;           // 시군구명
  houseSecd: string;       // 주택구분코드
  houseSecdNm: string;     // 주택구분명
  rceptBgnde: string;      // 청약접수시작일
  rceptEndde: string;      // 청약접수종료일
  przwnerPresnatnDe: string; // 당첨자발표일
  mvnPrearnge: string;     // 입주예정월
  totSuplyHshldco: number; // 공급세대수
  gnrlRnk1CrsplAplyPcnt?: number; // 1순위 경쟁률
}

// 경쟁률 정보
export interface CompetitionRate {
  houseManageNo: string;
  houseName: string;
  houseSecd: string;
  sggNm: string;
  rceptBgnde: string;
  rceptEndde: string;
  typeNm: string;          // 주택형
  gnrlRnk1CrsplAplyPcnt: number; // 1순위 경쟁률
  gnrlRnk2CrsplAplyPcnt: number; // 2순위 경쟁률
  suplyCo: number;         // 공급세대수
}

// 특별공급 신청현황
export interface SpecialSupply {
  houseManageNo: string;
  houseName: string;
  sggNm: string;
  typeNm: string;
  mlfamRcpCnt: number;     // 다자녀가구
  oldParntsSuportRcpCnt: number; // 노부모부양
  newlyMarriedRcpCnt: number;   // 신혼부부
  firstLiveRcpCnt: number;      // 생애최초
  insttRecomendRcpCnt: number;  // 기관추천
  etcRcpCnt: number;            // 기타
}

// 당첨자 정보
export interface WinnerInfo {
  houseManageNo: string;
  houseName: string;
  sggNm: string;
  typeNm: string;
  houseSecdNm: string;
  gnrlRnk1CrsplAplyPcnt: number;
  przwnerPresnatnDe: string;
  totSuplyHshldco: number;
}

export interface ApiResponse<T> {
  items: T[];
  totalCount: number;
  pageNo: number;
  numOfRows: number;
}
