# yongyong4-frontend

용용톤4팀 프론트엔드 레포

## 기술 스택

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · React Router · TanStack Query

## 시작하기

Node 24 이상이 필요합니다 (`.nvmrc` 참고).

```bash
npm ci                    # package-lock.json 그대로 설치
cp .env.example .env      # 환경 변수 파일 만들기 (값은 BE 주소에 맞게 수정)
npm run dev               # 개발 서버 (http://localhost:5173)
```

> `npm install --legacy-peer-deps`는 사용 X! 버전 충돌을 숨기기만 해서 나중에 다시 꼬입니다.
> 패키지를 새로 추가했다면 `package-lock.json`도 같이 커밋해 주세요.

| 명령어            | 설명                 |
| ----------------- | -------------------- |
| `npm run dev`     | 개발 서버            |
| `npm run build`   | 타입 검사 + 빌드     |
| `npm run lint`    | ESLint 검사          |
| `npm run format`  | Prettier로 전체 포맷 |
| `npm run preview` | 빌드 결과 미리보기   |

VS Code에서 열면 추천 확장(ESLint, Prettier, Tailwind CSS)을 설치해 주세요. 저장할 때 자동으로 포맷됩니다.

### 환경 변수

| 이름                    | 설명                                                                       |
| ----------------------- | -------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | API 요청 기본 경로. 개발 중에는 `/api`                                     |
| `VITE_API_PROXY_TARGET` | 개발 서버가 `/api` 요청을 넘길 BE 주소                                     |
| `VITE_USE_MOCK`         | `false`면 이동(trips) API도 실제 BE 사용. 비우면 개발 서버에서는 목 데이터 |
| `VITE_DEMO_MODE`        | `true`면 시연 모드. BE 가상 시계를 앱의 "지금"으로 사용                    |
| `VITE_KAKAO_MAP_KEY`    | 카카오맵 JavaScript 키                                                     |

## 시연 실행 방법 (로컬 데모 BE + 가상 시계)

FE 코드를 고치지 않고, 실행만 하면 시연할 수 있게 준비해 두었습니다.

**준비물**: Node 24 이상, 같은 컴퓨터에서 데모 BE 실행 (`http://127.0.0.1:18080`)

```bash
# 1. 최신 코드 받기
git checkout dev
git pull origin dev

# 2. 패키지 설치 (처음 한 번, 또는 package-lock.json이 바뀌었을 때)
npm ci

# 3. 시연 설정 파일 만들기 (.env.local은 git에 올라가지 않음)
cp .env.demo.example .env.local        # Windows PowerShell: Copy-Item .env.demo.example .env.local

# 4. 데모 BE를 먼저 켠 뒤 개발 서버 실행
npm run dev
```

5. 크롬에서 **http://localhost:5173** 접속 → F12 → 휴대폰 모양 아이콘(기기 모드)으로 폰 화면 보기

**확인 방법**: 브라우저에서 http://localhost:5173/api/v1/demo/clock 을 열었을 때
`{"demo":true,"virtualNow":"..."}`가 보이면 데모 BE와 연결된 것입니다.

**주의**

- 주소는 꼭 `localhost:5173`이어야 합니다. 다른 포트(5174 등)로 열리면 카카오 지도가 뜨지 않습니다. 5173을 쓰는 다른 개발 서버를 먼저 꺼 주세요.
- `.env.local`을 만들거나 고친 뒤에는 개발 서버를 껐다가(`Ctrl+C`) 다시 `npm run dev` 해야 적용됩니다.
- 가상 시계는 BE가 시각을 넘길 때만 바뀝니다. FE는 3초마다 `/demo/clock`을 다시 조회하고, 시각이 바뀌면 열려 있는 화면(경로 분석·전략 비교·이동 중 재평가)을 자동으로 다시 불러옵니다.
- 시연이 끝나면 `.env.local`을 지우면 원래 설정으로 돌아갑니다.

**시연 순서 (BE 데모 데이터 기준)**

| 가상 시각              | 화면                         | 보여줄 것                         |
| ---------------------- | ---------------------------- | --------------------------------- |
| 08:10                  | 후보 경로 → 전략 비교 → 출발 | 5003B 예측 빈자리 0석 · 탑승 위험 |
| 08:10                  | 이동 중 (정류장 도착 → 대기) | 0석 · 위험, 다음 버스 정보        |
| 08:18 (BE가 시계 넘김) | 이동 중 (자동 갱신)          | 다음 버스 8석 · 가능              |
| -                      | [못 탔어요] → P-02           | 다음 버스 기다리기 vs 5003A 대안  |
| -                      | [종료] → S-06 요약           | 총 소요시간 (BE `durationMin`)    |

