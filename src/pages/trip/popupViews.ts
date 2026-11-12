// 재평가 응답 → P-01, P-02 팝업에 보여줄 값

import type {
  BoardingFailedPopupData,
  FailureChoice,
} from '@/components/popups/BoardingFailedPopup'
import type { RouteChangePopupData } from '@/components/popups/RouteChangePopup'
import type { ReevaluateResponse, Suggestion } from '@/types/tripApi'
import { toRiskStageLabel, toStageLabel } from '@/utils/codeLabels'
import { formatTime, minutesUntil } from '@/utils/time'

import { stopName, toTransitType, type TripView } from './tripView'

function busName(label: string | null | undefined) {
  return label ? `${label}번` : '다른 경로'
}

function seatsText(remainSeats: number | null | undefined) {
  return remainSeats === null || remainSeats === undefined
    ? '좌석 정보 없음'
    : `예측 빈자리 ${remainSeats}석`
}

function suggestionBadge(s: Suggestion) {
  return {
    type: toTransitType({ mode: 'BUS', routeLabel: s.routeLabel ?? null }),
    label: s.routeLabel ?? '',
  }
}

/** P-01 경로 변경 제안 */
export function buildRouteChange(
  evaluation: ReevaluateResponse,
  view: TripView,
  now: number,
): RouteChangePopupData | null {
  const s = evaluation.suggestion
  if (!s) return null
  const current = evaluation.currentRoute
  const busMinutes = minutesUntil(s.busArrivalAt, now)

  return {
    title: s.routeLabel ? `${s.routeLabel}번으로 변경할까요?` : '경로를 바꿀까요?',
    reason: s.reason,
    basisTime: formatTime(evaluation.dataBasisAt),
    current: {
      badge: view.badge ?? { type: '광역', label: '' },
      // 위험하면 못 탔을 때 시간으로 비교 (strategies의 comparisonValueMin 규칙)
      timeLabel: current.strategyRiskStage === 'OK' ? '예상' : '실패 시',
      minutes: current.comparisonValueMin,
      level: toRiskStageLabel(current.strategyRiskStage),
    },
    suggested: {
      badge: suggestionBadge(s),
      timeLabel: '예상',
      minutes: s.comparisonValueMin,
      level: toRiskStageLabel(s.strategyRiskStage),
    },
    walk: s.moveToName
      ? [
          `${stopName(s.moveToName)}까지`,
          [
            s.extraWalkMin ? `도보 ${s.extraWalkMin}분` : null,
            busMinutes === null ? null : `${busMinutes}분 후 도착`,
            seatsText(s.remainSeats),
          ]
            .filter(Boolean)
            .join(' · '),
        ]
      : null,
    acceptLabel: s.routeLabel ? `${s.routeLabel}번으로 바꾸기` : '제안 경로로 바꾸기',
  }
}

/** P-02 탑승 실패 후 선택지 */
export function buildBoardingFailed(
  evaluation: ReevaluateResponse,
  view: TripView,
  now: number,
): BoardingFailedPopupData | null {
  const options = evaluation.failureOptions
  if (!options) return null
  const wait = options.waitNextBus
  const failedLabel = wait.routeLabel ?? view.badge?.label ?? ''
  const waitMinutes = minutesUntil(wait.predictedArrivalAt, now)

  const choices: FailureChoice[] = [
    {
      id: 'wait',
      title: `다음 ${busName(failedLabel)} 기다리기`,
      recommended: false,
      level: toStageLabel(wait.boardingStage),
      badge: { type: toTransitType({ mode: 'BUS', routeLabel: failedLabel }), label: failedLabel },
      detail: [
        '이 정류장',
        waitMinutes === null ? '도착 정보 없음' : `${waitMinutes}분 후`,
        seatsText(wait.remainSeats),
      ].join(' · '),
      arrivalTime: formatTime(wait.expectedArrivalAt),
      totalMinutes: wait.comparisonValueMin,
    },
  ]

  const s = evaluation.suggestion
  if (options.alternativeAvailable && s) {
    choices.push({
      id: 'alternative',
      title: s.routeLabel ? `${s.routeLabel}번으로 갈아타기` : (s.title ?? '다른 경로로 가기'),
      recommended: false,
      level: toRiskStageLabel(s.strategyRiskStage),
      badge: suggestionBadge(s),
      detail: [
        s.moveToName ?? '이 정류장',
        s.extraWalkMin ? `도보 ${s.extraWalkMin}분` : null,
        seatsText(s.remainSeats),
      ]
        .filter(Boolean)
        .join(' · '),
      arrivalTime: formatTime(s.expectedArrivalAt),
      totalMinutes: s.comparisonValueMin,
    })
  }

  // 비교값(분)이 더 작은 쪽을 추천으로 표시하고 맨 위로
  const best = choices.reduce((a, b) =>
    (b.totalMinutes ?? Infinity) < (a.totalMinutes ?? Infinity) ? b : a,
  )
  best.recommended = choices.length > 1
  choices.sort((a, b) => Number(b.recommended) - Number(a.recommended))

  return {
    failedLabel,
    evaluatedTime: formatTime(evaluation.evaluatedAt),
    choices,
  }
}
