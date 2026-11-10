import LevelPill from '@/components/common/LevelPill'
import LineBadge from '@/components/common/LineBadge'
import type { Stage } from '@/types/stage'
import { cn } from '@/utils/cn'

import FloatCard from './FloatCard'

type RouteCardProps = {
  label: string
  value: string
  level: Stage
  /** 초록 테두리로 강조 */
  highlighted?: boolean
  className?: string
}

// 지도 위 경로별 소요시간 카드
export default function RouteCard({ label, value, level, highlighted, className }: RouteCardProps) {
  return (
    <FloatCard
      className={cn(
        'flex items-center gap-2 rounded-xl py-2 pr-3 pl-2.5',
        highlighted && 'border-brand-primary border-[1.5px]',
        className,
      )}
    >
      <LineBadge type="마을" label="5003" />
      <div className="flex flex-col whitespace-nowrap">
        <span className="text-micro text-text-tertiary font-medium">{label}</span>
        <span className="text-label1 font-semibold">{value}</span>
      </div>
      <LevelPill level={level} />
    </FloatCard>
  )
}
