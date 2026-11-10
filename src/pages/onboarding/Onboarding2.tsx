// O-02 온보딩 2/3 - 대안 전략 제안

import Button from '@/components/common/Button'

import OnboardingFrame from './components/OnboardingFrame'
import RouteCard from './components/RouteCard'
import RouteIllustration from './components/RouteIllustration'

type Onboarding2Props = {
  onNext: () => void
  onSkip: () => void
}

export default function Onboarding2({ onNext, onSkip }: Onboarding2Props) {
  return (
    <OnboardingFrame
      step={2}
      onSkip={onSkip}
      title={'버스를 놓칠 것 같은 순간,\n대안 전략까지 제안합니다'}
      description={
        '타야하는 버스를 못 탔을 때의 대안까지 비교해 드려요.\n앞 정류장에서 거슬러타기, 우회, 대체 노선, 다른 교통수단 중 가장 안전하고 빠른 경로를 선택해보세요.'
      }
      footer={
        <Button fullWidth onClick={onNext}>
          다음
        </Button>
      }
      illustration={
        <>
          {/* 지도 배경 자리 (지도 SDK 연동 전 임시) */}
          <div className="absolute -top-[120px] -left-[30px] h-[844px] w-[390px] bg-[#f6f5f1] opacity-55" />
          <RouteIllustration className="absolute top-0 left-0" />

          <RouteCard
            highlighted
            label="앞 정류장에서 타면"
            value="61분"
            level="가능"
            className="top-10 left-28"
          />
          <RouteCard
            label="못 타면"
            value="70분"
            level="위험"
            className="top-[150px] left-[150px]"
          />
        </>
      }
    />
  )
}
