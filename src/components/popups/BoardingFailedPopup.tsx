import { useState } from 'react'

import iconBus from '@/assets/popups/icon-bus.svg'
import radioOff from '@/assets/popups/radio-off.svg'
import radioOn from '@/assets/popups/radio-on.svg'
import Button from '@/components/common/Button'
import LevelPill from '@/components/common/LevelPill'
import LineBadge from '@/components/common/LineBadge'
import type { StageWithUnknown } from '@/types/stage'
import type { TransitType } from '@/types/transit'
import { cn } from '@/utils/cn'

import PopupSheet from './PopupSheet'

export type FailureChoice = {
  /** alternative = 대안 경로로 갈아타기, wait = 다음 버스 기다리기 */
  id: 'alternative' | 'wait'
  /** 예: "5005번으로 갈아타기" */
  title: string
  recommended: boolean
  level: StageWithUnknown
  badge: { type: TransitType; label: string }
  /** 예: "동백 호수공원 · 도보 6분 · 예측 빈자리 21석" */
  detail: string
  /** 예: "08:45" */
  arrivalTime: string | null
  totalMinutes: number | null
}

export type BoardingFailedPopupData = {
  /** 예: "5003" */
  failedLabel: string
  /** 다시 계산한 시각 (예: "07:41") */
  evaluatedTime: string | null
  /** 추천이 먼저 오게 정렬해서 넘김 */
  choices: FailureChoice[]
}

type BoardingFailedPopupProps = BoardingFailedPopupData & {
  onSelect: (id: FailureChoice['id']) => void
  pending?: boolean
}

// P-02 탑승 실패 후 재평가 (F-05-05). 하나를 골라야 닫힘
export default function BoardingFailedPopup({
  failedLabel,
  evaluatedTime,
  choices,
  onSelect,
  pending = false,
}: BoardingFailedPopupProps) {
  const [selectedId, setSelectedId] = useState(
    () => (choices.find((c) => c.recommended) ?? choices[0])?.id,
  )
  const selected = choices.find((c) => c.id === selectedId) ?? choices[0]

  return (
    <PopupSheet
      icon={<img alt="" src={iconBus} width={26} height={26} />}
      iconClassName="bg-level-bad-weak"
      title={`${failedLabel}번을 못 탔어요`}
      description={
        <p>
          어떻게 갈지 선택해 주세요.{' '}
          {evaluatedTime && (
            <span className="text-caption1 text-brand-strong font-medium">
              {evaluatedTime} 기준으로 다시 계산했어요.
            </span>
          )}
        </p>
      }
      footnote="고르면 이동 중 화면이 새 경로로 바뀌어요"
    >
      <div role="radiogroup" className="mt-5 flex flex-col gap-2.5">
        {choices.map((choice) => {
          const checked = choice.id === selected?.id
          return (
            <button
              key={choice.id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => setSelectedId(choice.id)}
              className={cn(
                'flex w-full flex-col gap-2 rounded-2xl px-4 py-3.5 text-left',
                checked
                  ? 'bg-brand-weak border-brand-primary border-[1.5px]'
                  : 'border-line-default border bg-white',
              )}
            >
              <span className="flex w-full items-center gap-2">
                <img alt="" src={checked ? radioOn : radioOff} width={20} height={20} />
                {choice.recommended && (
                  <span className="bg-brand-primary text-micro text-text-inverse rounded-[5px] px-1.5 py-0.5 font-medium">
                    추천
                  </span>
                )}
                <span className="text-label1 min-w-0 flex-1 font-semibold">{choice.title}</span>
                <LevelPill level={choice.level} />
              </span>
              <span className="flex w-full items-center gap-1.5 pl-7">
                <LineBadge type={choice.badge.type} label={choice.badge.label} />
                <span className="text-note text-text-secondary truncate">{choice.detail}</span>
              </span>
              <span className="flex w-full items-baseline gap-1.5 pl-7 whitespace-nowrap">
                <span className="text-title3 font-medium">
                  {choice.arrivalTime ? `${choice.arrivalTime} 도착` : '도착 정보 없음'}
                </span>
                {choice.totalMinutes !== null && (
                  <span className="text-note text-text-tertiary">총 {choice.totalMinutes}분</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <Button
        fullWidth
        className="mt-5"
        disabled={pending || !selected}
        onClick={() => selected && onSelect(selected.id)}
      >
        {selected?.title ?? '선택해 주세요'}
      </Button>
    </PopupSheet>
  )
}
