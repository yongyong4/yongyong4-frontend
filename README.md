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

| 이름                    | 설명                                   |
| ----------------------- | -------------------------------------- |
| `VITE_API_BASE_URL`     | API 요청 기본 경로. 개발 중에는 `/api` |
| `VITE_API_PROXY_TARGET` | 개발 서버가 `/api` 요청을 넘길 BE 주소 |

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

| 화면                | 주소            | 파일                 | 담당 |
| ------------------- | --------------- | -------------------- | ---- |
| O-01~03 온보딩      | `/onboarding`   | `pages/onboarding`   | 미정 |
| S-01 홈             | `/`             | `pages/home`         | 미정 |
| S-01-1 장소 검색    | `/search`       | `pages/place-search` | 미정 |
| S-02 후보 경로      | `/routes`       | `pages/routes`       | 미정 |
| S-03 전략 비교      | `/strategy`     | `pages/strategy`     | 미정 |
| S-05 이동 중        | `/trip`         | `pages/trip`         | 미정 |
| S-06 이동 요약      | `/trip/summary` | `pages/trip-summary` | 미정 |
| S-07 서비스 안내    | `/guide`        | `pages/guide`        | 미정 |
| P-01~P-05 팝업      | -               | `components/popups`  | 미정 |
| C-01~C-06 공통 요소 | -               | `components/common`  | 미정 |

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
