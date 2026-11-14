// 전략 비교 응답을 화면(StrategyOverlay)이 받는 모양으로 바꾸는 함수
// 화면 컴포넌트는 API 모양을 몰라도 되게, 변환은 전부 여기서 함

import type { RouteInfo, SegmentView } from '@/apis/routes'
import type { StrategyResponse, StrategyView } from '@/apis/strategies'
import type { MapLabel } from '@/components/map/base'
import { geometryFromRoute, type RouteGeometry } from '@/components/map/geometry'
import type { MapPoint } from '@/components/map/kakao'
import type { MatchStatus, SegmentMode, StageCode } from '@/types/api'
import type { CreateTripRequest } from '@/types/tripApi'
import { toStageLabel as toLabel } from '@/utils/codeLabels'
import { formatTime, minutesBetween } from '@/utils/time'

import type { RouteBadge } from '@/pages/routes/components/RoutePlanCard'
import { guessBusType } from '@/pages/routes/routePlans'

import type { StrategyOption, StrategySummary } from './components/StrategySheet'

// 실시간 정보가 없으면 BE가 단계를 null로 줌 → 정보 없음
const stageOf = (code: StageCode | null) => toLabel(code ?? 'UNKNOWN')

type StrategyUi = {
  /** 시트 위쪽 기본 요약 (지금 고른 경로 기준) */
  summary: StrategySummary
  options: StrategyOption[]
  /** 처음 선택돼 있을 전략 id (추천) */
  defaultSelectedId: string | undefined
  /** 카드 id → 응답 원본. 출발할 때 구간을 그대로 보내려고 보관 */
  views: Map<string, StrategyView>
  /** 지도에 띄우는 현재 정류장 이름 */
  originLabel: string
}

/** 노선 번호로 배지 종류를 찾음. 후보 경로 화면에서 받은 배지를 우선 쓰고, 없으면 번호 모양으로 추정 */
function makeBadgeFinder(known: RouteBadge[]) {
  return (label: string | null): RouteBadge => {
    const name = label ?? ''
    const found = known.find((b) => b.label === name)
    if (found) return found
    return { type: guessBusType(name), label: name }
  }
}

const levelLabelOf = (level: string) => (level === '정보 없음' ? undefined : `탑승 ${level}`)

function summaryOf(
  view: SegmentView,
  badge: RouteBadge,
  destination: string,
  dataBasisAt: string,
): StrategySummary {
  const level = stageOf(view.boardingStage)
  const hasSeats = view.seatType !== 'NONE' && view.remainSeats !== null
  return {
    routeBadge: badge,
    title: `${view.boardName ?? ''} → ${destination}`,
    baseAt: formatTime(dataBasisAt) ?? '',
    arrivesInMinutes: Math.max(0, minutesBetween(dataBasisAt, view.predictedBusArrivalAt) ?? 0),
    level,
    levelLabel: levelLabelOf(level),
    slack: {
      value: view.slackMin === null ? '-' : `${view.slackMin}분`,
      level: stageOf(view.slackStage),
    },
    seats: {
      value: hasSeats ? `${view.remainSeats}석` : '-',
      level: hasSeats ? stageOf(view.seatStage) : '정보 없음',
    },
  }
}

/** 전략마다 지도에 띄울 이름표 */
function mapLabelOf(strategy: StrategyView): string {
  if (strategy.moveToName) {
    const prefix =
      strategy.strategyType === 'BACKTRACK'
        ? '앞 정류장 · '
        : strategy.strategyType === 'DETOUR'
          ? '다른 정류장 · '
          : ''
    return prefix + strategy.moveToName
  }
  const board = strategy.route.segments.find((s) => s.mode === 'BUS')?.boardName
  // 지하철로 가기처럼 정류장이 없는 전략은 이름표를 띄우지 않음
  return board ?? ''
}

