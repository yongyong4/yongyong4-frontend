// 공통 컴포넌트 미리보기. 개발 서버에서만 열림 (/dev/components)

import Button from '@/components/common/Button'
import LevelPill from '@/components/common/LevelPill'
import LineBadge from '@/components/common/LineBadge'
import type { StageWithUnknown } from '@/types/stage'
import type { TransitType } from '@/types/transit'

const VARIANTS = ['primary', 'secondary', 'tertiary', 'outline'] as const
const LEVELS: StageWithUnknown[] = ['가능', '주의', '위험', '정보 없음']
const TRANSITS: TransitType[] = ['광역', '일반', '마을', '에버라인', '수인분당', '도보']

export default function ComponentsPage() {
  return (
    <main className="flex flex-col gap-8 p-4">
      <section className="flex flex-col gap-3">
        <h2 className="text-label1 font-semibold">Button</h2>
        <div className="grid grid-cols-2 gap-3">
          {VARIANTS.map((variant) => (
            <Button key={`${variant}-lg`} variant={variant}>
              버튼
            </Button>
          ))}
          {VARIANTS.map((variant) => (
            <Button key={`${variant}-md`} variant={variant} size="md">
              버튼
            </Button>
          ))}
        </div>
        <Button fullWidth disabled>
          비활성 (임시 스타일)
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label1 font-semibold">Level Pill</h2>
        <div className="flex flex-wrap gap-3">
          {LEVELS.map((level) => (
            <LevelPill key={level} level={level} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <LevelPill level="가능" label="탑승 가능" />
          <LevelPill level="주의" label="탑승 주의" />
          <LevelPill level="위험" label="탑승 위험" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label1 font-semibold">Line Badge</h2>
        <div className="flex flex-wrap gap-3">
          {TRANSITS.map((type) => (
            <LineBadge key={type} type={type} label="5003" />
          ))}
        </div>
      </section>
    </main>
  )
}
