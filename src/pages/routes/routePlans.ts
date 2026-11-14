// 후보 경로 응답(경로 탐색 + 위험 분석)을 후보 카드(RoutePlan)로 바꾸는 함수
// 화면 컴포넌트는 API 모양을 몰라도 되게, 변환은 전부 여기서 함

import type {
  AnalysisResponse,
  BusOption,
  RouteInfo,
  SegmentInfo,
  SegmentView,
} from '@/apis/routes'
import type { StageCode } from '@/types/api'
import type { StageWithUnknown } from '@/types/stage'
import type { TransitType } from '@/types/transit'
import { toStageLabel as toLabel } from '@/utils/codeLabels'
import { formatTime, minutesBetween } from '@/utils/time'

import type { PlanItem, RouteBadge, RoutePlan } from './components/RoutePlanCard'

// 실시간 정보가 없으면 BE가 단계를 null로 줌 → 정보 없음
const stageOf = (code: StageCode | null) => toLabel(code ?? 'UNKNOWN')

/** 화면에 보여줄 후보 최대 개수. 분석 요청도 이만큼만 보냄 */
const MAX_ROUTES = 5
/** 버스가 충분히 있을 때 분석이 안 되는 경로(지하철만 있는 경로 등)는 이만큼만 섞음 */
const MIN_OTHER_ROUTES = 1

const hasBus = (route: RouteInfo) =>
  route.segments.some(
    (s) => s.mode === 'BUS' && s.startLocalStationId && s.endLocalStationId && s.busOptions.length,
  )

/**
 * 탐색 결과(보통 10개 이상) 중 보여줄 후보를 최대 5개 고름.
 * 이 서비스는 버스 실시간 분석이 핵심이라 버스가 있는 경로를 먼저 담고,
 * 버스 경로가 모자라면(시연 지역 밖 등) 나머지 경로로 채움
 */
export function pickRoutes(routes: RouteInfo[]): RouteInfo[] {
  const busAll = routes.filter(hasBus)
  const otherAll = routes.filter((r) => !hasBus(r))
  const otherCount = Math.max(MIN_OTHER_ROUTES, MAX_ROUTES - busAll.length)
  const other = otherAll.slice(0, otherCount)
  const bus = busAll.slice(0, MAX_ROUTES - other.length)
  return [...bus, ...other].sort((a, b) => a.routeIndex - b.routeIndex)
}

// ── 노선 배지 ───────────────────────────────────────────────────────

function busType(option: BusOption | undefined): TransitType {
  if (option?.busType === '광역') return '광역'
  if (option?.busType === '마을') return '마을'
  return '일반'
}

/** 노선 종류가 응답에 없을 때 번호 모양으로 추정 (5003·9401처럼 5·9로 시작하는 4자리는 광역) */
export function guessBusType(label: string | null): TransitType {
  return /^[59]\d{3}/.test(label ?? '') ? '광역' : '일반'
}

/** 번호만 (배지 안에는 "번"을 붙이지 않음) */
export function busBadge(option: BusOption | undefined): RouteBadge | null {
  return option ? { type: busType(option), label: option.busNo } : null
}

// TODO: 에버라인·수인분당 외 호선(신분당선, GTX-A, 2호선 등)은 LineBadge 종류에 없어서 배지 없이 글자로만 보여줌.
// 디자인에서 호선 색을 정하면 TransitType에 추가하기
function subwayBadge(lineName: string | null): RouteBadge | null {
  if (lineName?.includes('에버')) return { type: '에버라인', label: '에버' }
  if (lineName?.includes('수인')) return { type: '수인분당', label: '수인' }
  return null
}

function badgeOf(segment: SegmentInfo): RouteBadge | null {
  return segment.mode === 'BUS' ? busBadge(segment.busOptions[0]) : subwayBadge(segment.lineName)
}

// ── 카드 만들기 ─────────────────────────────────────────────────────

const STAGE_RANK: Record<StageCode, number> = { OK: 0, CAUTION: 1, RISK: 2, UNKNOWN: 3 }

const levelLabelOf = (level: StageWithUnknown) =>
  level === '정보 없음' ? undefined : `탑승 ${level}`

function rideItem(
  segment: SegmentInfo,
  view: SegmentView,
  analysis: AnalysisResponse,
  withHeading: boolean,
  fallbackTotalMin: number,
): PlanItem {
  const level = stageOf(view.boardingStage)
  const hasSeats = view.seatType !== 'NONE' && view.remainSeats !== null
  const hasNext = view.arriveIfMiss && view.totalMinIfMiss !== null && view.nextBusArrivalAt

  return {
    kind: 'ride',
    heading: withHeading
      ? {
          badge: busBadge(segment.busOptions[0]) ?? { type: '일반', label: view.routeLabel ?? '' },
          text: `${segment.startName ?? ''} 승차 → ${segment.endName ?? ''} 하차`,
          level,
          levelLabel: levelLabelOf(level),
        }
      : undefined,
    scenario: {
      board: {
        time: formatTime(view.arriveIfBoard) ?? '-',
        note: `${view.totalMinIfBoard ?? fallbackTotalMin}분`,
        slackMinutes: view.slackMin ?? undefined,
        seats: hasSeats ? (view.remainSeats ?? undefined) : undefined,
      },
      miss: hasNext
        ? {
            time: formatTime(view.arriveIfMiss) ?? '-',
            note: `${view.totalMinIfMiss}분`,
            nextBus: view.nextRouteLabel ?? view.routeLabel ?? '',
            nextInMinutes: minutesBetween(analysis.evaluatedAt, view.nextBusArrivalAt) ?? 0,
          }
        : undefined,
    },
  }
}

