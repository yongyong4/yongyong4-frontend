import type { ComponentProps } from 'react'

import { cn } from '@/utils/cn'

// 일러스트 위에 떠 있는 흰색 카드 (elevation-1). 위치·모서리·여백은 className으로
export default function FloatCard({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('bg-surface-default shadow-elevation-1 absolute', className)} {...props} />
  )
}
