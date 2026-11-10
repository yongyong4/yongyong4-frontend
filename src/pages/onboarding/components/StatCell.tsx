import type { ReactNode } from 'react'

import type { Stage } from '@/types/stage'

type StatCellProps = {
  icon: ReactNode
  label: string
  value: string
  level: Stage
}

const LEVEL_TEXT: Record<Stage, string> = {
  가능: 'text-level-ok',
  주의: 'text-level-warn',
  위험: 'text-level-bad',
}

// 여유시간 / 예측 빈자리 같은 수치 칸
export default function StatCell({ icon, label, value, level }: StatCellProps) {
  return (
    <div className="bg-surface-sunken flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-micro text-text-secondary font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-title3 font-medium">{value}</span>
        <span className={`text-micro font-medium ${LEVEL_TEXT[level]}`}>{level}</span>
      </div>
    </div>
  )
}
