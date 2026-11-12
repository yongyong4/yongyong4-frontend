import type { ReactNode } from 'react'

import LevelPill from '@/components/common/LevelPill'
import LineBadge from '@/components/common/LineBadge'
import { MESSAGES } from '@/constants/messages'
import type { Stage, StageWithUnknown } from '@/types/stage'
import type { TransitType } from '@/types/transit'
import { cn } from '@/utils/cn'

// ── 데이터 모양 (API 응답을 이 모양으로 바꿔서 넘기면 됨) ─────────────────

/** 여유시간·예측 빈자리 한 칸 (예: 값 "2분", 단계 "주의") */
export type StrategyStat = { value: string; level: Stage }

export type StrategyOption = {
  id: string
  /** 카드 앞 작은 표시. 추천은 초록, 현재 경로는 회색 */
  tag?: { label: string; tone: 'recommend' | 'current' }
  title: string
  level: StageWithUnknown
  levelLabel?: string
  /** 시간 앞 문구 (예: "예상", "실패 시") */
  timeLabel: string
  /** 실패 시처럼 주의가 필요한 문구면 주황색 */
  timeLabelTone?: 'default' | 'warn'
  /** 예: "61분" */
  time: string
  /** 시간 옆 보조 문구 (예: "도보 7분 · 예측 빈자리 6석") */
  detail: string
  /** 카드 맨 아래 설명. 강조할 숫자는 Em으로 감싸기 */
  note: ReactNode
  /** 지도에 띄울 이름표 (예: "앞 정류장 · 동백 쥬네브"). [상세]를 누르면 이 전략 기준으로 바뀜 */
  mapLabel?: string
  /**
   * [상세]를 눌렀을 때 시트 위쪽 요약을 이 전략 기준으로 바꿀 값.
   * 없는 항목은 기본 요약(현재 경로) 그대로. 아예 없으면 기본 요약 그대로 보임
   */
  summary?: Partial<StrategySummary>
}

/** 시트 위쪽 요약 (노선·도착 정보·여유시간·예측 빈자리) */
export type StrategySummary = {
  routeBadge: { type: TransitType; label: string }
  /** 예: "동백2차 → 강남역" */
  title: string
  /** 실시간 기준 시각 (예: "07:29") */
  baseAt: string
  arrivesInMinutes: number
  level: StageWithUnknown
  levelLabel?: string
  slack: StrategyStat
  seats: StrategyStat
}

/** 시트에 보여줄 내용 */
export type StrategySheetData = StrategySummary & {
  strategies: StrategyOption[]
}

type StrategySheetProps = StrategySheetData & {
  /** 지금 선택된 전략 id. 하나만 선택됨 */
  selectedId: string
  onSelect: (id: string) => void
}

const STAGE_TEXT: Record<Stage, string> = {
  가능: 'text-level-ok',
  주의: 'text-level-warn',
  위험: 'text-level-bad',
}

// 강조 숫자 (피그마 #dc2626)
export function Em({ children }: { children: ReactNode }) {
  return <span className="text-[#dc2626]">{children}</span>
}

// ── 시트 내용 ───────────────────────────────────────────────────────

