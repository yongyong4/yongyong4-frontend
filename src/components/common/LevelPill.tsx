import type { StageWithUnknown } from '@/types/stage'
import { cn } from '@/utils/cn'

type LevelPillProps = {
  level: StageWithUnknown
  /** 표시 문구. 없으면 level 그대로 (구간은 "탑승 가능"처럼 넘기기, C-01) */
  label?: string
  className?: string
}

const LEVEL_CLASS: Record<StageWithUnknown, string> = {
  가능: 'bg-level-ok-weak text-level-ok',
  주의: 'bg-level-warn-weak text-level-warn',
  위험: 'bg-level-bad-weak text-level-bad',
  '정보 없음': 'bg-level-na-weak text-level-na',
}

export default function LevelPill({ level, label = level, className }: LevelPillProps) {
  return (
    <span
      className={cn(
        'text-caption1 inline-flex items-center gap-1 rounded-md px-2 py-[3px] font-medium whitespace-nowrap',
        LEVEL_CLASS[level],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </span>
  )
}
