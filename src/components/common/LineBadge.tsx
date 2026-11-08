import type { TransitType } from '@/types/transit'
import { cn } from '@/utils/cn'

type LineBadgeProps = {
  type: TransitType
  /** 노선 번호. 배지 안에는 "번"을 붙이지 않음 (C-06) */
  label: string
  className?: string
}

const TYPE_CLASS: Record<TransitType, string> = {
  광역: 'bg-transit-express',
  일반: 'bg-transit-general',
  마을: 'bg-transit-village',
  에버라인: 'bg-transit-everline',
  수인분당: 'bg-transit-suinbundang',
  도보: 'bg-transit-walk',
}

export default function LineBadge({ type, label, className }: LineBadgeProps) {
  return (
    <span
      className={cn(
        'text-micro text-text-inverse inline-flex items-center justify-center rounded px-1.5 py-0.5 font-medium whitespace-nowrap',
        TYPE_CLASS[type],
        className,
      )}
    >
      {label}
    </span>
  )
}
