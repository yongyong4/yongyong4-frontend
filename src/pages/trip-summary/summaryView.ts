// 이동 요약 API 응답 → S-06 화면에 보여줄 값

import { MESSAGES } from '@/constants/messages'
import type { TransitType } from '@/types/transit'
import type { TripSummary } from '@/types/tripApi'
import { toStrategyLabel } from '@/utils/codeLabels'
import { formatDate, formatTime } from '@/utils/time'

import { toTransitType } from '../trip/tripView'

export type BoardingRow = {
  key: string
  badge: { type: TransitType; label: string }
  name: string
  boarded: boolean
}

export type HistoryRow = {
  key: string
  time: string
  title: string
  sub: string
  /** 탑승 실패면 빨간 점 */
  alert: boolean
}

export type SummaryView = {
  title: string
  sub: string
  durationMin: number | null
  comparison: string | null
  boardings: BoardingRow[]
  history: HistoryRow[]
}

/**
 * "처음 예상 시간(58분)보다 4분 늦었지만, 탑승 실패 시 예상 시간(70분)보다 8분 빨랐어요"
 * 비교할 값이 없으면 null
 */
export function comparisonText(
  actual: number | null,
  initial: number | null | undefined,
  failed: number | null | undefined,
): string | null {
  if (actual === null) return null

  let first: { text: string; late: boolean } | null = null
  if (initial !== null && initial !== undefined) {
    const diff = actual - initial
    first =
      diff > 0
        ? { text: `처음 예상 시간(${initial}분)보다 ${diff}분 늦었`, late: true }
        : diff < 0
          ? { text: `처음 예상 시간(${initial}분)보다 ${-diff}분 빨랐`, late: false }
          : { text: `처음 예상 시간(${initial}분)과 같았`, late: false }
  }

  // 탑승 실패 때 예상보다 빨랐을 때만 말함
  const saved = failed !== null && failed !== undefined ? failed - actual : null
  const second =
    saved !== null && saved > 0 ? `탑승 실패 시 예상 시간(${failed}분)보다 ${saved}분 빨랐` : null

  if (first && second) return `${first.text}${first.late ? '지만' : '고'}, ${second}어요`
  if (first) return `${first.text}어요`
  if (second) return `${second}어요`
  return null
}

export function buildSummaryView(summary: TripSummary): SummaryView {
  const start = formatTime(summary.startedAt)
  // 자동 종료는 종료 시각을 실제 도착으로 보지 않음 (명세). 근처 도착 시각이 있으면 그걸 씀
  const arrivedAt = summary.endType === 'AUTO' ? summary.nearDestAt : summary.endedAt
  const end = formatTime(arrivedAt)
  const date = formatDate(summary.startedAt)

  const boardings: BoardingRow[] = []
  const history: HistoryRow[] = []
  let failed = false

  summary.boardingResults.forEach((result) => {
    const label = result.routeLabel ?? ''
    result.events.forEach((event, i) => {
      boardings.push({
        key: `${result.segmentId}-${i}`,
        badge: { type: toTransitType({ mode: 'BUS', routeLabel: label }), label },
        // TODO: BE가 boardName을 주면 정류장 이름만 보여주기
        name: result.boardName
          ? `${result.boardName.replace(/ 정류장$/, '')} 정류장`
          : `${label}번 버스`,
        boarded: event.status === 'BOARDED',
      })
      if (event.status === 'BOARD_FAILED') {
        failed = true
        history.push({
          key: `fail-${result.segmentId}-${i}`,
          time: event.changedAt,
          title: '탑승 실패',
          sub: `${label}번을 못 탔어요`,
          alert: true,
        })
      }
    })
  })

  summary.routeChangeHistory.forEach((change) => {
    const answer =
      change.accepted === true ? '바꾸기' : change.accepted === false ? '그대로 가기' : '응답 없음'
    history.push({
      key: `change-${change.evaluationId}`,
      time: change.suggestedAt,
      title: '변경 제안',
      sub: `${toStrategyLabel(change.strategyType)} 제안 → ${answer}`,
      alert: false,
    })
  })

  history.push({
    key: 'start',
    time: summary.startedAt,
    title: '출발',
    sub: '이동 시작',
    alert: false,
  })
  history.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  return {
    title: summary.endType === 'AUTO' ? MESSAGES.autoEnded : `${summary.destName}에 도착했어요`,
    sub: [date, `${start ?? ''} 출발 → ${summary.destName}${end ? ` ${end}` : ''}`]
      .filter(Boolean)
      .join(' · '),
    durationMin: summary.durationMin,
    comparison: comparisonText(
      summary.durationMin,
      summary.initialExpectedMin,
      failed ? summary.failedExpectedMin : null,
    ),
    boardings,
    history: history.map((row) => ({ ...row, time: formatTime(row.time) ?? '' })),
  }
}
