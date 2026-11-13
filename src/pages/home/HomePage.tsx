// S-01 홈 (경로 검색)
// 관련 기능: F-01-01~06
// 진행 중인 이동이 있으면 아래에 "이어 보기" 배너만 추가로 뜸 (같은 화면, 별도 페이지 아님)

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ComponentProps } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { getOrigin, originLabel, peekOrigin, resetOrigin } from '@/apis/places'
import { getActiveTrip } from '@/apis/trip'
import { useNow } from '@/hooks/useNow'
import type { PlaceResult } from '@/pages/place-search/components/PlaceResultItem'
import {
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
} from '@/pages/place-search/recentSearches'
import { guessBusType } from '@/pages/routes/routePlans'
import { ACTIVE_TRIP_QUERY_KEY } from '@/pages/trip/useTripSession'
import { PATHS } from '@/routes/paths'
import type { ActiveTrip } from '@/types/tripApi'
import { onboardingStorage } from '@/utils/storage'
import { minutesUntil } from '@/utils/time'

import HomeHero from './components/HomeHero'
import IntroSection, { SeatPreview, type IntroSlide } from './components/IntroSection'
import LocationPermissionSheet from './components/LocationPermissionSheet'
import OngoingTripBanner from './components/OngoingTripBanner'
import RecentSearches from './components/RecentSearches'
import SearchCard from './components/SearchCard'
import TrialNotice from './components/TrialNotice'

type OngoingTrip = Omit<ComponentProps<typeof OngoingTripBanner>, 'onResume'>

// 진행 중인 이동(GET /api/v1/trips/active)을 "이어 보기" 배너 모양으로 바꿈.
// 응답에는 지금 어느 구간인지가 없어서 첫 버스 구간을 기준으로 보여줌
// TODO: 노선 종류(광역·일반·마을)는 응답에 없어서 번호 모양으로 추정함. BE가 내려주면 그 값 쓰기
function toOngoingTrip(trip: ActiveTrip, now: number): OngoingTrip | null {
  const { segments } = trip.currentRoute
  const bus = segments.find((s) => s.mode === 'BUS')
  if (!bus) return null
  return {
    origin: segments[0]?.boardName ?? '출발지',
    destination: trip.destName,
    transitType: guessBusType(bus.routeLabel),
    busNo: bus.routeLabel ?? '',
    minutesToArrival: minutesUntil(bus.plannedStartAt, now) ?? 0,
  }
}

// 소개 카드는 3장(예측 빈 좌석 / 탑승 위험 단계 / 실시간 재평가) 중 1장만 디자인되어 있음
const INTRO_SLIDES: IntroSlide[] = [
  {
    eyebrow: '예측 빈자리',
    title: '미리 보는 도착 시점 빈자리',
    description: '내 정류장에 버스가 도착했을 때 남아 있을\n좌석 수를 예측해요',
    visual: <SeatPreview />,
  },
]
const INTRO_TOTAL = 3

// 장소 검색 화면에서 장소를 고르면 navigate state로 { destination }이 넘어옴
function readDestination(state: unknown): PlaceResult | null {
  const destination = (state as { destination?: PlaceResult } | null)?.destination
  return destination && typeof destination.name === 'string' ? destination : null
}

// 위치 권한 시트를 "나중에"로 닫았는지. 탭을 닫기 전까지만 기억해서
// 장소를 고르고 홈으로 돌아올 때마다 다시 뜨지 않게 함
const SHEET_DISMISSED_KEY = 'yy4:location-sheet-dismissed'

function readSheetDismissed() {
  try {
    return sessionStorage.getItem(SHEET_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeSheetDismissed() {
  try {
    sessionStorage.setItem(SHEET_DISMISSED_KEY, '1')
  } catch {
    // 저장 실패는 무시 (시트가 다시 뜰 뿐)
  }
}

// 'checking' = 브라우저에 권한 상태를 물어보는 중, 'unknown' = 권한 상태를 알 수 없는 브라우저
type LocationPermission = PermissionState | 'checking' | 'unknown'

function useLocationPermission() {
  const supported = 'geolocation' in navigator
  const [permission, setPermission] = useState<LocationPermission>(() =>
    'permissions' in navigator ? 'checking' : 'unknown',
  )

  // 브라우저 설정에서 권한을 바꾸면 바로 따라가도록 구독
  useEffect(() => {
    if (!('permissions' in navigator)) return

    let cancelled = false
    let status: PermissionStatus | undefined
    navigator.permissions.query({ name: 'geolocation' }).then(
      (result) => {
        if (cancelled) return
        status = result
        setPermission(result.state)
        result.onchange = () => setPermission(result.state)
      },
      () => {
        if (!cancelled) setPermission('unknown')
      },
    )

    return () => {
      cancelled = true
      if (status) status.onchange = null
    }
  }, [])

  // 허용 요청. 처음이면 브라우저 위치 허용 창이 뜸. 위치를 얻으면 true
  // TODO: 얻은 좌표를 역지오코딩에 넘겨 출발지 문구("현재 위치 · 동백동")를 만들기
  const request = () =>
    new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermission('granted')
          resolve(true)
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) setPermission('denied')
          resolve(false)
        },
        { timeout: 10_000 },
      )
    })

  return { supported, permission, request }
}

