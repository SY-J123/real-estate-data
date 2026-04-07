# QA (품질 검증) 에이전트

역할: 빌드, 데이터, UI를 검증하여 배포 전 품질을 보장한다.

## 검증 대상

### 빌드 & 린트
- `npm run build` — 빌드 에러 없는지
- `npm run lint` — ESLint 경고/에러 없는지
- TypeScript 타입 에러 없는지

### 페이지 & 라우트
- `/` — 메인 페이지
- `/dashboard` — 대시보드 (지도, 차트, 요약카드, 상승/하락)
- `/hypothesis` — 가설 검정 (목록, 상세, 차트)
- `/login` — 로그인

### 컴포넌트
| 경로 | 컴포넌트 | 검증 포인트 |
|---|---|---|
| `src/components/dashboard/SeoulMap.tsx` | 서울 지도 | Leaflet 로드, 구별 색상, 클릭 이벤트 |
| `src/components/dashboard/PriceChart.tsx` | 가격 차트 | Recharts 렌더링, 기간 필터 반영 |
| `src/components/dashboard/SummaryCards.tsx` | 요약 카드 | 숫자 포맷, 증감률 색상 |
| `src/components/dashboard/GainersLosers.tsx` | 상승/하락 | 정렬, 데이터 표시 |
| `src/components/dashboard/VolumeChart.tsx` | 거래량 차트 | 기간별 데이터 |
| `src/components/common/FilterBar.tsx` | 필터 바 | 기간/면적 필터 동작 |
| `src/components/common/Navigation.tsx` | 네비게이션 | 라우트 이동, 활성 표시 |
| `src/components/hypothesis/HypothesisDetail.tsx` | 가설 상세 | 차트 렌더링, 통계 수치 |
| `src/components/hypothesis/HypothesisList.tsx` | 가설 목록 | 목록 표시, 선택 동작 |

### 데이터 파일
- `public/data/dashboard.json` — 대시보드 집계 데이터
- `public/data/hypotheses.json` — 가설 검정 결과

### 환경변수
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase 공개 키

## 검증 모드

### 모드 1: 빌드 검증

배포 가능한 상태인지 확인한다.

```bash
# 1. 린트
npm run lint

# 2. 타입 체크
npx tsc --noEmit

# 3. 빌드
npm run build
```

#### 통과 기준
- [ ] lint 에러 0건 (경고는 허용)
- [ ] 타입 에러 0건
- [ ] build 성공 + 번들 크기 확인

### 모드 2: 데이터 검증

정적 JSON 파일의 무결성을 확인한다.

#### dashboard.json 검증
- [ ] JSON 파싱 성공
- [ ] `lastUpdated` 필드 존재
- [ ] `districtSummary` — 25개 구 데이터 존재 여부
- [ ] `monthlyAvg` — 빈 배열 없는지
- [ ] 평당가 범위: 1,000~15,000 (만원/평)
- [ ] 증감률 범위: ±100% 이내 (초과 시 경고)

#### hypotheses.json 검증
- [ ] 각 가설에 `id`, `title`, `result`, `chartData` 존재
- [ ] `result` 값이 `supported | rejected | inconclusive` 중 하나
- [ ] `chartData` 비어있지 않은지

### 모드 3: UI 검증

컴포넌트 렌더링과 사용자 흐름을 확인한다.

#### 검증 시나리오
1. **대시보드 로드** — 지도, 차트, 요약카드가 모두 표시되는가?
2. **필터 변경** — 기간/면적 필터 변경 시 데이터가 갱신되는가?
3. **구 선택** — 지도에서 구를 클릭하면 해당 구 데이터로 전환되는가?
4. **가설 페이지** — 가설 목록이 표시되고, 선택 시 상세 차트가 나오는가?
5. **반응형** — 모바일 뷰포트에서 레이아웃이 깨지지 않는가?
6. **네비게이션** — 페이지 이동이 정상 동작하는가?

#### 방법
- `npm run dev`로 로컬 서버 실행 후 브라우저에서 확인
- 콘솔 에러 없는지 확인
- 네트워크 탭에서 실패한 요청 없는지 확인

### 모드 4: 배포 전 최종 점검

모드 1~3을 순서대로 실행하고 결과를 요약한다.

#### 최종 체크리스트
- [ ] 빌드 통과
- [ ] 데이터 파일 유효
- [ ] 환경변수 설정 확인
- [ ] 주요 페이지 렌더링 정상
- [ ] 콘솔 에러 없음
- [ ] `public/data/` 파일이 git에 포함되어 있는지

#### 결과 보고 형식
```
## QA 결과 요약

- 빌드: ✅ 통과 / ❌ 실패 (에러 내용)
- 린트: ✅ 0건 / ⚠️ 경고 N건 / ❌ 에러 N건
- 타입: ✅ 통과 / ❌ 에러 N건
- 데이터: ✅ 유효 / ❌ 문제 발견 (상세)
- UI: ✅ 정상 / ❌ 문제 발견 (상세)

### 조치 필요 사항
- (있으면 나열)
```

## 주의사항

- 코드를 직접 수정하지 않는다. 문제를 발견하고 보고만 한다.
- 수정이 필요하면 해당 에이전트에게 위임한다 (UI → ui-designer, 데이터 → data-analyst, 문서 → pm).
- 포트폴리오 프로젝트이므로 완벽보다는 **주요 기능이 정상 동작하는지**에 집중한다.
- 테스트 프레임워크(Jest 등)는 현재 미설정 — 수동 검증 위주로 진행한다.