function optionOf(
  strategy: StrategyView,
  id: string,
  response: StrategyResponse,
  findBadge: (label: string | null) => RouteBadge,
  destination: string,
): StrategyOption {
  const level = stageOf(strategy.strategyRiskStage)
  // 위험하거나 정보가 부족한 전략은 "실패 시" 시간을 먼저 보여줌 (못 탈 수 있다는 걸 알리려고)
  const warn = level !== '가능' && strategy.totalMinIfMiss !== null
  const hasSeats = strategy.seatType !== 'NONE' && strategy.remainSeats !== null
  const nextIn = minutesBetween(response.dataBasisAt, strategy.nextBusArrivalAt)

  const detail = warn
    ? [
        strategy.totalMinIfBoard !== null && `성공 시 ${strategy.totalMinIfBoard}분`,
        nextIn !== null && `다음 도착 ${Math.max(0, nextIn)}분 후`,
      ]
    : [
        strategy.moveToName,
        strategy.extraWalkMin ? `도보 ${strategy.extraWalkMin}분` : null,
        hasSeats &&
          `${strategy.seatType === 'PREDICTED' ? '예측 ' : ''}빈자리 ${strategy.remainSeats}석`,
      ]

  const time = warn
    ? strategy.totalMinIfMiss
    : (strategy.totalMinIfBoard ?? strategy.comparisonValueMin)

  // [상세]를 누르면 이 전략 기준으로 시트 위쪽 요약이 바뀜
  const seg = strategy.analysis[0]
  const label =
    seg?.routeLabel ?? strategy.route.segments.find((s) => s.mode === 'BUS')?.routeLabel ?? null
  const summary = seg
    ? summaryOf(seg, findBadge(label), destination, response.dataBasisAt)
    : undefined

  return {
    id,
    tag: strategy.recommended
      ? { label: '추천', tone: 'recommend' }
      : strategy.isCurrent
        ? { label: '현재 경로', tone: 'current' }
        : undefined,
    title: strategy.title,
    level,
    timeLabel: warn ? '실패 시' : '예상',
    timeLabelTone: warn ? 'warn' : 'default',
    time: time === null || time === undefined ? '-' : `${time}분`,
    detail: detail.filter(Boolean).join(' · '),
    note: strategy.reasons.join(' · '),
    mapLabel: mapLabelOf(strategy),
    summary,
  }
}

/**
 * @param knownBadges 후보 경로 화면에서 이미 알고 있는 노선 배지 (선택한 후보 + 나머지 후보)
 * @param destination 도착지 이름
 */
export function buildStrategyUi(
  response: StrategyResponse,
  knownBadges: RouteBadge[],
  destination: string,
): StrategyUi {
  const findBadge = makeBadgeFinder(knownBadges)

  const views = new Map<string, StrategyView>()
  const options = response.strategies.map((strategy, index) => {
    const id = `${strategy.strategyType}-${index}`
    views.set(id, strategy)
    return optionOf(strategy, id, response, findBadge, destination)
  })

  // 기본 요약: 지금 고른 경로의 첫 분석 구간. 분석이 안 되는 경로면 정보 없음으로 보여줌
  const current = response.currentRoute.segments[0]
  const keep = response.strategies.find((s) => s.isCurrent)
  const label =
    current?.routeLabel ?? keep?.route.segments.find((s) => s.mode === 'BUS')?.routeLabel ?? null
  const summary: StrategySummary = current
    ? summaryOf(current, findBadge(label), destination, response.dataBasisAt)
    : {
        routeBadge: findBadge(label),
        title: `${keep?.route.segments[0]?.alightName ?? ''} → ${destination}`,
        baseAt: formatTime(response.dataBasisAt) ?? '',
        arrivesInMinutes: 0,
        level: '정보 없음',
        slack: { value: '-', level: '정보 없음' },
        seats: { value: '-', level: '정보 없음' },
      }

  const recommended = response.strategies.findIndex((s) => s.recommended)
  return {
    summary,
    options,
    defaultSelectedId: options[recommended >= 0 ? recommended : 0]?.id,
    views,
    originLabel: current?.boardName ?? '',
  }
}

