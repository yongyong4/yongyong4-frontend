import { Fragment, type ReactNode } from 'react'

import LevelPill from '@/components/common/LevelPill'
import LineBadge from '@/components/common/LineBadge'
import { MESSAGES } from '@/constants/messages'
import type { StageWithUnknown } from '@/types/stage'
import type { TransitType } from '@/types/transit'
import { cn } from '@/utils/cn'

// ── 데이터 모양 (API 응답을 이 모양으로 바꿔서 넘기면 됨) ─────────────────

/** 노선 배지. label은 "5003"처럼 번호만 ("번"은 붙이지 않음) */
export type RouteBadge = { type: TransitType; label: string }

export type RideScenario = {
  /** 탈 수 있을 때 */
  board: {
    time: string
    /** 시간 옆 문구 (예: "58분", "동백2차 도착") */
    note: string
    slackMinutes?: number
    seats?: number
  }
  /** 못 탔을 때 */
  miss: {
    time: string
    note: string
    /** 다음 버스 번호 (예: "5003") */
    nextBus: string
    nextInMinutes: number
  }
}

export type PlanItem =
  | {
      kind: 'ride'
      /** 환승 경로처럼 구간마다 제목 줄이 필요할 때만 */
      heading?: { badge: RouteBadge; text: string; level: StageWithUnknown; levelLabel?: string }
      scenario: RideScenario
    }
  | { kind: 'walk'; text: string }
  /** 실시간 분석이 안 되는 구간 (GBIS 매칭 실패 등) */
  | { kind: 'unavailable'; time: string; note: string }

export type RoutePlan = {
  id: string
  /** 추천 경로. 초록 테두리 */
  recommended?: boolean
  badges: RouteBadge[]
  /** 카드 제목 (예: "동백2차 · 11분 후"). 없으면 빈 문자열 */
  headline: string
  level: StageWithUnknown
  /** 단계 표시 문구. 없으면 level 그대로 (예: "분석 불가") */
  levelLabel?: string
  items: PlanItem[]
}

// ── 카드 ────────────────────────────────────────────────────────────

// 후보 경로 한 장
export default function RoutePlanCard({
  plan,
  onSelect,
}: {
  plan: RoutePlan
  /** 카드를 눌렀을 때 */
  onSelect?: (plan: RoutePlan) => void
}) {
  return (
    <article
      // 카드 안에 제목·줄 등 버튼에 못 넣는 요소가 있어서 button 대신 role로 처리
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect && (() => onSelect(plan))}
      onKeyDown={
        onSelect &&
        ((e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(plan)
          }
        })
      }
      className={cn(
        'bg-surface-default flex flex-col gap-3.5 rounded-[20px] px-[18px] pt-[18px] pb-4',
        plan.recommended && 'border-brand-primary border-[1.5px]',
        onSelect && 'cursor-pointer',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex shrink-0 items-center gap-1">
          {plan.badges.map((badge) => (
            <LineBadge key={badge.label} type={badge.type} label={badge.label} />
          ))}
        </span>
        <p className="text-label1 text-text-secondary min-w-0 flex-1 font-medium">
          {plan.headline}
        </p>
        <LevelPill level={plan.level} label={plan.levelLabel} />
      </div>

      {plan.items.map((item, index) => (
        <Fragment key={index}>
          <PlanItemView item={item} />
        </Fragment>
      ))}
    </article>
  )
}

