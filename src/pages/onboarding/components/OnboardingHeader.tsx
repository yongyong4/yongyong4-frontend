import { cn } from '@/utils/cn'

export type OnboardingStep = 1 | 2 | 3

type OnboardingHeaderProps = {
  step: OnboardingStep
  onSkip: () => void
}

const STEPS: OnboardingStep[] = [1, 2, 3]

// 진행 점 + 건너뛰기. 마지막 단계는 자리만 남기고 숨김
export default function OnboardingHeader({ step, onSkip }: OnboardingHeaderProps) {
  const hideSkip = step === 3

  return (
    <div className="flex h-10 items-center justify-between pr-4 pl-6">
      <div className="flex items-center gap-1.5">
        {STEPS.map((s) => (
          <span
            key={s}
            className={cn(
              'h-1.5 rounded-[3px] transition-[width]',
              s === step ? 'bg-brand-primary w-5' : 'bg-line-strong w-1.5',
            )}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onSkip}
        aria-hidden={hideSkip}
        tabIndex={hideSkip ? -1 : 0}
        className={cn(
          'text-label1 text-text-tertiary px-2.5 py-1.5 font-medium',
          hideSkip && 'pointer-events-none opacity-0',
        )}
      >
        건너뛰기
      </button>
    </div>
  )
}
