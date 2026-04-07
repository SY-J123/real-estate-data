# 서울 부동산 대시보드

서울 아파트 실거래 데이터를 기반으로 가격 흐름, 거래량, 미분양, 구별 등락과 가설 검정 결과를 시각화하는 Next.js 대시보드입니다.

## 현재 구현 범위

- `대시보드` 페이지
  - 기간 및 지표 필터
  - 요약 카드
  - 서울 지도 시각화
  - 구별 상승/하락 랭킹
  - 가격 추이 차트
  - 거래량 차트
  - 미분양 차트
- `가설 검정` 페이지
  - 사전 계산된 가설 목록
  - 가설별 상세 설명과 차트
  - 통계 결과 요약

## 페이지 및 라우트

- `/dashboard` : 서울 부동산 지표 대시보드
- `/hypothesis` : 가설 검정 결과 탐색

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Recharts
- Leaflet / React Leaflet
- Supabase client

## 데이터 흐름

1. 공공 데이터 및 정적 원천 데이터를 수집합니다.
2. `scripts/` 아래 가공 스크립트로 대시보드용 JSON과 가설 검정 결과를 생성합니다.
3. 결과 파일을 `public/data/`에 저장합니다.
4. 프런트엔드에서 정적 JSON을 불러와 차트와 지도에 표시합니다.

주요 데이터 파일:

- `public/data/dashboard.json`
- `public/data/hypotheses.json`

## 개발 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 확인할 수 있습니다.

## 환경변수

현재 코드 기준으로 사용 중인 환경변수는 아래와 같습니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

## 추후 배포 예정

- 우하단 FAB 기반 `AI 분석` 패널
- 사용자가 질문을 입력하면 최신 기사 검색 결과와 현재 대시보드 데이터를 함께 요약하는 기능
- 예시 질문: `왜 OO구는 떨어졌어?`

위 기능은 이번 범위에는 포함하지 않고, 배포 후속 작업으로 분리합니다.
