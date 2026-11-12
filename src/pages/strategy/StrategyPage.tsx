// S-03 전략 비교 (기능 1)
// 관련 기능: F-03-01~08
//
// 전략 비교는 이동 중 화면 위에 얹는 StrategyOverlay로 만들어져 있음.
// 이 페이지는 이동 중 페이지가 아직 아래에 없을 때 /strategy에서 단독으로 확인하는 용도.
// 이동 중 페이지(/trip)는 다른 담당자 페이지라 여기서는 닫거나 출발할 때 그리로 이동만 시킴.
// 이동 중 페이지가 StrategyOverlay를 직접 띄우면 이동 없이 같은 화면 위에서 열고 닫히므로 이 페이지는 필요 없어짐

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import type { RoutePlan } from '@/pages/routes/components/RoutePlanCard'
import { PATHS } from '@/routes/paths'
import type { Stage } from '@/types/stage'

import StrategyMapPreview from './components/StrategyMapPreview'
import StrategyOverlay from './components/StrategyOverlay'
import { Em, type StrategyOption, type StrategySummary } from './components/StrategySheet'

// TODO: 아래 값들은 전략 비교 API 연동 전 임시 데이터. 연동하면 응답을 StrategyOverlay props 모양으로 바꿔서 넘기면 됨
const MOCK_STRATEGIES: StrategyOption[] = [
  {
    id: 'move-forward',
    tag: { label: '추천', tone: 'recommend' },
    title: '앞 정류장에서 5003번 타기',
    level: '가능',
    timeLabel: '예상',
    time: '61분',
    detail: '도보 7분 · 예측 빈자리 6석',
    note: '한 정류장 앞(동백 쥬네브)에서 타면 자리가 더 여유 있어요',
    mapLabel: '앞 정류장 · 동백 쥬네브',
    // [상세]를 누르면 시트 위쪽 요약이 이 값으로 바뀜. 안 적은 항목은 현재 경로 값 그대로
    summary: {
      title: '동백 쥬네브 → 강남역',
      arrivesInMinutes: 12,
      level: '가능',
      levelLabel: '탑승 가능',
      slack: { value: '9분', level: '가능' },
      seats: { value: '6석', level: '가능' },
    },
  },
  {
    id: 'stay',
    tag: { label: '현재 경로', tone: 'current' },
    title: '그대로 5003번 타기',
    level: '주의',
    timeLabel: '실패 시',
    timeLabelTone: 'warn',
    time: '76분',
    detail: '성공 시 58분 · 다음 도착 18분 후',
    mapLabel: '현재 정류장 · 동백2차',
    note: (
      <>
        여유 <Em>2</Em>분, 예측 빈자리 <Em>3</Em>석이라 못 탈 수 있어요
      </>
    ),
  },
  {
    id: 'switch-5005',
    title: '5005번으로 바꾸기',
    level: '가능',
    timeLabel: '예상',
    time: '64분',
    detail: '동백 호수공원 · 도보 6분',
    note: '15분 후 도착 · 예측 빈자리 21석',
    mapLabel: '동백 호수공원',
    summary: {
      routeBadge: { type: '광역', label: '5005' },
      title: '동백 호수공원 → 강남역',
      arrivesInMinutes: 15,
      level: '가능',
      levelLabel: '탑승 가능',
      slack: { value: '12분', level: '가능' },
      seats: { value: '21석', level: '가능' },
    },
  },
]

// 후보 경로 목록(S-02)에서 카드를 누르면 navigate state로 { plan, origin, destination }이 들어옴
type StrategyLocationState = { plan: RoutePlan; origin?: string; destination?: string } | null

// 주소창으로 바로 열었을 때(고른 후보가 없을 때) 보여줄 기본 요약
const DEFAULT_SUMMARY: StrategySummary = {
  routeBadge: { type: '광역', label: '5003' },
  title: '동백2차 → 강남역',
  baseAt: '07:29',
  arrivesInMinutes: 11,
  level: '주의',
  levelLabel: '탑승 주의',
  slack: { value: '2분', level: '주의' },
  seats: { value: '3석', level: '주의' },
}
const DEFAULT_ORIGIN_LABEL = '동백2차'

// 고른 후보 경로를 시트 위쪽 요약으로 바꿈. 첫 번째 탈 것(ride) 구간 기준
// TODO: 전략 비교 API 연동 후에는 응답의 요약 값을 그대로 쓰면 됨 (지금은 후보 카드에 있는 값만 옮김)
function summaryFromPlan(
  plan: RoutePlan,
  origin: string | undefined,
  destination: string | undefined,
): { summary: StrategySummary; originLabel: string } {
  const ride = plan.items.find((item) => item.kind === 'ride')
  const board = ride?.kind === 'ride' ? ride.scenario.board : undefined
  const heading = ride?.kind === 'ride' ? ride.heading : undefined

  const badge = heading?.badge ?? plan.badges[0]
  const level = heading?.level ?? plan.level
  const stage: Stage = level === '정보 없음' ? '주의' : level

  // 카드 제목이 "동백2차 · 11분 후" 모양. 없으면 출발지 이름 사용
  const [stop, rest] = plan.headline.split(' · ')
  const originLabel = stop || origin || DEFAULT_ORIGIN_LABEL
  const arrivesInMinutes = Number(rest?.match(/(\d+)분/)?.[1] ?? 0)

  return {
    originLabel,
    summary: {
      ...DEFAULT_SUMMARY,
      routeBadge: badge,
      title: `${originLabel} → ${destination ?? '강남역'}`,
      arrivesInMinutes,
      level,
      levelLabel: heading?.levelLabel ?? (level === '정보 없음' ? undefined : `탑승 ${level}`),
      slack: {
        value: board?.slackMinutes !== undefined ? `${board.slackMinutes}분` : '-',
        level: stage,
      },
      seats: { value: board?.seats !== undefined ? `${board.seats}석` : '-', level: stage },
    },
  }
}
export default function StrategyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as StrategyLocationState
  const { summary, originLabel } = state?.plan
    ? summaryFromPlan(state.plan, state.origin, state.destination)
    : { summary: DEFAULT_SUMMARY, originLabel: DEFAULT_ORIGIN_LABEL }

  // replace로 갈아끼워서 이동 중 화면에서 뒤로가기를 눌러도 이 화면이 다시 열리지 않음
  const goTrip = () => navigate(PATHS.trip, { replace: true })

  // 고른 전략을 이동 중 화면으로 넘김. 경로에 실제로 반영하는 것은 이동 중 화면 담당 몫.
  // navigate state는 복사 가능한 값만 담을 수 있어서(React 요소 불가) id와 제목만 보냄
  const startWith = (strategy: StrategyOption) =>
    navigate(PATHS.trip, {
      replace: true,
      // justStarted: 이동 중 화면(TripPage)이 "방금 출발"로 읽는 값
      state: { justStarted: true, strategy: { id: strategy.id, title: strategy.title } },
    })

  // [상세]를 누른 전략에 맞게 지도 이름표도 바뀜
  const [mapLabel, setMapLabel] = useState(MOCK_STRATEGIES[0].mapLabel ?? '')

  return (
    <div className="bg-surface-default relative min-h-[844px]">
      {/* 이동 중 화면 대신 보이는 임시 지도 */}
      <StrategyMapPreview stopLabel={mapLabel} originLabel={originLabel} />
      <StrategyOverlay
        {...summary}
        strategies={MOCK_STRATEGIES}
        onClose={goTrip}
        onConfirm={startWith}
        onDetail={(strategy) => setMapLabel(strategy.mapLabel ?? '')}
      />
    </div>
  )
}
