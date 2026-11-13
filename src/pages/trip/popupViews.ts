// 재평가 응답 → P-01, P-02 팝업에 보여줄 값 (실제 BE 응답 기준, 2026-11-13 확인)

import type {
  BoardingFailedPopupData,
  FailureChoice,
} from '@/components/popups/BoardingFailedPopup'
import type { RouteChangePopupData } from '@/components/popups/RouteChangePopup'
import { MESSAGES } from '@/constants/messages'
import type { RiskStageCode, StageCode } from '@/types/api'
import type { ReevaluateResponse, Suggestion } from '@/types/tripApi'
import { toRiskStageLabel, toStageLabel } from '@/utils/codeLabels'
import { formatTime, minutesUntil } from '@/utils/time'

import { stopName, toTransitType, type TripView } from './tripView'

function busName(label: string | null | undefined) {
  return label ? `${label}번` : '다른 경로'
}

/** 좌석 정보가 없으면 null (문구에서 뺌, 기능명세서 C-01) */
function seatsText(remainSeats: number | null | undefined) {
  return remainSeats === null || remainSeats === undefined ? null : `예측 빈자리 ${remainSeats}석`
}

/** 구간 단계 → 전략 단계 (정보 없음은 주의로 봄, 재평가 명세) */
function toRisk(stage: StageCode | undefined): RiskStageCode {
  return stage === 'OK' || stage === 'RISK' ? stage : 'CAUTION'
}

function suggestionBadge(s: Suggestion) {
  return {
    type: toTransitType({ mode: 'BUS', routeLabel: s.routeLabel ?? null }),
    label: s.routeLabel ?? '',
  }
}

/** P-01을 띄울지 */
export function hasRouteChange(evaluation: ReevaluateResponse) {
  return (
    evaluation.result === 'SUGGEST' &&
    !evaluation.failureOptions &&
    evaluation.suggestion !== null &&
    evaluation.suggestion.canAccept !== false
  )
}

/** P-01 경로 변경 제안 */
export function buildRouteChange(
  evaluation: ReevaluateResponse,
  view: TripView,
  now: number,
): RouteChangePopupData | null {
  const s = evaluation.suggestion
  if (!s) return null
  const currentRisk = toRisk(evaluation.nextSegment?.boardingStage)
  const busMinutes = minutesUntil(s.busArrivalAt, now)
  const saved = s.improvementMin ?? evaluation.savedMinutes

  return {
    title: s.routeLabel ? `${s.routeLabel}번으로 변경할까요?` : '경로를 바꿀까요?',
    reason: s.reason ?? evaluation.reason ?? (saved ? MESSAGES.fasterBy(saved) : ''),
    basisTime: formatTime(evaluation.dataBasisAt),
    current: {
      badge: view.badge ?? { type: '광역', label: '' },
      // 위험하면 못 탔을 때 시간으로 비교 (strategies의 comparisonValueMin 규칙)
      timeLabel: currentRisk === 'OK' ? '예상' : '실패 시',
      minutes: evaluation.currentValueMin,
      level: toRiskStageLabel(currentRisk),
    },
    suggested: {
      badge: suggestionBadge(s),
      timeLabel: '예상',
      minutes: s.comparisonValueMin ?? evaluation.suggestedValueMin,
      level: toRiskStageLabel(s.strategyRiskStage ?? 'OK'),
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
  const wait = options.waitOption
  const failedLabel = wait.routeLabel ?? view.badge?.label ?? ''
  const waitMinutes = minutesUntil(wait.nextBusArrivalAt ?? wait.busArrivalAt, now)

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
      ]
        .filter(Boolean)
        .join(' · '),
      arrivalTime: formatTime(wait.expectedArrivalAt),
      totalMinutes: wait.totalMin,
    },
  ]

  const alternative = options.alternativeOption ?? evaluation.suggestion
  if (alternative) {
    choices.push({
      id: 'alternative',
      title: alternative.routeLabel
        ? `${alternative.routeLabel}번으로 갈아타기`
        : (alternative.title ?? '다른 경로로 가기'),
      recommended: false,
      level: toRiskStageLabel(alternative.strategyRiskStage ?? 'CAUTION'),
      badge: suggestionBadge(alternative),
      detail: [
        alternative.moveToName ?? '이 정류장',
        alternative.extraWalkMin ? `도보 ${alternative.extraWalkMin}분` : null,
        seatsText(alternative.remainSeats),
      ]
        .filter(Boolean)
        .join(' · '),
      arrivalTime: formatTime(alternative.expectedArrivalAt),
      totalMinutes: alternative.totalMin ?? alternative.comparisonValueMin ?? null,
    })
  }

  // 시간(분)이 더 짧은 쪽을 추천으로 표시하고 맨 위로
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
