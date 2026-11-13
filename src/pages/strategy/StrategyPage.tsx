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
import { toRouteInput } from '@/apis/routes'
import { fetchStrategies, type StrategyView } from '@/apis/strategies'
import { createTrip } from '@/apis/trip'
import { MESSAGES } from '@/constants/messages'
import type { PlaceResult } from '@/pages/place-search/components/PlaceResultItem'
import type { RoutePlan } from '@/pages/routes/components/RoutePlanCard'
import { ACTIVE_TRIP_QUERY_KEY } from '@/pages/trip/useTripSession'
import { PATHS } from '@/routes/paths'

import StrategyMapPreview from './components/StrategyMapPreview'
import StrategyOverlay, { BackIcon } from './components/StrategyOverlay'
import type { StrategyOption } from './components/StrategySheet'
import { buildCreateTripRequest, buildStrategyUi } from './strategyView'

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
    onSuccess: () => {
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
        loading={strategiesQuery.isPending}
        failed={strategiesQuery.isError}
        onRetry={() => void strategiesQuery.refetch()}
        onClose={close}
        onConfirm={confirm}
        confirming={startTrip.isPending}
        confirmError={confirmError}
        fallbackOriginLabel={plan.headline.split(' · ')[0]}
      />
    </div>
  )
}

type OverlayWithMapProps = {
  ui: ReturnType<typeof buildStrategyUi> | null
  loading: boolean
  failed: boolean
  onRetry: () => void
  onClose: () => void
  onConfirm: (option: StrategyOption) => void
  confirming: boolean
  confirmError?: string
  fallbackOriginLabel: string
}

// 지도 + 전략 시트. 시트에서 [상세]를 누른 전략에 맞게 지도 이름표도 바뀜
function StrategyOverlayWithMap({
  ui,
  loading,
  failed,
  onRetry,
  onClose,
  onConfirm,
  confirming,
  confirmError,
  fallbackOriginLabel,
}: OverlayWithMapProps) {
  const [detailId, setDetailId] = useState<string | null>(null)

  if (!ui) {
    return (
      <>
        <StrategyMapPreview stopLabel="" originLabel={fallbackOriginLabel} />
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

  const originLabel = ui.originLabel || fallbackOriginLabel
  const selectedLabel =
    ui.options.find((o) => o.id === (detailId ?? ui.defaultSelectedId))?.mapLabel ?? ''
  // 그대로 타기는 지금 정류장과 같은 이름이라 이름표를 한 번만 보여줌
  const stopLabel = selectedLabel === originLabel ? '' : selectedLabel

  return (
    <>
      <StrategyMapPreview stopLabel={stopLabel} originLabel={originLabel} />
      <StrategyOverlay
        {...ui.summary}
        strategies={ui.options}
        defaultSelectedId={ui.defaultSelectedId}
        onClose={onClose}
        onConfirm={onConfirm}
        onDetail={(strategy) => setDetailId(strategy.id)}
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