function PlanItemView({ item }: { item: PlanItem }) {
  if (item.kind === 'walk') {
    return (
      <div className="flex items-center gap-1.5">
        <LineBadge type="도보" label="도보" />
        <p className="text-label1 text-text-secondary font-medium whitespace-nowrap">{item.text}</p>
      </div>
    )
  }

  if (item.kind === 'unavailable') {
    return (
      <div className="flex gap-3">
        <UnavailableTimeline />
        <div className="min-w-0 flex-1 pt-2.5">
          <TimeLine
            label="예상"
            labelClass="text-text-secondary"
            time={item.time}
            note={item.note}
          />
          <p className="text-note text-text-tertiary">
            실시간 분석이 어려운 구간이에요. 경로 정보만 보여드려요
          </p>
        </div>
      </div>
    )
  }

  const { heading, scenario } = item
  const { board, miss } = scenario

  return (
    <>
      {heading && (
        <div className="flex items-center gap-1.5">
          <LineBadge type={heading.badge.type} label={heading.badge.label} />
          <p className="text-label1 min-w-0 flex-1 font-medium">{heading.text}</p>
          <LevelPill level={heading.level} label={heading.levelLabel} />
        </div>
      )}

      <div className="flex gap-3">
        <RideTimeline />
        <div className="flex min-w-0 flex-1 flex-col gap-3 pt-2.5">
          <div className="flex flex-col gap-0.5">
            <TimeLine
              label="타면"
              labelClass="text-brand-strong"
              time={board.time}
              note={board.note}
            />
            {(board.slackMinutes !== undefined || board.seats !== undefined) && (
              <p className="text-note text-text-tertiary whitespace-nowrap">
                {board.slackMinutes !== undefined && (
                  <>
                    여유 <Em>{board.slackMinutes}</Em>분
                  </>
                )}
                {board.slackMinutes !== undefined && board.seats !== undefined && ' · '}
                {board.seats !== undefined && (
                  <>
                    예측 빈자리 <Em>{board.seats}</Em>석
                  </>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-0.5">
            <TimeLine
              label="못 타면"
              labelClass="text-level-warn"
              time={miss.time}
              note={miss.note}
            />
            <p className="text-note text-text-tertiary whitespace-nowrap">
              {MESSAGES.nextBus(miss.nextBus, miss.nextInMinutes)}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// "타면 08:29 58분" 한 줄
function TimeLine({
  label,
  labelClass,
  time,
  note,
}: {
  label: string
  labelClass: string
  time: string
  note: string
}) {
  return (
    <div className="flex items-baseline gap-2 font-medium whitespace-nowrap">
      <span className={cn('text-caption1', labelClass)}>{label}</span>
      <span className="text-title2">{time}</span>
      <span className="text-label1 text-text-secondary">{note}</span>
    </div>
  )
}

// 강조 숫자 (피그마 #dc2626)
function Em({ children }: { children: ReactNode }) {
  return <span className="text-[#dc2626]">{children}</span>
}

// 왼쪽 타임라인: 초록 선(탈 때) + 주황 점선(못 탔을 때). 30×104
function RideTimeline() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="104"
      viewBox="0 0 30 104"
      fill="none"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M6 8V52" stroke="#4CB282" />
      <path
        d="M6 52C6 52.3681 6.00203 52.7321 6.0061 53.0922M24 80C23.6331 80 23.2718 79.9925 22.9161 79.9775M6.24389 58.5027C6.30368 59.2414 6.37445 59.959 6.45621 60.6558M7.39255 65.9896C7.57065 66.7171 7.76583 67.4136 7.9781 68.0797M10.1864 73.0116C10.578 73.6448 10.9972 74.2319 11.4438 74.774M15.6082 78.1801C16.24 78.5116 16.903 78.796 17.5972 79.0348"
        stroke="#E07B00"
      />
      <path d="M6 24H24" stroke="#4CB282" />
      <circle cx="6" cy="8" r="5" fill="#4CB282" stroke="none" />
      <circle cx="24" cy="24" r="4" fill="#4CB282" stroke="none" />
      <circle cx="24" cy="80" r="4" fill="white" stroke="#E07B00" strokeWidth="2.5" />
    </svg>
  )
}

// 분석 불가 구간용 회색 타임라인. 28×48
function UnavailableTimeline() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="48"
      viewBox="0 0 28 48"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M6 8V24H24"
        stroke="#8B95A1"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="8" r="5" fill="#8B95A1" />
      <circle cx="24" cy="24" r="4" fill="#8B95A1" />
    </svg>
  )
}
