import iconAlert from '@/assets/popups/icon-alert.svg'
import iconWalk from '@/assets/popups/icon-walk.svg'
import Button from '@/components/common/Button'
import LevelPill from '@/components/common/LevelPill'
import LineBadge from '@/components/common/LineBadge'
import type { Stage } from '@/types/stage'
import type { TransitType } from '@/types/transit'
import { cn } from '@/utils/cn'

import PopupSheet from './PopupSheet'

export type RouteCompare = {
  badge: { type: TransitType; label: string }
  /** "예상" 또는 "실패 시" */
  timeLabel: string
  minutes: number | null
  level: Stage
}

export type RouteChangePopupData = {
  /** 예: "5005번으로 변경할까요?" */
  title: string
  /** BE가 만든 근거 문장 (확률·퍼센트 없음) */
  reason: string
  /** 예: "07:40" */
  basisTime: string | null
  current: RouteCompare
  suggested: RouteCompare
  /** 정류장을 옮겨야 할 때 두 줄 (예: "동백 호수공원 정류장까지", "도보 6분 · 15분 후 도착 · 예측 빈자리 21석") */
  walk: [string, string] | null
  /** 예: "5005번으로 바꾸기" */
  acceptLabel: string
}

type RouteChangePopupProps = RouteChangePopupData & {
  onKeep: () => void
  onAccept: () => void
  pending?: boolean
}

// P-01 경로 변경 제안 (F-05-04)
export default function RouteChangePopup({
  title,
  reason,
  basisTime,
  current,
  suggested,
  walk,
  acceptLabel,
  onKeep,
  onAccept,
  pending = false,
}: RouteChangePopupProps) {
  return (
    <PopupSheet
      icon={<img alt="" src={iconAlert} width={26} height={26} />}
      iconClassName="bg-level-bad-weak"
      title={title}
      description={
        <p>
          {reason}
          {basisTime && (
            <>
              <br />({basisTime} 기준)
            </>
          )}
        </p>
      }
      footnote="변경 후에는 4분 동안 기존 경로로 되돌아가는 제안을 하지 않아요"
    >
      <div className="border-line-default mt-5 flex overflow-hidden rounded-2xl border">
        <CompareColumn heading="현재 경로" data={current} />
        <CompareColumn heading="제안 경로" data={suggested} highlight />
      </div>

      {walk && (
        <div className="mt-3 flex items-center gap-2.5">
          <span className="flex shrink-0 items-center px-[5px]">
            <img alt="" src={iconWalk} width={16} height={16} />
          </span>
          <p className="text-note text-text-secondary min-w-0 flex-1">
            {walk[0]}
            <br />
            {walk[1]}
          </p>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <Button variant="tertiary" className="w-[120px] shrink-0" onClick={onKeep}>
          그대로 가기
        </Button>
        <Button className="min-w-0 flex-1" disabled={pending} onClick={onAccept}>
          {acceptLabel}
        </Button>
      </div>
    </PopupSheet>
  )
}

function CompareColumn({
  heading,
  data,
  highlight = false,
}: {
  heading: string
  data: RouteCompare
  highlight?: boolean
}) {
  // 현재 경로가 "실패 시" 시간이면 취소선 (피그마)
  const struck = !highlight && data.timeLabel === '실패 시'
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-start gap-2 p-4',
        highlight && 'bg-brand-weak',
      )}
    >
      <p className="text-caption1 text-text-secondary font-medium">{heading}</p>
      <LineBadge type={data.badge.type} label={data.badge.label} />
      <p className="flex items-baseline gap-1 whitespace-nowrap">
        <span className="text-caption1 text-text-tertiary font-medium">{data.timeLabel}</span>
        <span
          className={cn(
            'text-title1 font-semibold',
            struck && 'text-text-tertiary line-through',
            highlight && 'text-brand-strong',
          )}
        >
          {data.minutes === null ? '-' : `${data.minutes}분`}
        </span>
      </p>
      <LevelPill level={data.level} />
    </div>
  )
}
