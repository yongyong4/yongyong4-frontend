// API 응답(진행 중인 이동 + 재평가 결과)을 S-05 화면에 보여줄 값으로 바꿈
// 화면 컴포넌트는 이 결과만 받아서 그리기만 함

import type { StageCode } from '@/types/api'
import type { StageWithUnknown } from '@/types/stage'
import type { TransitType } from '@/types/transit'
import {
  getNextSegmentSeats,
  type ActiveTrip,
  type NextSegment,
  type ReevaluateResponse,
  type TripSegment,
  type TripStatusCode,
} from '@/types/tripApi'
import { toStageLabel } from '@/utils/codeLabels'
import { formatTime, minutesUntil } from '@/utils/time'

/** walking 정류장으로 걷는 중 / waiting 정류장 대기 / riding 탑승 중 / failed 탑승 실패 */
export type TripPhase = 'walking' | 'waiting' | 'riding' | 'failed'

export type StepState = 'done' | 'current' | 'upcoming' | 'end'

export type TimelineStep = {
  key: string
  state: StepState
  title: string
  /** 현재 구간일 때 초록 안내 문구 */
  hint?: string
  sub?: string
}

export type SeatsView =
  | { kind: 'count'; prefix: string; count: number; suffix: string; warn: boolean }
  | { kind: 'none'; text: string }

export type TripAction = 'arriveStop' | 'board' | 'fail' | 'alight' | 'arriveDest'

export type TripView = {
  phase: TripPhase
  statusLabel: string
  topTitle: string
  badge: { type: TransitType; label: string } | null
  sheetTitle: string
  level: { level: StageWithUnknown; label: string } | null
  headline: { value: string; unit: string }
  seats: SeatsView | null
  basisTime: string | null
  info: { label: string; value: string; pill: { level: StageWithUnknown; label: string } } | null
  steps: TimelineStep[]
  /** 지도 위 내 위치 옆 이름표 */
  mapLabel: string
  primary: { action: TripAction; label: string }
  secondary: { action: TripAction; label: string } | null
  /** 상태 변경 API에 보낼 대상 구간 */
  currentSegmentId: number | null
}

const isTransit = (segment: TripSegment) => segment.mode !== 'WALK'

/**
 * 노선 배지 색 종류
 * TODO: BE가 routes/search에 노선 종류를 추가하면 그 값으로 바꾸기. 지금은 번호 모양으로 추정
 */
export function toTransitType(segment: Pick<TripSegment, 'mode' | 'routeLabel'>): TransitType {
  const label = segment.routeLabel ?? ''
  if (segment.mode === 'WALK') return '도보'
  if (segment.mode === 'SUBWAY') return label.includes('에버') ? '에버라인' : '수인분당'
  if (label.includes('마을')) return '마을'
  // 경기도 직행좌석·광역 버스는 대부분 4자리 번호 (예: 5003, 5005)
  return /^\d{4}/.test(label) ? '광역' : '일반'
}

/** 정류장 이름에 "정류장"을 한 번만 붙임 */
export function stopName(name: string | null | undefined) {
  if (!name) return '정류장'
  return name.endsWith('정류장') ? name : `${name} 정류장`
}

/** 화면에 보여줄 단계 (BE 상태 → 화면 단계) */
function toPhase(status: TripStatusCode): TripPhase {
  if (status === 'WAITING') return 'waiting'
  if (status === 'BOARDED') return 'riding'
  if (status === 'BOARD_FAILED') return 'failed'
  return 'walking'
}

/** 지금 어느 구간에 있는지 (segments 배열 위치) */
function findCurrentIndex(
  segments: TripSegment[],
  phase: TripPhase,
  nextSegmentId: number | null,
): number {
  const nextIndex = segments.findIndex((s) => s.segmentId === nextSegmentId)
  const firstTransit = segments.findIndex(isTransit)

  if (phase === 'walking') {
    if (nextIndex > 0) return nextIndex - 1
    return 0
  }
  if (phase === 'waiting' || phase === 'failed') {
    return nextIndex >= 0 ? nextIndex : Math.max(firstTransit, 0)
  }
  // 탑승 중: 다음 버스 구간이 있으면 그 앞의 탈것, 없으면 마지막 탈것
  const searchEnd = nextIndex >= 0 ? nextIndex : segments.length
  for (let i = searchEnd - 1; i >= 0; i -= 1) {
    if (isTransit(segments[i])) return i
  }
  return Math.max(firstTransit, 0)
}

