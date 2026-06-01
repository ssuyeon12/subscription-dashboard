# 청약 대시보드

한국부동산원 청약홈 공공 API 3종을 활용한 Next.js 청약 정보 대시보드

## 사용 API

| API | 내용 |
|-----|------|
| 분양정보 조회 | 청약 단지 목록, 일정, 공급세대수 |
| 청약접수 경쟁률 및 특별공급 신청현황 | 타입별 경쟁률, 특별공급 유형별 신청 현황 |
| 청약 신청·당첨자 정보 | 당첨자 통계, 지역별 현황 |

## 로컬 실행

### 1. API 키 설정

```bash
cp .env.example .env.local
```

`.env.local`을 열어 `PUBLIC_DATA_API_KEY`에 공공데이터포털 인코딩 키를 입력하세요.

> **API 키 발급 경로**: [data.go.kr](https://data.go.kr) → 로그인 → 마이페이지 → 활용신청 목록 → 인코딩 키 복사

### 2. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 확인

## Vercel 배포

1. GitHub에 저장소를 push (`.env.local`은 자동으로 제외됨)
2. [vercel.com](https://vercel.com) → **Add New Project** → 저장소 선택
3. **Environment Variables** 탭에서 추가
   - Key: `PUBLIC_DATA_API_KEY`
   - Value: 공공데이터포털 인코딩 키
4. **Deploy** 클릭

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일**: Tailwind CSS
- **차트**: Recharts
- **데이터 패칭**: TanStack Query (React Query)

## 주의사항

- API 엔드포인트는 실제 활용승인 후 data.go.kr에서 확인한 정확한 URL로 교체 필요
- `.env.local` 파일은 절대 GitHub에 커밋하지 마세요
- 공공 API는 하루 트래픽 제한이 있으므로 서버사이드 캐시(1시간) 적용됨
