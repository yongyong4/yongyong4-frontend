import type { Stage } from '@/types/stage'
import { cn } from '@/utils/cn'

export type IntroSlide = {
  eyebrow: string
  title: string
  /** 줄바꿈은 \n */
  description: string
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
        <span className="bg-surface-sunken flex shrink-0 flex-col gap-1.5 rounded-[14px] p-3">
          <LevelChip level="가능" />
          <LevelChip level="주의" />
          <LevelChip level="위험" />
        </span>
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

const LEVEL_CLASS: Record<Stage, string> = {
  가능: 'bg-level-ok-weak text-level-ok',
  주의: 'bg-level-warn-weak text-level-warn',
  위험: 'bg-level-bad-weak text-level-bad',
}

// 단계 표시. 공용 LevelPill(모서리 6px)과 달리 완전히 둥근 모양이라 여기서만 따로 씀
function LevelChip({ level }: { level: Stage }) {
  return (
    <span
      className={cn(
        'text-caption1 inline-flex items-center gap-1 rounded-full px-2 py-[3px] font-medium whitespace-nowrap',
        LEVEL_CLASS[level],
      )}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {level}
    </span>
  )
}
