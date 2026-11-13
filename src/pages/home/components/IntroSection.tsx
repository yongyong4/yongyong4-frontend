import { useRef, useState, type ReactNode } from 'react'

import iconChevronDown from '@/assets/home/icon-chevron-down.svg'
import strategyOk from '@/assets/home/strategy-ok.svg'
import strategyRisk from '@/assets/home/strategy-risk.svg'
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
  slides: IntroSlide[]
  /** 소개 카드를 눌렀을 때 (서비스 안내로 이동) */
  onCardClick?: () => void
}

/** 카드 사이 간격(px). 넘길 때 옆 카드와 붙어 보이지 않게 */
const CARD_GAP = 12

// "이렇게 도와드려요" 소개 카드 + 페이지 점 (피그마 "이렇게 도와드려요 카드" 1~3)
// 옆으로 밀면 넘어감 (가로 스크롤 + 스냅). 마우스로는 아래 점을 눌러서 넘김
export default function IntroSection({ slides, onCardClick }: IntroSectionProps) {
  const [index, setIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    const next = Math.round(track.scrollLeft / (track.clientWidth + CARD_GAP))
    setIndex(Math.min(Math.max(next, 0), slides.length - 1))
  }

  const goTo = (i: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: i * (track.clientWidth + CARD_GAP), behavior: 'smooth' })
  }

  return (
    <section aria-roledescription="carousel" aria-label="이렇게 도와드려요">
      <div className="text-title3 flex items-center justify-between font-medium">
        <h2>이렇게 도와드려요</h2>
        <p className="text-caption1 flex gap-1" aria-live="polite">
          <span>{index + 1}</span>
          <span className="text-text-tertiary">/ {slides.length}</span>
        </p>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        style={{ gap: CARD_GAP }}
        className="mt-2.5 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {slides.map((slide, i) => (
          // 눌림 효과는 피그마에 없어서 Button과 같은 임시 처리
          <button
            key={slide.eyebrow}
            type="button"
            onClick={onCardClick}
            aria-label={`${i + 1} / ${slides.length}: ${slide.title}`}
            className="bg-surface-default flex w-full shrink-0 snap-center items-center gap-3.5 rounded-[20px] p-5 text-left transition-[filter] active:brightness-95"
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
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-1.5">
        {slides.map((slide, i) => (
          <button
            key={slide.eyebrow}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`${i + 1}번째 카드 보기`}
            aria-current={i === index}
            className={cn(
              'h-1.5 rounded-[3px] transition-[width,background-color]',
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

// 소개 카드 2장: 탑승 가능 단계 (가능·주의·위험)
const LEVELS = [
  { label: '가능', className: 'bg-level-ok-weak text-level-ok' },
  { label: '주의', className: 'bg-level-warn-weak text-level-warn' },
  { label: '위험', className: 'bg-level-bad-weak text-level-bad' },
]

export function LevelsPreview() {
  return (
    <span
      aria-hidden="true"
      className="bg-surface-sunken flex shrink-0 flex-col items-start gap-1.5 rounded-[14px] p-3"
    >
      {LEVELS.map((level) => (
        <span
          key={level.label}
          className={cn(
            'text-caption1 flex items-center gap-1 rounded-full px-2 py-[3px] font-medium',
            level.className,
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {level.label}
        </span>
      ))}
    </span>
  )
}

// 소개 카드 3장: 위험한 전략 → 가능한 전략으로 바뀌는 그림
export function StrategyChangePreview() {
  return (
    <span
      aria-hidden="true"
      className="bg-surface-sunken flex h-[105px] w-[71px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[14px] p-3"
    >
      <img alt="" src={strategyRisk} width={46} height={18} />
      <img alt="" src={iconChevronDown} width={14} height={14} />
      <img alt="" src={strategyOk} width={46} height={18} />
    </span>
  )
}