function seatsView(remainSeats: number | null, seatType: string, seatStage?: StageCode): SeatsView {
  if (remainSeats === null || seatType === 'NONE') return { kind: 'none', text: '좌석 정보 없음' }
  const warn = seatStage !== undefined && seatStage !== 'OK'
  if (seatType === 'OBSERVED') {
    return { kind: 'count', prefix: '현재 빈자리 ', count: remainSeats, suffix: '석', warn }
  }
  return { kind: 'count', prefix: '예측 빈자리 ', count: remainSeats, suffix: '석', warn }
}

/** 좌석 수로 단계 정하기 (재평가 명세: 5석 이상 가능, 1~4석 주의, 0석 위험) */
function seatLevel(count: number): StageWithUnknown {
  if (count >= 5) return '가능'
  if (count >= 1) return '주의'
  return '위험'
}

function busArrivalText(minutes: number | null) {
  return minutes === null ? '도착 정보가 없어요' : `${minutes}분 후 도착`
}

function buildSteps(
  segments: TripSegment[],
  currentIndex: number,
  phase: TripPhase,
  next: NextSegment | null,
): TimelineStep[] {
  const lastTransitIndex = segments.reduce((acc, s, i) => (isTransit(s) ? i : acc), -1)
  const steps: TimelineStep[] = []

  segments.forEach((segment, index) => {
    // 마지막 탈것 뒤의 도보는 "○○ 하차" 줄에 합침
    if (index > lastTransitIndex && lastTransitIndex >= 0) return

    const state: StepState =
      index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming'

    if (segment.mode === 'WALK') {
      const target = stopName(segment.alightName)
      steps.push({
        key: String(segment.segmentId),
        state,
        title: state === 'current' ? '정류장까지 걷기' : `도보 ${segment.walkMin ?? '-'}분`,
        hint: state === 'current' ? '도착 후 “도착했어요”를 눌러 주세요' : undefined,
        sub:
          state === 'done' ? `${target} 도착` : state === 'upcoming' ? `${target}까지` : undefined,
      })
      return
    }

    const label = segment.routeLabel ?? ''
    const name = segment.mode === 'BUS' ? `${label}번` : label
    const riding = state === 'current' && phase === 'riding'
    let sub: string | undefined
    if (state === 'upcoming' && next?.segmentId === segment.segmentId) {
      const time = formatTime(next.predictedBusArrivalAt)
      const seats = getNextSegmentSeats(next)
      const seatText =
        seats.remainSeats === null ? '좌석 정보 없음' : `예측 빈자리 ${seats.remainSeats}석`
      sub = [time ? `${time} 도착 예정` : null, seatText].filter(Boolean).join(' · ')
    } else if (state === 'done') {
      sub = `${segment.alightName ?? ''} 하차`
    }

    steps.push({
      key: String(segment.segmentId),
      state,
      title: riding ? `${name} 탑승 중` : `${name} 타기`,
      hint:
        state === 'current'
          ? riding
            ? '도착 후 “도착했어요”를 눌러 주세요'
            : '탑승 후 “탔어요”를 눌러 주세요'
          : undefined,
      sub,
    })
  })

  // 마지막 줄: 마지막 탈것에서 내리는 곳
  const lastTransit = segments[lastTransitIndex]
  if (lastTransit) {
    const finalWalk = segments.slice(lastTransitIndex + 1).find((s) => s.mode === 'WALK')
    const time = formatTime(lastTransit.plannedEndAt)
    steps.push({
      key: 'end',
      state: 'end',
      title: `${lastTransit.alightName ?? '도착지'} 하차`,
      sub: [time ? `${time} 예정` : null, finalWalk?.walkMin ? `도보 ${finalWalk.walkMin}분` : null]
        .filter(Boolean)
        .join(' · '),
    })
  }

  return steps
}

