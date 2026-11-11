// S-02 후보 경로 목록
// 관련 기능: F-02-01, F-02-02
// 출발지와 도착지가 모두 정해지면 보이는 화면

import { useLocation, useNavigate } from 'react-router'

import HomeIndicator from '@/components/layout/HomeIndicator'
import { PATHS } from '@/routes/paths'

import type { PlaceResult } from '@/pages/place-search/components/PlaceResultItem'

import RoutePlanCard, { type RoutePlan } from './components/RoutePlanCard'
import RoutesHeader from './components/RoutesHeader'

// TODO: 아래 값들은 경로 검색 API 연동 전 임시 데이터. 연동하면 응답을 RoutePlan[]로 바꿔서 넣으면 됨
const MOCK_ORIGIN = '동백역'
const MOCK_DESTINATION = '강남역'
const MOCK_DEPART_AT = '07:30'
const MOCK_BASE_AT = '07:29'

// "분석 불가" 카드를 미리 보려면 plans에 아래 항목을 넣으면 됨:
// { id: 'na', badges: [{ type: '마을', label: '마을5' }, { type: '에버라인', label: '에버' }, { type: '수인분당', label: '수인' }],
//   headline: '', level: '정보 없음', levelLabel: '분석 불가',
//   items: [{ kind: 'unavailable', time: '08:42', note: '72분' }] }
const MOCK_PLANS: RoutePlan[] = [
  {
    id: 'plan-5003',
    recommended: true,
    badges: [{ type: '광역', label: '5003' }],
    headline: '동백2차 · 11분 후',
    level: '주의',
    items: [
      {
        kind: 'ride',
        scenario: {
          board: { time: '08:29', note: '58분', slackMinutes: 2, seats: 3 },
          miss: { time: '08:47', note: '76분', nextBus: '5003', nextInMinutes: 18 },
        },
      },
    ],
  },
  {
    id: 'plan-5005',
    badges: [{ type: '광역', label: '5005' }],
    headline: '동백 호수공원 · 15분 후',
    level: '가능',
    items: [
      {
        kind: 'ride',
        scenario: {
          board: { time: '08:34', note: '64분', slackMinutes: 9, seats: 21 },
          miss: { time: '08:42', note: '72분', nextBus: '5005', nextInMinutes: 18 },
        },
      },
    ],
  },
  {
    id: 'plan-village-10',
    badges: [
      { type: '마을', label: '마을10' },
      { type: '에버라인', label: '에버' },
      { type: '수인분당', label: '수인' },
    ],
    headline: '',
    level: '가능',
    items: [
      {
        kind: 'ride',
        scenario: {
          board: { time: '08:42', note: '72분', slackMinutes: 6 },
          miss: { time: '08:54', note: '84분', nextBus: '마을10', nextInMinutes: 12 },
        },
      },
    ],
  },
  {
    id: 'plan-transfer',
    badges: [
      { type: '마을', label: '마을10' },
      { type: '광역', label: '5005' },
    ],
    headline: '동백역 · 4분 후',
    level: '주의',
    items: [
      {
        kind: 'ride',
        heading: {
          badge: { type: '마을', label: '마을10' },
          text: '동백역 승차 → 동백2차 하차',
          level: '가능',
          levelLabel: '탑승 가능',
        },
        scenario: {
          board: { time: '07:41', note: '동백2차 도착', slackMinutes: 6 },
          miss: { time: '07:53', note: '동백2차 도착', nextBus: '마을10', nextInMinutes: 12 },
        },
      },
      { kind: 'walk', text: '동백2차 → 동백 호수공원 정류장 · 5분' },
      {
        kind: 'ride',
        heading: {
          badge: { type: '광역', label: '5005' },
          text: '동백 호수공원에서 환승',
          level: '주의',
          levelLabel: '탑승 주의',
        },
        scenario: {
          board: { time: '08:36', note: '66분', slackMinutes: 2, seats: 4 },
          miss: { time: '08:52', note: '82분', nextBus: '5005', nextInMinutes: 16 },
        },
      },
    ],
  },
]

// 홈에서 도착지를 고르고 넘어오면 navigate state로 { destination }이 들어옴
function readDestination(state: unknown): PlaceResult | null {
  const destination = (state as { destination?: PlaceResult } | null)?.destination
  return destination && typeof destination.name === 'string' ? destination : null
}

export default function RoutesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // 주소창으로 바로 열면 도착지가 없어서 임시값을 보여줌
  const destination = readDestination(location.state)?.name ?? MOCK_DESTINATION

  // 주소창으로 바로 들어와서 되돌아갈 기록이 없으면 홈으로
  const goBack = () => {
    if (location.key === 'default') navigate(PATHS.home, { replace: true })
    else navigate(-1)
  }

  return (
    <div className="bg-surface-sunken flex min-h-[844px] flex-col">
      <RoutesHeader
        origin={MOCK_ORIGIN}
        destination={destination}
        departAt={MOCK_DEPART_AT}
        baseAt={MOCK_BASE_AT}
        onBack={goBack}
      />

      <main className="px-4 pt-3 pb-14">
        <ul className="flex flex-col gap-3">
          {MOCK_PLANS.map((plan) => (
            <li key={plan.id}>
              <RoutePlanCard plan={plan} />
            </li>
          ))}
        </ul>
      </main>

      {/* 스크롤해도 화면 맨 아래에 붙어 있게 (피그마와 같음) */}
      <div className="sticky bottom-0 z-30 mt-auto">
        <HomeIndicator />
      </div>
    </div>
  )
}
