// O-01 온보딩 1/3 - 버스 빈자리 예측

import Button from '@/components/common/Button'
import LevelPill from '@/components/common/LevelPill'
import LineBadge from '@/components/common/LineBadge'
import IconClock from '@/components/icons/IconClock'
import IconSeat from '@/components/icons/IconSeat'

import FloatCard from './components/FloatCard'
import HintPill from './components/HintPill'
import OnboardingFrame from './components/OnboardingFrame'
import StatCell from './components/StatCell'

type Onboarding1Props = {
  onNext: () => void
  onSkip: () => void
}

export default function Onboarding1({ onNext, onSkip }: Onboarding1Props) {
  return (
    <OnboardingFrame
      step={1}
      onSkip={onSkip}
      title={'버스 빈 자리가 몇 석일지\n‘미리’ 예측해드려요'}
      description="기다리는 버스가 내가 대기 중인 정류장에 도착했을 때의 빈 자리 수를 미리 예측해드려요. 여유시간과 예측 빈자리를 기반으로 탑승 가능성까지 제시해드립니다."
      footer={
        <Button fullWidth onClick={onNext}>
          다음
        </Button>
      }
      illustration={
        <>
          <FloatCard className="top-9 left-7 flex w-[286px] flex-col gap-3 rounded-[20px] p-4">
            <div className="flex items-center gap-1.5">
              <LineBadge type="마을" label="5003" />
              <p className="text-label1 flex-1 font-medium">동백2차 · 11분 후</p>
              <LevelPill level="주의" label="탑승 주의" />
            </div>
            <div className="flex gap-2">
              <StatCell icon={<IconClock />} label="여유시간" value="2분" level="주의" />
              <StatCell icon={<IconSeat />} label="예측 빈자리" value="3석" level="주의" />
            </div>
          </FloatCard>

          <HintPill className="top-[183px] left-[67px]">
            세 가지 단계로 탑승 가능성을 제시합니다
          </HintPill>

          <div className="absolute top-[233px] left-7 flex w-[286px] justify-between rounded-2xl bg-white/70 px-4 py-3">
            <LevelPill level="가능" />
            <LevelPill level="주의" />
            <LevelPill level="위험" />
          </div>
        </>
      }
    />
  )
}
