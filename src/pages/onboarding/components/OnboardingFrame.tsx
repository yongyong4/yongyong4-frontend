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
    <div className="relative flex min-h-[844px] flex-col pt-[52px]">
      <OnboardingLogo />
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

// 상단바 로고 (초록 그라데이션). 피그마: 왼쪽 24, 위 21.5 (높이 53인 상단바 안에서 세로 가운데)
function OnboardingLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="39"
      height="25"
      viewBox="0 0 39 25"
      fill="none"
      aria-hidden="true"
      className="absolute top-[21.5px] left-6"
    >
      <path
        d="M34.114 6.7594C34.8083 6.7594 35.3711 7.33039 35.3711 8.03475V11.7888C35.3711 12.4932 35.9339 13.0642 36.6281 13.0642H37.743C38.4372 13.0642 39 13.6352 39 14.3396V14.3878C39 15.0921 38.4372 15.6631 37.743 15.6631H36.6281C35.9339 15.6631 35.3711 16.2341 35.3711 16.9385V23.7246C35.3711 24.429 34.8083 25 34.114 25H33.948C33.2537 25 32.6909 24.429 32.6909 23.7246V8.03475C32.6909 7.3304 33.2537 6.7594 33.948 6.7594H34.114ZM28.1745 12.607C28.8491 12.607 29.3959 13.1618 29.3959 13.8462C29.3959 14.5307 28.8491 15.0856 28.1745 15.0856H22.5651C21.8709 15.0856 21.3081 15.6566 21.3081 16.3609V19.1043C21.3081 19.8087 21.8709 20.3797 22.5651 20.3797H28.9691C29.6371 20.3797 30.1787 20.9292 30.1787 21.607C30.1787 22.2848 29.6371 22.8342 28.9691 22.8343H19.956C19.8354 22.8343 19.7188 22.8166 19.6084 22.7844C19.4172 22.744 19.2332 22.6572 19.0738 22.5234L12.4124 16.9283C11.8721 16.4744 11.0702 16.5571 10.6308 17.112L6.78979 21.9628C6.35519 22.5117 5.56445 22.5994 5.0232 22.1588L4.96207 22.109C4.41348 21.6624 4.33273 20.8461 4.78296 20.2979L10.814 12.9543C10.9787 12.7538 11.2227 12.6378 11.4801 12.6377C11.6921 12.6377 11.8968 12.7166 12.0554 12.8593L17.6534 17.8974C18.0589 18.2623 18.699 17.9703 18.699 17.4204V13.8823C18.699 13.178 19.2618 12.607 19.956 12.607H28.1745ZM15.4835 0C16.1778 0 16.7406 0.570997 16.7406 1.27536V12.8504C16.7405 13.5547 16.1777 14.1257 15.4835 14.1257H15.3627C14.6693 14.1257 14.1069 13.556 14.1057 12.8525L14.0863 1.27747C14.0852 0.572292 14.6483 0 15.3433 0H15.4835ZM5.73985 0.457211C9.15528 0.457211 11.4323 2.93582 11.4323 5.9679C11.4323 9.02405 9.15528 11.5026 5.73985 11.5026C2.22956 11.5026 0 9.02404 0 5.9679C2.86187e-06 2.93583 2.22957 0.457225 5.73985 0.457211ZM28.1864 8.10699C28.8544 8.10702 29.3959 8.65649 29.3959 9.33427C29.3959 10.0121 28.8544 10.5615 28.1864 10.5616H19.9087C19.2406 10.5616 18.699 10.0121 18.699 9.33427C18.699 8.65647 19.2406 8.10699 19.9087 8.10699H28.1864ZM5.73985 2.8155C3.77125 2.81552 2.60907 4.18717 2.60907 5.9679C2.60907 7.70051 3.77125 9.14433 5.73985 9.14434C7.66103 9.14434 8.84694 7.70052 8.84694 5.9679C8.84694 4.18716 7.66103 2.8155 5.73985 2.8155Z"
        fill="url(#onboarding-logo-gradient)"
      />
      <defs>
        <linearGradient
          id="onboarding-logo-gradient"
          x1="7.8"
          y1="2.5"
          x2="20.0034"
          y2="27.883"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3FA375" />
          <stop offset="1" stopColor="#60974C" />
        </linearGradient>
      </defs>
    </svg>
  )
}