// 전략 비교 시트 안쪽: 헤더, 여유시간·빈자리, 전략 카드 목록.
// 시트 틀(손잡이, 내리기)과 하단 버튼은 StrategyOverlay가 담당
export default function StrategySheet({
  routeBadge,
  title,
  baseAt,
  arrivesInMinutes,
  level,
  levelLabel,
  slack,
  seats,
  strategies,
  selectedId,
  onSelect,
}: StrategySheetProps) {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <LineBadge type={routeBadge.type} label={routeBadge.label} />
            <h1 className="text-title2 font-medium whitespace-nowrap">{title}</h1>
          </div>
          <p className="text-note text-text-secondary flex items-center gap-[5px] whitespace-nowrap">
            <span aria-hidden="true" className="bg-level-bad size-1.5 rounded-full" />
            {baseAt} 기준 · {arrivesInMinutes}분 후 도착
          </p>
        </div>
        <LevelPill level={level} label={levelLabel} />
      </div>

      <div className="mt-3.5 flex items-center gap-2">
        <StatBox icon={<ClockIcon />} label="여유시간" stat={slack} />
        <StatBox icon={<SeatIcon />} label="예측 빈자리" stat={seats} />
      </div>

      <p className="text-micro text-text-tertiary mt-2 flex items-center justify-center gap-1.5 whitespace-nowrap">
        <UsersIcon />
        {MESSAGES.waitingPassengers}
      </p>

      <div className="mt-6 flex items-center justify-between whitespace-nowrap">
        <h2 className="text-title3 font-medium">다른 이동 전략</h2>
        {/* 정렬 방식은 아직 한 가지만 디자인되어 있음 */}
        <span className="text-note text-text-tertiary">덜 늦는 순</span>
      </div>

      <ul className="mt-3 flex flex-col gap-2.5">
        {strategies.map((option) => (
          <StrategyCard
            key={option.id}
            option={option}
            selected={option.id === selectedId}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </ul>
    </div>
  )
}

function StatBox({ icon, label, stat }: { icon: ReactNode; label: string; stat: StrategyStat }) {
  return (
    <div className="bg-surface-sunken flex min-w-0 flex-1 flex-col gap-1 rounded-[14px] px-3.5 py-3">
      <div className="text-caption1 text-text-secondary flex items-center gap-1 font-medium">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 font-medium whitespace-nowrap">
        <span className="text-title2">{stat.value}</span>
        <span className={cn('text-caption1', STAGE_TEXT[stat.level])}>{stat.level}</span>
      </div>
    </div>
  )
}

// 전략 카드 한 장. 누르면 선택되고, 선택된 카드만 초록으로 표시됨.
// 버튼 안이라 div/p 대신 span만 씀
function StrategyCard({
  option,
  selected,
  onSelect,
}: {
  option: StrategyOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex w-full flex-col gap-2.5 rounded-2xl text-left transition-colors',
          // 선택돼도 카드 크기가 변하지 않게 테두리는 항상 1px.
          // 선택된 카드는 안쪽 그림자 0.5px를 더해 피그마의 1.5px 테두리처럼 보이게 함
          'border px-4 py-3.5',
          selected
            ? 'bg-brand-weak border-[#6fc492] shadow-[inset_0_0_0_0.5px_#6fc492]'
            : 'bg-surface-default border-line-default',
        )}
      >
        <span className="flex w-full items-center gap-2">
          {option.tag && (
            <span
              className={cn(
                'text-micro rounded-[5px] px-1.5 py-0.5 font-medium whitespace-nowrap',
                option.tag.tone === 'recommend'
                  ? 'bg-brand-primary text-text-inverse'
                  : 'bg-surface-sunken text-text-secondary',
              )}
            >
              {option.tag.label}
            </span>
          )}
          <span className="text-label1 min-w-0 flex-1 font-semibold">{option.title}</span>
          <LevelPill level={option.level} label={option.levelLabel} />
        </span>

        <span className="flex items-baseline gap-2 whitespace-nowrap">
          <span
            className={cn(
              'text-caption1 font-medium',
              option.timeLabelTone === 'warn' ? 'text-level-warn' : 'text-text-secondary',
            )}
          >
            {option.timeLabel}
          </span>
          <span className="text-title1 font-semibold">{option.time}</span>
          <span className="text-note text-text-tertiary">{option.detail}</span>
        </span>

        <span className="text-note text-text-secondary">{option.note}</span>
      </button>
    </li>
  )
}

// icon/clock 14px (선 굵기 1.17)
function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12.25 7C12.25 9.8995 9.8995 12.25 7 12.25C4.10051 12.25 1.75 9.8995 1.75 7C1.75 4.10051 4.10051 1.75 7 1.75C9.8995 1.75 12.25 4.10051 12.25 7Z" />
      <path d="M7 4.08333V7L8.75 8.16667" />
    </svg>
  )
}

// icon/seat 14px (선 굵기 1.17)
function SeatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M4.08333 2.33333V7.58333C4.08333 7.89275 4.20625 8.1895 4.42504 8.40829C4.64383 8.62708 4.94058 8.75 5.25 8.75H9.33333V11.6667M4.08333 8.75L3.5 11.6667M5.25 6.41667H9.91667" />
    </svg>
  )
}

// icon/users 14px (선 굵기 1.17)
function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M7.29167 4.66667C7.29167 5.79425 6.37758 6.70833 5.25 6.70833C4.12242 6.70833 3.20833 5.79425 3.20833 4.66667C3.20833 3.53909 4.12242 2.625 5.25 2.625C6.37758 2.625 7.29167 3.53909 7.29167 4.66667Z" />
      <path d="M1.45833 11.6667C1.45833 10.6611 1.85781 9.69663 2.56889 8.98555C3.27996 8.27448 4.24439 7.875 5.25 7.875C6.25561 7.875 7.22004 8.27448 7.93111 8.98555C8.64219 9.69663 9.04167 10.6611 9.04167 11.6667M9.33333 2.625C9.87482 2.625 10.3941 2.8401 10.777 3.22299C11.1599 3.60588 11.375 4.12518 11.375 4.66667C11.375 5.20815 11.1599 5.72746 10.777 6.11034C10.3941 6.49323 9.87482 6.70833 9.33333 6.70833M10.5 8.16667C11.1613 8.46627 11.713 8.96409 12.0788 9.59117C12.4446 10.2183 12.6064 10.9436 12.5417 11.6667" />
    </svg>
  )
}
