// S-03 전략 비교 (기능 1)
// 관련 기능: F-03-01~08
// POST /api/v1/strategies  전략 비교·추천 (apis/strategies.ts)
// POST /api/v1/trips       [이 전략으로 출발] (apis/trip.ts)
//
// 전략 비교는 이동 중 화면 위에 얹는 StrategyOverlay로 만들어져 있음.
// 이 페이지는 후보 경로(S-02)에서 카드를 누르면 오는 화면으로, 뒤에는 임시 지도가 깔려 있음.
// 이동 중 페이지(/trip)는 다른 담당자 페이지라 여기서는 출발할 때 그리로 이동만 시킴.
// 이동 중 페이지가 StrategyOverlay를 직접 띄우면(이동 중 다시 보기) 이 페이지를 거치지 않아도 됨

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { ApiError } from '@/apis/client'
import { peekOrigin, type Origin } from '@/apis/places'
import { toRouteInput, type RouteInfo } from '@/apis/routes'
import { fetchStrategies, type StrategyView } from '@/apis/strategies'
import { createTrip } from '@/apis/trip'
import { geometryFromRoute, saveTripGeometry, transitLines } from '@/components/map/geometry'
import { MESSAGES } from '@/constants/messages'
import type { PlaceResult } from '@/pages/place-search/components/PlaceResultItem'
import type { RoutePlan } from '@/pages/routes/components/RoutePlanCard'
import { ACTIVE_TRIP_QUERY_KEY } from '@/pages/trip/useTripSession'
import { PATHS } from '@/routes/paths'

import StrategyMapPreview from './components/StrategyMapPreview'
import StrategyOverlay, { BackIcon } from './components/StrategyOverlay'
import type { StrategyOption } from './components/StrategySheet'
import {
  buildCreateTripRequest,
  buildStrategyUi,
  strategyGeometry,
  strategyMapLabels,
} from './strategyView'

/** 대체 노선을 찾는 데 같이 보내는 다른 후보 최대 개수 */
const MAX_ALTERNATIVES = 4

// 후보 경로 목록(S-02)에서 카드를 누르면 navigate state로 들어옴
type StrategyLocationState = {
  plan?: RoutePlan
  alternatives?: RoutePlan[]
  origin?: Origin
  destination?: PlaceResult
} | null