export function buildTripView(
  trip: ActiveTrip,
  evaluation: ReevaluateResponse | null,
  statusOverride: TripStatusCode | null,
  now: number,
): TripView {
  const segments = trip.currentRoute.segments
  const status = statusOverride ?? evaluation?.currentRoute.currentStatus ?? trip.currentStatus
  const phase = toPhase(status)
  const next = evaluation?.currentRoute.nextSegment ?? null
  const currentIndex = findCurrentIndex(segments, phase, next?.segmentId ?? null)
  const current = segments[currentIndex]
  const lastTransitIndex = segments.reduce((acc, s, i) => (isTransit(s) ? i : acc), -1)

  // 이번에 탈(또는 타고 있는) 탈것
  const transit =
    phase === 'walking' ? (segments.slice(currentIndex).find(isTransit) ?? null) : current
  const label = transit?.routeLabel ?? ''
  const busName = transit?.mode === 'BUS' ? `${label}번` : label

  const expectedArrivalAt = evaluation?.currentRoute.expectedArrivalAt ?? trip.expectedArrivalAt
  const origin = segments[0]?.boardName ?? '출발지'
  const arrivalTime = formatTime(expectedArrivalAt)
  const topTitle = `${origin} → ${trip.destName}${arrivalTime ? ` · ${arrivalTime} 도착 예정` : ''}`

  const seats = next ? getNextSegmentSeats(next) : null
  const level = next
    ? { level: toStageLabel(next.boardingStage), label: `탑승 ${toStageLabel(next.boardingStage)}` }
    : null
  const basisTime = formatTime(evaluation?.dataBasisAt ?? null)
  const busMinutes = minutesUntil(next?.predictedBusArrivalAt, now)
  const steps = buildSteps(segments, currentIndex, phase, next)
  const badge = transit ? { type: toTransitType(transit), label } : null

  const base = {
    phase,
    topTitle,
    badge,
    basisTime,
    steps,
    // 정류장 도착·탑승·탑승 실패·하차 모두 "타려는(타고 있는) 탈것" 구간을 보냄 (상태 변경 명세 예시)
    currentSegmentId: transit?.segmentId ?? null,
  }

  if (phase === 'riding') {
    const alightName = transit?.alightName ?? '도착지'
    const finalWalk = segments.slice(lastTransitIndex + 1).find((s) => s.mode === 'WALK')
    // 하차 예정 시각이 없으면 예상 도착 시각에서 마지막 도보를 뺌
    const alightMinutes =
      minutesUntil(transit?.plannedEndAt, now) ??
      (() => {
        const m = minutesUntil(expectedArrivalAt, now)
        return m === null ? null : Math.max(0, m - (finalWalk?.walkMin ?? 0))
      })()
    const isLastTransit = currentIndex >= lastTransitIndex

    return {
      ...base,
      statusLabel: '탑승',
      sheetTitle: `${busName} 탑승 중 · ${alightName} 하차`,
      level: null,
      headline: {
        value: alightMinutes === null ? '-' : String(alightMinutes),
        unit: `분 후 ${alightName} 하차`,
      },
      seats: null,
      info: null,
      mapLabel: '내 위치',
      primary: { action: isLastTransit ? 'arriveDest' : 'alight', label: '도착했어요' },
      secondary: null,
    }
  }

  if (phase === 'waiting' || phase === 'failed') {
    const stop = (transit?.boardName ?? next?.boardName ?? '').replace(/ 정류장$/, '')
    const nextBusMinutes = minutesUntil(next?.nextBusArrivalAt, now)
    const nextSeats = next?.nextRemainSeats ?? null

    return {
      ...base,
      statusLabel: '이동 중',
      sheetTitle: `${stopName(stop)}에서 기다리는 중`,
      level,
      headline:
        busMinutes === null
          ? { value: '-', unit: '도착 정보가 없어요' }
          : { value: String(busMinutes), unit: '분 후 도착' },
      seats: seats ? seatsView(seats.remainSeats, seats.seatType, next?.seatStage) : null,
      info:
        nextBusMinutes === null
          ? null
          : {
              label: '다음 도착',
              value: `${nextBusMinutes}분 후`,
              pill:
                nextSeats === null
                  ? { level: '정보 없음', label: '좌석 정보 없음' }
                  : { level: seatLevel(nextSeats), label: `예측 빈자리 ${nextSeats}석` },
            },
      mapLabel: `${stop} · 내 위치`,
      primary: { action: 'board', label: '탔어요' },
      secondary: { action: 'fail', label: '못 탔어요' },
    }
  }

  // 정류장으로 걷는 중
  const walkTarget = (current?.alightName ?? transit?.boardName ?? '').replace(/ 정류장$/, '')
  return {
    ...base,
    statusLabel: '이동 중',
    sheetTitle: `${stopName(walkTarget)}까지 걷는 중`,
    level,
    headline: { value: String(current?.walkMin ?? '-'), unit: '분 후 정류장 도착' },
    seats: seats ? seatsView(seats.remainSeats, seats.seatType, next?.seatStage) : null,
    info: next
      ? {
          label: transit?.mode === 'SUBWAY' ? '지하철' : '버스',
          value: `${busName} · ${busArrivalText(busMinutes)}`,
          pill: {
            level: toStageLabel(next.slackStage),
            label: next.slackMin === null ? '여유 정보 없음' : `여유 ${next.slackMin}분`,
          },
        }
      : null,
    mapLabel: stopName(walkTarget),
    primary: { action: 'arriveStop', label: '도착했어요' },
    secondary: null,
  }
}
