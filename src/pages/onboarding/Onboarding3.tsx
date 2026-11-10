// O-03 온보딩 3/3 - 이동 중 버튼 안내

import locateGraySvg from '@/assets/onboarding/onboarding3-locate-gray.svg'
import locateWhiteSvg from '@/assets/onboarding/onboarding3-locate-white.svg'
import touchSvg from '@/assets/onboarding/onboarding3-touch.svg'
import Button from '@/components/common/Button'
import LineBadge from '@/components/common/LineBadge'

import FloatCard from './components/FloatCard'
import HintPill from './components/HintPill'
import OnboardingFrame from './components/OnboardingFrame'

type Onboarding3Props = {
  onStart: () => void
  onStartWithoutLocation: () => void
}

// ui/Caption1 (13px)
const NOTE = 'text-[13px] leading-[1.45] tracking-[-0.26px]'

export default function Onboarding3({ onStart, onStartWithoutLocation }: Onboarding3Props) {
  return (
    <OnboardingFrame
      step={3}
      onSkip={onStartWithoutLocation}
      title={'이동 중엔\n버튼만 눌러 주세요'}
      description="탑승 여부를 알려주시면, 탑승 시점을 기준으로 현재 경로의 위험 단계를 다시 계산해드려요."
      footerClassName="pb-2.5"
      footer={
        <div className="flex flex-col gap-1">
          <div className="bg-surface-sunken text-text-secondary flex items-center gap-2 rounded-[14px] px-3.5 py-3">
            <img src={locateGraySvg} alt="" className="size-[18px] shrink-0" />
            <p className={`min-w-0 flex-1 ${NOTE}`}>위치는 도착 확인에만 쓰고 저장하지 않아요</p>
          </div>
          <Button fullWidth className="mt-3" onClick={onStart}>
            위치 허용하고 시작하기
          </Button>
          <button
            type="button"
            onClick={onStartWithoutLocation}
            className="text-label1 text-text-secondary py-3 font-medium"
          >
            위치 없이 시작하기
          </button>
        </div>
      }
      illustration={
        <>
          <FloatCard className="top-[30px] left-7 flex w-[286px] items-center gap-2.5 rounded-2xl py-2.5 pr-3.5 pl-3">
            <span className="bg-brand-primary flex size-8 shrink-0 items-center justify-center rounded-[10px]">
              <img src={locateWhiteSvg} alt="" className="size-[18px]" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-px whitespace-nowrap">
              <p className="text-label1 font-medium">동백2차 정류장에 도착했나요?</p>
              <p className={`text-text-tertiary ${NOTE}`}>위치를 허용하면 먼저 물어봐요</p>
            </div>
          </FloatCard>

          <FloatCard className="top-[112px] left-7 flex w-[286px] flex-col gap-3 rounded-[20px] p-4">
            <div className="flex items-center gap-1.5">
              <LineBadge type="광역" label="5003" />
              <span className="text-label1 font-semibold">3분 후 도착</span>
            </div>
            <div className="flex gap-2">
              <Button variant="tertiary" className="min-w-0 flex-1">
                못 탔어요
              </Button>
              <Button className="min-w-0 flex-1">탔어요</Button>
            </div>
          </FloatCard>

          <img src={touchSvg} alt="" className="absolute top-[166px] left-[242px] size-11" />
          <HintPill className="top-[261px] left-[100px]">탔다면 → 다음 구간 안내</HintPill>
        </>
      }
    />
  )
}