export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const now = useNow(30_000)
  const [recent, setRecent] = useState(readRecentSearches)
  const destination = readDestination(location.state)

  // 출발지: 위치가 허용돼 있으면 현재 위치, 아니면 기본 출발지(동백역)
  const originQuery = useQuery({ queryKey: ['origin'], queryFn: getOrigin, staleTime: Infinity })
  const origin = originQuery.data ?? peekOrigin()

  // 진행 중인 이동이 있으면 배너로 이어 보기를 보여줌 (이동 중 화면과 같은 조회를 씀)
  const activeTripQuery = useQuery({ queryKey: ACTIVE_TRIP_QUERY_KEY, queryFn: getActiveTrip })
  const activeTrip = activeTripQuery.data?.active ? activeTripQuery.data.trip : null
  const ongoingTrip = activeTrip ? toOngoingTrip(activeTrip, now) : null

  const { supported, permission, request } = useLocationPermission()
  const [sheetDismissed, setSheetDismissed] = useState(readSheetDismissed)
  const [allowPending, setAllowPending] = useState(false)
  const [allowFailed, setAllowFailed] = useState(false)

  // 위치를 쓰고 있지 않거나(미허용·거부) 쓸 수 없는 상태면 안내 시트를 띄움
  const showLocationSheet =
    supported && permission !== 'checking' && permission !== 'granted' && !sheetDismissed

  const closeLocationSheet = () => {
    writeSheetDismissed()
    setSheetDismissed(true)
  }

  const handleAllowLocation = async () => {
    setAllowPending(true)
    setAllowFailed(false)
    const ok = await request()
    setAllowPending(false)
    // 성공하면 권한이 granted가 되어 시트가 저절로 닫힘. 실패하면 시트에서 안내 문구만 바뀜
    if (!ok) {
      setAllowFailed(true)
      return
    }
    // 이제부터 현재 위치를 출발지로 씀
    resetOrigin()
    void queryClient.invalidateQueries({ queryKey: ['origin'] })
  }

  // 최근 검색 칩을 누르면 그 장소를 도착지로 바로 후보 경로 목록으로
  const selectRecent = (name: string) => {
    const place = recent.find((p) => p.name === name)
    if (!place) return
    addRecentSearch(place)
    navigate(PATHS.routes, { state: { destination: place, origin } })
  }

  const clearRecent = () => {
    clearRecentSearches()
    setRecent([])
  }

  // 처음 들어온 사용자는 온보딩부터 (건너뛰기·시작하기를 누르면 본 것으로 기록됨)
  if (!onboardingStorage.isSeen()) {
    return <Navigate to={PATHS.onboarding} replace />
  }

  // 출발지와 도착지가 모두 채워지면 바로 후보 경로 목록으로 이동.
  // 출발지는 위치를 못 쓰는 경우에도 기본값이 있어서 도착지만 고르면 됨.
  // replace로 갈아끼워서 뒤로가기를 눌러도 이 화면에서 다시 튕겨 나가지 않음
  if (destination) {
    return <Navigate to={PATHS.routes} state={{ destination, origin }} replace />
  }

  return (
    <div className="bg-surface-sunken flex min-h-[844px] flex-col">
      <HomeHero />
      <SearchCard
        origin={originLabel(origin)}
        onDestinationClick={() => navigate(PATHS.placeSearch)}
      />

      {/* 검색 카드 아래 21px + 피그마의 빈칸 10px */}
      <main className="mt-[31px] flex-1 px-5">
        <IntroSection
          slide={INTRO_SLIDES[0]}
          index={0}
          total={INTRO_TOTAL}
          onCardClick={() => navigate(PATHS.guide)}
        />
        {recent.length > 0 && (
          <RecentSearches
            items={recent.map((p) => p.name)}
            onSelect={selectRecent}
            onClear={clearRecent}
          />
        )}
        <TrialNotice />
      </main>

      {ongoingTrip && <OngoingTripBanner {...ongoingTrip} onResume={() => navigate(PATHS.trip)} />}

      {showLocationSheet && (
        <LocationPermissionSheet
          onAllow={handleAllowLocation}
          onLater={closeLocationSheet}
          pending={allowPending}
          failed={allowFailed}
        />
      )}
    </div>
  )
}
