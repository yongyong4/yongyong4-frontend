import type { ReactNode } from 'react'

import HomeIndicator from '@/components/layout/HomeIndicator'
import { cn } from '@/utils/cn'

import OnboardingHeader, { type OnboardingStep } from './OnboardingHeader'

type OnboardingFrameProps = {
  step: OnboardingStep
  onSkip: () => void
  /** 342×330 일러스트 영역 안에 들어갈 내용 */
  illustration: ReactNode
  /** 줄바꿈은 \n */
  title: string
  description: string
  footer: ReactNode
  /** footer 아래 여백. 기본 pb-6 (버튼 하단 58px) */
  footerClassName?: string
}

// 온보딩 1~3 공통 뼈대: 헤더 → 일러스트 → 제목/설명 → 하단 버튼 → 홈 인디케이터
export default function OnboardingFrame({
  step,
  onSkip,
  illustration,
  title,
  description,
  footer,
  footerClassName = 'pb-6',
}: OnboardingFrameProps) {
  return (
    <div className="flex min-h-[844px] flex-col pt-[52px]">
      <OnboardingHeader step={step} onSkip={onSkip} />

      <div className="bg-brand-weak relative mx-auto mt-4 h-[330px] w-[342px] shrink-0 overflow-hidden rounded-[28px]">
        {illustration}
      </div>

      <div className="mt-[38px] flex flex-col gap-3 px-6">
        <h1 className="text-title1 font-semibold whitespace-pre-line">{title}</h1>
        <p className="text-body2 text-text-secondary whitespace-pre-line">{description}</p>
      </div>

      <div className={cn('mt-auto px-6', footerClassName)}>{footer}</div>

      <HomeIndicator />
    </div>
  )
}