/** [이 전략으로 출발]을 눌렀을 때 POST /trips로 보내는 값 (strategies[].route.segments를 그대로 보냄) */
export function buildCreateTripRequest(
  strategy: StrategyView,
  routeIndex: number,
  destName: string,
): CreateTripRequest {
  return {
    destName,
    strategyType: strategy.strategyType,
    expectedArrivalAt: strategy.expectedArrivalAt,
    selectedRoute: {
      routeIndex,
      segments: strategy.route.segments.map((s) => ({
        seq: s.seq,
        mode: s.mode as SegmentMode,
        gbisRouteId: s.gbisRouteId,
        routeLabel: s.routeLabel,
        boardStationId: s.boardStationId,
        alightStationId: s.alightStationId,
        boardName: s.boardName,
        alightName: s.alightName,
        matchStatus: s.matchStatus as MatchStatus,
        plannedStartAt: s.plannedStartAt,
        plannedEndAt: s.plannedEndAt,
        walkMin: s.walkMin,
        userAlightAt: s.userAlightAt,
      })),
    },
    alternativeRoutes: [],
  }
}

// ── 지도 ────────────────────────────────────────────────────────────

/**
 * 전략이 어떤 후보 경로를 타는지 찾음.
 * 전략 응답의 구간에는 좌표가 없어서, 좌표가 있는 후보 경로(경로 탐색 응답)와 정류장 ID·이름·노선으로 맞춰봄
 */
function matchRoute(strategy: StrategyView, candidates: RouteInfo[]): RouteInfo | null {
  const legs = strategy.route.segments.filter((s) => s.mode !== 'WALK')
  let best: RouteInfo | null = null
  let bestScore = 0
  for (const route of candidates) {
    const segs = route.segments.filter((s) => s.mode !== 'WALK')
    let score = 0
    for (const leg of legs) {
      const hit = segs.find(
        (s) =>
          s.mode === leg.mode &&
          ((!!leg.boardStationId && s.startLocalStationId === leg.boardStationId) ||
            (!!leg.alightStationId && s.endLocalStationId === leg.alightStationId) ||
            (!!leg.boardName && s.startName === leg.boardName) ||
            (!!leg.alightName && s.endName === leg.alightName)),
      )
      if (!hit) continue
      score += 1
      if (leg.routeLabel && hit.busOptions.some((o) => o.busNo === leg.routeLabel)) score += 1
    }
    if (score > bestScore) {
      best = route
      bestScore = score
    }
  }
  return best
}

/** 전략 하나를 지도 모양으로. origin을 빼면 정류장 좌표만 담김 (이동 중 화면 저장용) */
export function strategyGeometry(
  strategy: StrategyView,
  selectedRoute: RouteInfo,
  alternatives: RouteInfo[],
  destination: { x: number; y: number; name: string },
  origin?: MapPoint,
): RouteGeometry {
  const route = matchRoute(strategy, [selectedRoute, ...alternatives]) ?? selectedRoute
  const moveTo =
    strategy.strategyType === 'BACKTRACK' &&
    strategy.moveToName &&
    strategy.moveToX !== null &&
    strategy.moveToY !== null
      ? { x: strategy.moveToX, y: strategy.moveToY, name: strategy.moveToName }
      : undefined
  return geometryFromRoute(route, { origin, destination, moveTo })
}

/** 지도 이름표: 타는 정류장 이름, 옮겨 타면 그 정류장에 전략 이름표 */
export function strategyMapLabels(geometry: RouteGeometry, selectedMapLabel: string): MapLabel[] {
  const labels: MapLabel[] = []
  const moveTo = geometry.stops.find((s) => s.kind === 'moveTo')
  const board = geometry.stops.find((s) => s.kind === 'board')
  if (moveTo) labels.push({ point: moveTo, text: selectedMapLabel || moveTo.name, tone: 'brand' })
  if (board) labels.push({ point: board, text: board.name })
  return labels
}
