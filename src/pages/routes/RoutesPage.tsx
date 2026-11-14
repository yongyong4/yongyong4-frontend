// S-02 후보 경로 목록
// 관련 기능: F-02-01, F-02-02
// 출발지와 도착지가 모두 정해지면 보이는 화면
//
// 1) GET  /api/v1/routes/search   대중교통 경로 탐색 (ODsay, 하루 30회 한도)
// 2) POST /api/v1/routes/analysis 후보 경로 위험 분석
// 두 응답을 합쳐 후보 카드로 보여줌 (변환은 routePlans.ts)

import { useQuery } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { distanceMeters, originLabel, peekOrigin, type Origin } from '@/apis/places'
import { analyzeRoutes, searchRoutes } from '@/apis/routes'
import { MESSAGES } from '@/constants/messages'
import { PATHS } from '@/routes/paths'
import { formatTime } from '@/utils/time'

import type { PlaceResult } from '@/pages/place-search/components/PlaceResultItem'

import RoutePlanCard, { type RoutePlan } from './components/RoutePlanCard'
import RoutesHeader from './components/RoutesHeader'
import { buildRoutePlans, pickRoutes } from './routePlans'

/** 출발지와 도착지가 이보다 가까우면 경로를 찾지 않음 (m) */
const SAME_PLACE_METERS = 100

// 홈에서 도착지를 고르고 넘어오면 navigate state로 { destination, origin }이 들어옴
type RoutesLocationState = { destination?: PlaceResult; origin?: Origin } | null

function readState(state: unknown) {
  const { destination, origin } = (state ?? {}) as NonNullable<RoutesLocationState>
  const valid =
    destination && typeof destination.x === 'number' && typeof destination.y === 'number'
  return { destination: valid ? destination : null, origin: origin ?? peekOrigin() }
}

export default function RoutesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { destination, origin } = readState(location.state)

  const tooClose = !!destination && distanceMeters(origin, destination) < SAME_PLACE_METERS

  // 경로 탐색은 하루 한도가 있어서 같은 조건이면 캐시를 쓰고, 창을 다시 열어도 다시 부르지 않음
  const routesQuery = useQuery({
    queryKey: ['routes', 'search', origin.x, origin.y, destination?.x, destination?.y],
    // 취소 신호(signal)를 일부러 넘기지 않음. 개발 서버(StrictMode)는 화면을 두 번 마운트하는데,
    // 신호를 쓰면 첫 요청을 취소하고 다시 보내서 하루 30회 한도(ODsay)가 두 번 소모됨.
    // 신호가 없으면 진행 중인 요청을 그대로 이어받아 한 번만 호출함
    queryFn: () =>
      searchRoutes({
        startX: origin.x,
        startY: origin.y,
        endX: destination!.x,
        endY: destination!.y,
      }),
    enabled: !!destination && !tooClose,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const picked = useMemo(
    () => (routesQuery.data ? pickRoutes(routesQuery.data.routes) : []),
    [routesQuery.data],
  )

  // 실시간 정보라 경로 탐색보다 짧게 캐시함
  const analysisQuery = useQuery({
    queryKey: [
      'routes',
      'analysis',
      picked.map((r) => r.routeIndex).join(','),
      routesQuery.dataUpdatedAt,
    ],
    queryFn: ({ signal }) => analyzeRoutes(picked, signal),
    enabled: picked.length > 0,
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const plans = useMemo(
    () => buildRoutePlans(picked, analysisQuery.data ?? null),
    [picked, analysisQuery.data],
  )

  // 도착지 없이 주소창으로 바로 열었으면 홈으로
  if (!destination) return <Navigate to={PATHS.home} replace />

  const searching = routesQuery.isPending || (picked.length > 0 && analysisQuery.isPending)
  const analysisFailed = analysisQuery.isError
  const searchFailed = routesQuery.isError
  const empty = routesQuery.isSuccess && picked.length === 0

  // 불러오기 전에는 비워둠 (불러오는 중에는 카드가 아직 없어서 보이지 않는 값)
  const loadedAt = analysisQuery.dataUpdatedAt || routesQuery.dataUpdatedAt
  const departAt = loadedAt ? (formatTime(new Date(loadedAt).toISOString()) ?? '') : ''
  const baseAt = formatTime(analysisQuery.data?.dataBasisAt) ?? departAt

  // 주소창으로 바로 들어와서 되돌아갈 기록이 없으면 홈으로
  const goBack = () => {
    if (location.key === 'default') navigate(PATHS.home, { replace: true })
    else navigate(-1)
  }

  // 고른 후보를 들고 이동 화면 위의 전략 비교(S-03)로 넘어감.
  // navigate state는 복사 가능한 값만 담을 수 있는데, RoutePlan은 순수 데이터라 그대로 넘겨도 됨.
  // 나머지 후보도 같이 넘겨서 전략 비교가 "다른 노선으로 바꾸기"를 찾는 데 씀
  const selectPlan = (plan: RoutePlan) =>
    navigate(PATHS.strategy, {
      state: {
        plan,
        alternatives: plans.filter((p) => p.id !== plan.id),
        origin,
        destination,
      },
    })

  return (
    <div className="bg-surface-sunken flex min-h-[844px] flex-col">
      <RoutesHeader
        origin={originLabel(origin)}
        destination={destination.name}
        departAt={departAt}
        baseAt={baseAt}
        onBack={goBack}
      />

      <main className="px-4 pt-3 pb-14">
        {tooClose ? (
          <Notice>{MESSAGES.sameOriginDestination}</Notice>
        ) : searchFailed || empty ? (
          <Notice>
            {MESSAGES.routeNotFound}
            {searchFailed && (
              <button
                type="button"
                onClick={() => void routesQuery.refetch()}
                className="bg-brand-weak text-brand-strong text-label1 mt-4 rounded-[10px] px-4 py-2.5 font-semibold"
              >
                다시 시도
              </button>
            )}
          </Notice>
        ) : searching ? (
          <LoadingCards />
        ) : (
          <>
            {analysisFailed && (
              <p role="status" className="text-note text-text-secondary mb-3 px-1">
                {MESSAGES.analysisUnavailable}
              </p>
            )}
            <ul className="flex flex-col gap-3">
              {plans.map((plan) => (
                <li key={plan.id}>
                  {/* 실시간 분석이 안 되는 후보는 전략 비교를 할 수 없어서 누를 수 없음 */}
                  <RoutePlanCard
                    plan={plan}
                    onSelect={plan.level === '정보 없음' ? undefined : selectPlan}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="text-label1 text-text-secondary flex flex-col items-center px-6 py-16 text-center"
    >
      {children}
    </div>
  )
}

// 불러오는 동안 카드 자리를 미리 잡아둠
function LoadingCards() {
  return (
    <div role="status" aria-label="경로를 찾고 있어요" className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-surface-default h-[190px] animate-pulse rounded-[20px]" />
      ))}
    </div>
  )
}
