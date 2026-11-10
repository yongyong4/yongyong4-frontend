// S-01-1 장소 검색
// 관련 기능: F-01-01, F-01-02

import { useState } from 'react'
import { useNavigate } from 'react-router'

import HomeIndicator from '@/components/layout/HomeIndicator'
import { PATHS } from '@/routes/paths'

import FilterChips from './components/FilterChips'
import PlaceResultItem, { type PlaceKind, type PlaceResult } from './components/PlaceResultItem'
import SearchHeader from './components/SearchHeader'

type FilterKey = 'all' | PlaceKind

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'place', label: '장소' },
  { key: 'busStop', label: '정류장' },
  { key: 'station', label: '역' },
]

// TODO: 아래 값들은 위치·장소 검색 API 연동 전 임시 데이터
// 연동하면 query/filter를 요청 조건으로 보내고, 응답을 PlaceResult[]로 바꿔 results에 넣으면 됨
const MOCK_ORIGIN = '현재 위치 · 동백역 부근'
const MOCK_QUERY = '강남'
const MOCK_RESULTS: PlaceResult[] = [
  {
    id: 'gangnam-station',
    kind: 'station',
    name: '강남역',
    description: '서울 강남구 강남대로 396',
    distance: '24km',
    lines: [
      { label: '신분당', color: '#d4123b' },
      { label: '2호선', color: '#3db04a' },
    ],
  },
  {
    id: 'gangnam-bus-stop',
    kind: 'busStop',
    name: '강남역 광역버스 정류장',
    description: '중앙차로 · 5003번 · 5005번 · 1560번',
    distance: '24km',
  },
  {
    id: 'gangnam-daero',
    kind: 'place',
    name: '강남대로',
    description: '서울 서초구·강남구',
    distance: '23km',
  },
  {
    id: 'gangnam-gu-office-station',
    kind: 'station',
    name: '강남구청역',
    description: '서울 강남구 학동로 346',
    distance: '27km',
  },
  {
    id: 'gangnam-severance',
    kind: 'place',
    name: '강남세브란스병원',
    description: '서울 강남구 언주로 211',
    distance: '25km',
  },
]

export default function PlaceSearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState(MOCK_QUERY)
  const [filter, setFilter] = useState<FilterKey>('all')

  // 지금은 화면에서 종류만 걸러냄. 연동하면 서버가 걸러준 결과를 그대로 쓰면 됨
  const results = filter === 'all' ? MOCK_RESULTS : MOCK_RESULTS.filter((p) => p.kind === filter)

  // 장소를 고르면 홈으로 돌아가 도착지로 보여줌. 검색 화면은 기록에서 빼서 뒤로가기로 다시 안 나옴
  const handleSelect = (place: PlaceResult) =>
    navigate(PATHS.home, { state: { destination: place }, replace: true })

  return (
    <div className="flex min-h-[844px] flex-col">
      <SearchHeader
        query={query}
        onQueryChange={setQuery}
        onClear={() => setQuery('')}
        onBack={() => navigate(PATHS.home)}
        origin={MOCK_ORIGIN}
      />
      <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
      <div aria-hidden="true" className="bg-surface-sunken h-2 shrink-0" />

      <main>
        <ul className="px-5">
          {results.map((place) => (
            <PlaceResultItem key={place.id} place={place} query={query} onSelect={handleSelect} />
          ))}
        </ul>
        <MapPickRow />
      </main>

      {/* 스크롤해도 화면 맨 아래에 붙어 있게 (피그마와 같음) */}
      <div className="sticky bottom-0 z-30 mt-auto">
        <HomeIndicator />
      </div>
    </div>
  )
}

// 지도에서 직접 고르기
function MapPickRow({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-label1 text-brand-strong flex w-full items-center gap-2 px-5 py-3.5 font-medium"
    >
      <LocateIcon />
      지도에서 직접 고르기
    </button>
  )
}

// icon/locate 18px
function LocateIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 9C12 10.6569 10.6569 12 9 12C7.34315 12 6 10.6569 6 9C6 7.34315 7.34315 6 9 6C10.6569 6 12 7.34315 12 9Z" />
      <path d="M9 1.5V3.75M9 14.25V16.5M1.5 9H3.75M14.25 9H16.5" />
    </svg>
  )
}
