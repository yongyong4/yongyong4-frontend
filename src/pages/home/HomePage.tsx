// S-01 홈 (경로 검색)
// 관련 기능: F-01-01~06
// 진행 중인 이동이 있으면 아래에 "이어 보기" 배너만 추가로 뜸 (같은 화면, 별도 페이지 아님)

import { useState, type ComponentProps } from 'react'
import { useNavigate } from 'react-router'

import HomeIndicator from '@/components/layout/HomeIndicator'
import { PATHS } from '@/routes/paths'

import HomeHero from './components/HomeHero'
import IntroSection, { type IntroSlide } from './components/IntroSection'
import OngoingTripBanner from './components/OngoingTripBanner'
import RecentSearches from './components/RecentSearches'
import SearchCard from './components/SearchCard'
import TrialNotice from './components/TrialNotice'

type OngoingTrip = Omit<ComponentProps<typeof OngoingTripBanner>, 'onResume'>

// TODO: 아래 값들은 위치·날씨·검색 기록·이동 상태 연동 전 임시 데이터
const MOCK_STATUS = '동백동 · 07:30 · 맑음'
const MOCK_ORIGIN = '현재 위치 · 동백동'
const MOCK_RECENT = ['판교역', '기흥역', '동백 세브란스병원', '강남역']
// 진행 중인 이동 없음. 배너를 미리 보려면 아래 값을 예시로 바꾸면 됨:
// { origin: '동백역', destination: '강남역', transitType: '광역', busNo: '5003', minutesToArrival: 3 }
const MOCK_ONGOING_TRIP = null as OngoingTrip | null

// 소개 카드는 3장 중 1장만 디자인되어 있음
const INTRO_SLIDES: IntroSlide[] = [
  {
    eyebrow: '세 가지 단계로',
    title: '한 눈에 보는 탑승 가능성',
    description: '여유시간과 예측 빈자리를 파악해\n종합적인 탑승 가능성을 예측해드려요',
  },
]
const INTRO_TOTAL = 3

export default function HomePage() {
  const navigate = useNavigate()
  const [recent, setRecent] = useState(MOCK_RECENT)

  return (
    <div className="bg-surface-sunken flex min-h-[844px] flex-col">
      <HomeHero status={MOCK_STATUS} />
      <SearchCard origin={MOCK_ORIGIN} onDestinationClick={() => navigate(PATHS.placeSearch)} />

      <main className="mt-[21px] flex-1 px-5">
        <IntroSection slide={INTRO_SLIDES[0]} index={0} total={INTRO_TOTAL} />
        {recent.length > 0 && <RecentSearches items={recent} onClear={() => setRecent([])} />}
        <TrialNotice />
      </main>

      {MOCK_ONGOING_TRIP && (
        <OngoingTripBanner {...MOCK_ONGOING_TRIP} onResume={() => navigate(PATHS.trip)} />
      )}

      {/* 스크롤해도 화면 맨 아래에 붙어 있게 (피그마와 같음) */}
      <div className="sticky bottom-0 z-30">
        <HomeIndicator />
      </div>
    </div>
  )
}
