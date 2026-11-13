// S-01-1 장소 검색
// 관련 기능: F-01-01, F-01-02
// GET /api/v1/places/search (apis/places.ts)

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import {
  getOrigin,
  originLabel,
  peekOrigin,
  searchPlaces,
  type PlaceSearchResponse,
} from '@/apis/places'
import { MESSAGES } from '@/constants/messages'
import { PATHS } from '@/routes/paths'

import FilterChips from './components/FilterChips'
import PlaceResultItem, { type PlaceKind, type PlaceResult } from './components/PlaceResultItem'
import SearchHeader from './components/SearchHeader'
import { queryFor, toPlaceResult } from './placeView'
import { addRecentSearch } from './recentSearches'

type FilterKey = 'all' | PlaceKind

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'place', label: '장소' },
  { key: 'busStop', label: '정류장' },
  { key: 'station', label: '역' },
]

/** 타이핑이 멈춘 뒤 이만큼(ms) 지나면 검색함. 글자마다 요청이 나가지 않게 */
const SEARCH_DEBOUNCE_MS = 300

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return debounced
}

export default function PlaceSearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const originQuery = useQuery({ queryKey: ['origin'], queryFn: getOrigin, staleTime: Infinity })
  const origin = originQuery.data ?? peekOrigin()

  const keyword = useDebounced(query, SEARCH_DEBOUNCE_MS).trim()
  const searchQuery = queryFor(keyword, filter)
  const placesQuery = useQuery<PlaceSearchResponse>({
    queryKey: ['places', searchQuery],
    // 좌표(x, y)를 보내면 서버가 "가까운 순"으로 정렬해서 동네 가게만 나옴.
    // 도착지 검색이라 관련도 순이 맞아서 검색어만 보내고, 거리는 받은 좌표로 화면에서 계산함
    queryFn: ({ signal }) => searchPlaces({ query: searchQuery }, signal),
    enabled: keyword.length > 0,
    staleTime: 5 * 60_000,
    retry: 0,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  const all: PlaceResult[] = placesQuery.data?.places.map((p) => toPlaceResult(p, origin)) ?? []
  // 칩을 고르면 그 종류만 남김 ("전체"는 그대로)
  const results: PlaceResult[] =
    filter === 'all' ? all : all.filter((p: PlaceResult) => p.kind === filter)

  // 장소를 고르면 최근 검색에 남기고 홈으로 돌아가 도착지로 보여줌.
  // 검색 화면은 기록에서 빼서 뒤로가기로 다시 안 나옴
  const handleSelect = (place: PlaceResult) => {
    addRecentSearch(place)
    navigate(PATHS.home, { state: { destination: place }, replace: true })
  }

  const status = (() => {
    if (!keyword) return null
    if (placesQuery.isError) return '검색하지 못했어요. 잠시 후 다시 시도해 주세요'
    if (placesQuery.isPending || placesQuery.data === undefined) return '검색하고 있어요'
    if (results.length === 0) return MESSAGES.noSearchResult
    return null
  })()

  return (
    <div className="flex min-h-[844px] flex-col">
      <SearchHeader
        query={query}
        onQueryChange={setQuery}
        onClear={() => setQuery('')}
        onBack={() => navigate(PATHS.home)}
        origin={originLabel(origin)}
      />
      <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
      <div aria-hidden="true" className="bg-surface-sunken h-2 shrink-0" />

      <main>
        <ul className="px-5">
          {results.map((place: PlaceResult) => (
            <PlaceResultItem key={place.id} place={place} query={query} onSelect={handleSelect} />
          ))}
        </ul>
        {status && (
          <p role="status" className="text-note text-text-tertiary px-5 py-8 text-center">
            {status}
          </p>
        )}
        <MapPickRow />
      </main>
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