### 휴대폰에서 확인할 때

위치 권한(Geolocation)은 HTTPS나 `localhost`에서만 동작합니다. 휴대폰으로 `http://192.168.x.x:5173`에 접속하면 위치 기능이 동작하지 않습니다.

## 폴더 구조

```
src/
  apis/            API 요청 (client.ts를 거쳐서 호출)
  components/
    common/        공통 표시 요소 C-01~C-06, 버튼 등
    popups/        팝업 P-01~P-05
    layout/        모바일 레이아웃
  pages/           화면별 폴더. 그 화면에서만 쓰는 컴포넌트도 이 안에 둠
  routes/          라우터, 화면 주소(PATHS)
  types/           타입 정의
  hooks/           커스텀 훅
  utils/           기기 저장(storage) 등
  constants/       화면 문구(기능명세서 9장), 기준값
```

- import는 `@/` 별칭을 사용합니다. 예: `import { PATHS } from '@/routes/paths'`
- 화면 문구는 `constants/messages.ts`에 모아둡니다. 확률·퍼센트 표현은 쓰지 않습니다 (기능명세서 2-4).

## 화면과 분담

### 서연님: 경로 탐색 및 추천

| 화면                       | 주소          | 파일                 |
| -------------------------- | ------------- | -------------------- |
| O-01~03 온보딩 1, 2, 3     | `/onboarding` | `pages/onboarding`   |
| S-01 홈 1, 2               | `/`           | `pages/home`         |
| S-01-1 장소 검색           | `/search`     | `pages/place-search` |
| S-02 후보 경로 목록 1, 2   | `/routes`     | `pages/routes`       |
| S-03 전략 비교             | `/strategy`   | `pages/strategy`     |
| S-07 서비스 안내           | `/guide`      | `pages/guide`        |
| P-05 위치 권한 안내 (팝업) | -             | `components/popups`  |

| 컴포넌트              | 파일                |
| --------------------- | ------------------- |
| 아이콘                | `components/icons`  |
| map/base-동백         | `components/map`    |
| system/home-indicator | `components/layout` |

### 지안: 이동 관리 및 실시간 대응

| 화면                            | 주소            | 파일                 |
| ------------------------------- | --------------- | -------------------- |
| S-05 이동 중 1, 2, 3, 4         | `/trip`         | `pages/trip`         |
| S-06 이동 요약                  | `/trip/summary` | `pages/trip-summary` |
| P-01 경로 변경 제안 (팝업)      | -               | `components/popups`  |
| P-02 탑승 실패 후 재평가 (팝업) | -               | `components/popups`  |
| P-03 이동 종료 확인 (팝업)      | -               | `components/popups`  |
| P-04 정류장 도착 (팝업)         | -               | `components/popups`  |

| 컴포넌트                    | 파일                |
| --------------------------- | ------------------- |
| Level Pill (C-01 단계 배지) | `components/common` |
| Button                      | `components/common` |
| Line Badge (노선 배지)      | `components/common` |
| Mode Toggle                 | `components/common` |

> 공통 컴포넌트는 서로의 화면에서도 씁니다. 예를 들어 S-02, S-03에도 Level Pill, Line Badge, Button이 들어가니
> 먼저 만들어서 merge하고, 상대방 컴포넌트를 고쳐야 하면 담당자에게 먼저 알려주세요.

## 협업 규칙

### 브랜치

- `main`에 직접 push하지 않고 브랜치를 만들어 PR로 합칩니다.
- 브랜치 이름: `feature/화면-또는-기능`, `fix/내용` (예: `feature/home`, `fix/route-card-layout`)
- PR은 다른 팀원이 확인한 뒤 merge합니다.

### 커밋 메시지

| 타입       | 용도                     |
| ---------- | ------------------------ |
| `feat`     | 새 기능                  |
| `fix`      | 버그 수정                |
| `style`    | UI·스타일 변경           |
| `refactor` | 동작 변경 없는 코드 정리 |
| `chore`    | 설정, 패키지             |
| `docs`     | 문서                     |

예: `feat: 홈 출발지·목적지 입력 (F-01-01)`