export default function StrategyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const state = location.state as StrategyLocationState
  const plan = state?.plan ?? null
  const destination = state?.destination ?? null
  const origin = state?.origin ?? peekOrigin()
  // 나머지 후보는 분석이 안 되는 경로(지하철만 있는 경로 등)도 그대로 보냄.
  // BE가 후보를 보고 "다른 노선으로 바꾸기", "지하철로 가기" 같은 대안 전략을 정함
  const alternatives = useMemo(
    () => (state?.alternatives ?? []).slice(0, MAX_ALTERNATIVES),
    [state?.alternatives],
  )
  const alternativeRoutes = useMemo(() => alternatives.map((p) => p.route), [alternatives])

  const strategiesQuery = useQuery({
    queryKey: [
      'strategies',
      plan?.route.routeIndex,
      alternatives.map((p) => p.route.routeIndex).join(','),
      origin.x,
      origin.y,
    ],
    queryFn: ({ signal }) =>
      fetchStrategies(
        {
          selectedRoute: toRouteInput(plan!.route),
          alternativeRoutes: alternatives.map((p) => toRouteInput(p.route)),
          alightUpdates: [],
          currentLocation: { x: origin.x, y: origin.y },
        },
        signal,
      ),
    enabled: !!plan,
    // 실시간 값이라 오래 쓰지 않음. 목록으로 갔다 바로 돌아오면 다시 부르지 않을 정도로만 캐시
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const ui = useMemo(() => {
    if (!strategiesQuery.data || !plan || !destination) return null
    const known = [plan, ...alternatives].flatMap((p) => p.badges)
    return buildStrategyUi(strategiesQuery.data, known, destination.name)
  }, [strategiesQuery.data, plan, alternatives, destination])

  // 출발: 고른 전략의 구간으로 이동 세션을 만들고 이동 중 화면으로
  const startTrip = useMutation({
    mutationFn: (variables: { strategy: StrategyView; routeIndex: number; destName: string }) =>
      createTrip(
        buildCreateTripRequest(variables.strategy, variables.routeIndex, variables.destName),
      ),
    onSuccess: (created, { strategy }) => {
      // 이동 중 화면 지도에 쓸 정류장 좌표를 기기에 저장 (이동 중 응답에는 좌표가 없음).
      // 출발 위치(사용자 위치)는 넣지 않음
      if (plan && destination) {
        saveTripGeometry(
          created.tripId,
          transitLines(strategy.route.segments),
          strategyGeometry(strategy, plan.route, alternativeRoutes, destination),
        )
      }
      // 이동 중 화면이 예전의 "진행 중인 이동 없음" 기록을 보고 홈으로 돌아가지 않게 비워둠
      queryClient.removeQueries({ queryKey: ACTIVE_TRIP_QUERY_KEY })
      // replace로 갈아끼워서 이동 중 화면에서 뒤로가기를 눌러도 이 화면이 다시 열리지 않음
      // justStarted: 이동 중 화면(TripPage)이 "방금 출발"로 읽는 값
      navigate(PATHS.trip, { replace: true, state: { justStarted: true } })
    },
  })

  // 고른 후보 없이 주소창으로 바로 열었으면 홈으로
  if (!plan || !destination) return <Navigate to={PATHS.home} replace />

  // 후보 경로 목록으로 돌아감 (아직 이동을 시작하지 않아서 이동 중 화면으로 갈 곳이 없음)
  const close = () => navigate(-1)

  const confirm = (option: StrategyOption) => {
    const strategy = ui?.views.get(option.id)
    if (!strategy) return
    startTrip.mutate({ strategy, routeIndex: plan.route.routeIndex, destName: destination.name })
  }

  const confirmError = startTrip.isError
    ? startTrip.error instanceof ApiError && startTrip.error.status === 409
      ? `${MESSAGES.ongoingTrip}. 먼저 종료해 주세요`
      : '출발하지 못했어요. 다시 시도해 주세요'
    : undefined

  return (
    <div className="bg-surface-default relative min-h-[844px]">
      <StrategyOverlayWithMap
        ui={ui}
        route={plan.route}
        alternativeRoutes={alternativeRoutes}
        origin={origin}
        destination={destination}
        loading={strategiesQuery.isPending}
        failed={strategiesQuery.isError}
        onRetry={() => void strategiesQuery.refetch()}
        onClose={close}
        onConfirm={confirm}
        confirming={startTrip.isPending}
        confirmError={confirmError}
      />
    </div>
  )
}

type OverlayWithMapProps = {
  ui: ReturnType<typeof buildStrategyUi> | null
  /** 고른 후보 경로 (좌표가 있는 경로 탐색 응답) */
  route: RouteInfo
  alternativeRoutes: RouteInfo[]
  origin: Origin
  destination: PlaceResult
  loading: boolean
  failed: boolean
  onRetry: () => void
  onClose: () => void
  onConfirm: (option: StrategyOption) => void
  confirming: boolean
  confirmError?: string
}

// 지도 + 전략 시트. 시트에서 [상세]를 누른 전략에 맞게 지도 경로·이름표도 바뀜
function StrategyOverlayWithMap({
  ui,
  route,
  alternativeRoutes,
  origin,
  destination,
  loading,
  failed,
  onRetry,
  onClose,
  onConfirm,
  confirming,
  confirmError,
}: OverlayWithMapProps) {
  // 지도가 보여줄 전략 id. 카드를 누르면 그 전략, [상세] 후에는 펼친 전략, 처음에는 없음(지금 고른 경로)
  const [shownId, setShownId] = useState<string | null>(null)
  // 위치를 못 써서 기본 출발지(동백역)를 쓰는 경우에는 내 위치 점을 찍지 않음
  const myLocation = origin.isCurrent ? origin : null

  if (!ui) {
    // 전략을 불러오는 동안에도 고른 후보 경로는 보여줌
    const geometry = geometryFromRoute(route, { origin, destination })
    return (
      <>
        <StrategyMapPreview
          geometry={geometry}
          labels={strategyMapLabels(geometry, '')}
          myLocation={myLocation}
          origin={origin}
        />
        <StatusSheet onClose={onClose}>
          {loading ? (
            <p className="text-label1 text-text-secondary">전략을 분석하고 있어요</p>
          ) : (
            <>
              <p className="text-label1 text-text-secondary">
                {failed ? '전략을 불러오지 못했어요' : MESSAGES.routeNotFound}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="bg-brand-weak text-brand-strong text-label1 mt-4 rounded-[10px] px-4 py-2.5 font-semibold"
              >
                다시 시도
              </button>
            </>
          )}
        </StatusSheet>
      </>
    )
  }

  // 지도에는 처음에는 지금 고른 경로를 그리고, 전략 카드를 누르면 그 전략의 경로로 바뀜
  const shown = shownId ? ui.views.get(shownId) : undefined
  const option = ui.options.find((o) => o.id === shownId)
  const geometry = shown
    ? strategyGeometry(shown, route, alternativeRoutes, destination, origin)
    : geometryFromRoute(route, { origin, destination })

  return (
    <>
      <StrategyMapPreview
        geometry={geometry}
        labels={strategyMapLabels(geometry, option?.mapLabel ?? '')}
        myLocation={myLocation}
        origin={origin}
      />
      <StrategyOverlay
        strategies={ui.options}
        onClose={onClose}
        onConfirm={onConfirm}
        onShownChange={setShownId}
        confirming={confirming}
        confirmError={confirmError}
      />
    </>
  )
}

// 전략을 불러오는 동안, 또는 실패했을 때 시트 자리에 보여주는 안내
function StatusSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed top-0 bottom-0 left-1/2 z-40 w-[390px] -translate-x-1/2">
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="bg-surface-default shadow-elevation-1 pointer-events-auto absolute top-[66px] left-4 flex size-10 items-center justify-center rounded-full"
      >
        <BackIcon />
      </button>
      <div
        role="status"
        className="bg-surface-default shadow-elevation-2 pointer-events-auto absolute inset-x-0 top-[313px] bottom-0 flex flex-col items-center rounded-t-3xl px-5 pt-16 text-center"
      >
        {children}
      </div>
    </div>
  )
}
