import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

export type IntroSlide = {
  eyebrow: string
  title: string
  /** 줄바꿈은 \n */
  description: string
  /** 카드 오른쪽에 들어가는 그림 */
  visual: ReactNode
}

type IntroSectionProps = {
  slide: IntroSlide
  /** 현재 장 (0부터) */
  index: number
  total: number
  /** 소개 카드를 눌렀을 때 (서비스 안내로 이동) */
  onCardClick?: () => void
}

// "이렇게 도와드려요" 소개 카드 + 페이지 점
export default function IntroSection({ slide, index, total, onCardClick }: IntroSectionProps) {
  return (
    <section>
      <div className="text-title3 flex items-center justify-between font-medium">
        <h2>이렇게 도와드려요</h2>
        <p className="text-caption1 flex gap-1">
          <span>{index + 1}</span>
          <span className="text-text-tertiary">/ {total}</span>
        </p>
      </div>

      {/* 눌림 효과는 피그마에 없어서 Button과 같은 임시 처리 */}
      <button
        type="button"
        onClick={onCardClick}
        className="bg-surface-default mt-2.5 flex w-full items-center gap-3.5 rounded-[20px] p-5 text-left transition-[filter] active:brightness-95"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-label1 text-brand-strong font-medium">{slide.eyebrow}</span>
          <span className="text-title3 font-medium">{slide.title}</span>
          <span className="text-note text-text-secondary whitespace-pre-line">
            {slide.description}
          </span>
        </span>
        {slide.visual}
      </button>

      <div className="mt-2.5 flex items-center justify-center gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 rounded-[3px]',
              i === index ? 'bg-brand-primary w-4' : 'bg-line-default w-1.5',
            )}
          />
        ))}
      </div>
    </section>
  )
}

// 좌석 배치 (true = 빈자리)
const SEAT_ROWS = [
  [false, false, true],
  [false, true, false],
  [true, false, false],
  [false, false, true],
]

// 소개 카드 1장: 버스 안 빈자리 그림
export function SeatPreview() {
  return (
    <span
      aria-hidden="true"
      className="bg-surface-sunken flex h-[105px] w-[71px] shrink-0 flex-col items-center justify-center gap-2 rounded-[14px] p-3"
    >
      <BusIcon />
      <span className="flex flex-col gap-1">
        {SEAT_ROWS.map((row, r) => (
          <span key={r} className="flex gap-1">
            {row.map((vacant, c) => (
              <span
                key={c}
                className={cn(
                  'size-2.5 rounded-[3px]',
                  vacant ? 'bg-level-ok-weak border-level-ok border-[1.5px]' : 'bg-line-default',
                )}
              />
            ))}
          </span>
        ))}
      </span>
    </span>
  )
}

// icon/bus 18px
function BusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-level-ok shrink-0"
    >
      <path d="M6 2.25H12C13.2426 2.25 14.25 3.25736 14.25 4.5V11.25C14.25 12.4926 13.2426 13.5 12 13.5H6C4.75736 13.5 3.75 12.4926 3.75 11.25V4.5C3.75 3.25736 4.75736 2.25 6 2.25Z" />
      <path d="M3.75 8.25H14.25M6 15.75V13.5M12 15.75V13.5" />
    </svg>
  )
}
