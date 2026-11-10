import type { ComponentProps } from 'react'

import { cn } from '@/utils/cn'

// 일러스트 위 검정 안내 말풍선. 위치는 className으로
export default function HintPill({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'bg-text-primary text-text-inverse text-caption1 absolute rounded-full py-1.5 pr-3 pl-2.5 font-medium whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}
