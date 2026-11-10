// S-01 홈 (경로 검색)
// 관련 기능: F-01-01~06
// 진행 중인 이동이 있으면 아래에 "이어 보기" 배너만 추가로 뜸 (같은 화면, 별도 페이지 아님)

import { useEffect, useState, type ComponentProps } from 'react'
import { useLocation, useNavigate } from 'react-router'

import HomeIndicator from '@/components/layout/HomeIndicator'
import type { PlaceResult } from '@/pages/place-search/components/PlaceResultItem'
import { PATHS } from '@/routes/paths'

import HomeHero from './components/HomeHero'
import IntroSection, { type IntroSlide } from './components/IntroSection'
import LocationPermissionSheet from './components/LocationPermissionSheet'
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
  const [recent, setRecent] = useState(MOCK_RECENT)
  const destination = readDestination(location.state)

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
    if (!ok) setAllowFailed(true)
  }

  return (
    <div className="bg-surface-sunken flex min-h-[844px] flex-col">
      <HomeHero status={MOCK_STATUS} />
      <SearchCard
        origin={MOCK_ORIGIN}
        destination={destination?.name}
        onDestinationClick={() => navigate(PATHS.placeSearch)}
      />

      <main className="mt-[21px] flex-1 px-5">
        <IntroSection
          slide={INTRO_SLIDES[0]}
          index={0}
          total={INTRO_TOTAL}
          onCardClick={() => navigate(PATHS.guide)}
        />
        {recent.length > 0 && <RecentSearches items={recent} onClear={() => setRecent([])} />}
        <TrialNotice />
      </main>

      {MOCK_ONGOING_TRIP && (
        <OngoingTripBanner {...MOCK_ONGOING_TRIP} onResume={() => navigate(PATHS.trip)} />
      )}

      {showLocationSheet && (
        <LocationPermissionSheet
          onAllow={handleAllowLocation}
          onLater={closeLocationSheet}
          pending={allowPending}
          failed={allowFailed}
        />
      )}

      {/* 스크롤해도 화면 맨 아래에 붙어 있게 (피그마와 같음) */}
      <div className="sticky bottom-0 z-30">
        <HomeIndicator />
      </div>
    </div>
  )
}