function lineItem(segment: SegmentInfo): PlanItem {
  const name =
    segment.mode === 'BUS'
      ? (segment.busOptions[0]?.busNo ?? '버스')
      : (segment.lineName ?? '지하철')
  return {
    kind: 'line',
    badge: badgeOf(segment),
    text: `${name} · ${segment.startName ?? ''} → ${segment.endName ?? ''} · ${segment.durationMin}분`,
  }
}

/**
 * 후보 경로 → 카드 목록.
 * 실시간 분석은 GBIS 기반 경기버스만 지원해서, 서울 버스 등이 섞인 경로는 분석이 제한됨.
 *  - 탈 버스가 하나도 분석되지 않으면: "실시간 분석 미지원 노선 포함"으로 표시 (경로 정보만 보여줌)
 *  - 일부 버스만 분석되면: 분석된 값을 보여주고 "일부 구간 분석" 표시를 붙임
 * analysis가 없으면(분석 요청 자체가 실패) 모든 후보를 "실시간 정보 없음"으로 보여줌.
 * 순서: 추천 1개 → 나머지 분석되는 경로 → 분석 안 되는 경로
 */
export function buildRoutePlans(
  routes: RouteInfo[],
  analysis: AnalysisResponse | null,
  now = Date.now(),
): RoutePlan[] {
  type Built = { plan: RoutePlan; rank: number; totalMin: number }
  const analyzed: Built[] = []
  const unavailable: RoutePlan[] = []

  for (const route of routes) {
    const result = analysis?.routes.find((r) => r.routeIndex === route.routeIndex)
    const views = new Map((result?.segments ?? []).map((v) => [v.segmentIndex, v]))
    const transit = route.segments.filter((s) => s.mode !== 'WALK')

    const badges: RouteBadge[] = []
    for (const segment of transit) {
      const badge = badgeOf(segment)
      if (badge && !badges.some((b) => b.label === badge.label)) badges.push(badge)
    }

    const firstView = route.segments
      .map((s) => (s.mode === 'BUS' ? views.get(s.segmentIndex) : undefined))
      .find((v): v is SegmentView => !!v)

    if (!analysis || !result?.analyzable || !firstView) {
      unavailable.push({
        id: `route-${route.routeIndex}`,
        badges,
        headline: '',
        level: '정보 없음',
        // 분석 요청이 실패한 경우와 미지원 노선이 섞인 경우를 구분함
        levelLabel: analysis ? '실시간 분석 미지원 노선 포함' : '실시간 정보 없음',
        items: [
          {
            kind: 'unavailable',
            time: formatTime(new Date(now + route.totalTimeMin * 60_000).toISOString()) ?? '-',
            note: `${route.totalTimeMin}분`,
          },
          // 실시간 분석은 없어도 어떤 노선으로 가는지는 보여줌
          ...transit.map(lineItem),
        ],
        route,
      })
      continue
    }

    // 처음과 끝의 도보는 카드에 보여주지 않음 (환승 사이 도보만)
    const first = route.segments.findIndex((s) => s.mode !== 'WALK')
    const last = route.segments.findLastIndex((s) => s.mode !== 'WALK')
    const withHeading = transit.length > 1
    const items: PlanItem[] = []
    route.segments.forEach((segment, index) => {
      if (index < first || index > last) return
      if (segment.mode === 'WALK') {
        if (segment.durationMin > 0)
          items.push({ kind: 'walk', text: `도보 ${segment.durationMin}분` })
        return
      }
      const view = segment.mode === 'BUS' ? views.get(segment.segmentIndex) : undefined
      items.push(
        view
          ? rideItem(segment, view, analysis, withHeading, route.totalTimeMin)
          : lineItem(segment),
      )
    })

    // 탈 버스 중 분석 결과가 없는 버스(서울 버스 등)가 하나라도 있으면 일부 구간만 분석된 경로
    const busCount = route.segments.filter((s) => s.mode === 'BUS').length
    const analyzedBusCount = route.segments.filter(
      (s) => s.mode === 'BUS' && views.has(s.segmentIndex),
    ).length

    const minutesToBus = minutesBetween(analysis.evaluatedAt, firstView.predictedBusArrivalAt)
    analyzed.push({
      rank: STAGE_RANK[result.strategyRiskStage ?? 'UNKNOWN'],
      totalMin: firstView.totalMinIfBoard ?? route.totalTimeMin,
      plan: {
        id: `route-${route.routeIndex}`,
        badges,
        headline:
          minutesToBus === null ? '' : `${firstView.boardName ?? ''} · ${minutesToBus}분 후`,
        level: stageOf(result.strategyRiskStage),
        partial: analyzedBusCount < busCount,
        items,
        route,
      },
    })
  }

  // 추천: 위험 단계가 낮은(안정적인) 경로 중 가장 빨리 도착하는 경로
  // TODO: BE가 후보 경로에도 추천 여부를 내려주면 그 값을 쓰기
  const best = [...analyzed].sort((a, b) => a.rank - b.rank || a.totalMin - b.totalMin)[0]
  const plans = analyzed.map(({ plan }) => ({ ...plan, recommended: plan === best?.plan }))
  plans.sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended))
  return [...plans, ...unavailable]
}
