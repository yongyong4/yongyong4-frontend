// 카카오맵 JavaScript SDK 불러오기 + 이 프로젝트에서 쓰는 부분만 타입 정의
// 키: .env의 VITE_KAKAO_MAP_KEY (카카오 디벨로퍼스 JavaScript 키)
// 카카오 디벨로퍼스 [플랫폼 > Web]에 등록한 도메인에서만 지도가 뜸 (예: http://localhost:5173)

import { useEffect, useState } from 'react'

import { isInServiceArea } from '@/apis/places'

export type KakaoLatLng = { getLat(): number; getLng(): number }

type KakaoLatLngBounds = { extend(point: KakaoLatLng): void; isEmpty(): boolean }

export type KakaoMap = {
  setCenter(point: KakaoLatLng): void
  setLevel(level: number): void
  /** padding 순서: 위, 오른쪽, 아래, 왼쪽 (px) */
  setBounds(
    bounds: KakaoLatLngBounds,
    top?: number,
    right?: number,
    bottom?: number,
    left?: number,
  ): void
  relayout(): void
}

export type KakaoOverlay = { setMap(map: KakaoMap | null): void }

export type KakaoMaps = {
  load(callback: () => void): void
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  LatLngBounds: new () => KakaoLatLngBounds
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap
  Polyline: new (options: {
    map?: KakaoMap
    path: KakaoLatLng[]
    strokeWeight: number
    strokeColor: string
    strokeOpacity?: number
    strokeStyle?: 'solid' | 'shortdot' | 'shortdash' | 'dot' | 'dash'
    zIndex?: number
  }) => KakaoOverlay
  CustomOverlay: new (options: {
    map?: KakaoMap
    position: KakaoLatLng
    content: HTMLElement
    xAnchor?: number
    yAnchor?: number
    zIndex?: number
    clickable?: boolean
  }) => KakaoOverlay
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps }
  }
}

let loading: Promise<KakaoMaps> | null = null

/** SDK를 한 번만 불러옴. 키가 없거나 도메인이 등록되지 않았으면 실패 */
export function loadKakaoMaps(): Promise<KakaoMaps> {
  const key = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined
  if (!key) return Promise.reject(new Error('VITE_KAKAO_MAP_KEY가 없어요'))

  loading ??= new Promise<KakaoMaps>((resolve, reject) => {
    const ready = () => {
      const maps = window.kakao?.maps
      if (!maps) {
        reject(new Error('카카오맵을 불러오지 못했어요'))
        return
      }
      maps.load(() => resolve(maps))
    }

    if (window.kakao?.maps) {
      ready()
      return
    }

    const script = document.createElement('script')
    // autoload=false: 스크립트를 받은 뒤 maps.load로 직접 초기화
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`
    script.async = true
    script.onload = ready
    script.onerror = () => {
      // 도메인 미등록(401) 등. 다음에 다시 시도할 수 있게 비움
      loading = null
      script.remove()
      reject(new Error('카카오맵을 불러오지 못했어요'))
    }
    document.head.appendChild(script)
  })

  return loading
}

/** 좌표. x = 경도, y = 위도 (BE 응답과 같은 형식) */
export type MapPoint = { x: number; y: number }

/**
 * 기기 현재 위치를 계속 따라감. 위치 권한이 이미 허용된 경우에만 동작하고 허용 창은 띄우지 않음
 * (허용 안내는 홈의 위치 권한 시트에서만). 위치는 화면 표시에만 쓰고 저장하지 않음.
 * 서비스 지역(동백 일대) 밖이면 null (출발지를 동백역으로 바꾸는 것과 같은 기준)
 */
export function useMyLocation(enabled = true): MapPoint | null {
  const [point, setPoint] = useState<MapPoint | null>(null)

  useEffect(() => {
    if (!enabled || !('geolocation' in navigator) || !('permissions' in navigator)) return

    let watchId: number | null = null
    let cancelled = false
    let status: PermissionStatus | undefined

    const start = () => {
      if (watchId !== null) return
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const here = { x: pos.coords.longitude, y: pos.coords.latitude }
          // 서비스 지역(동백 일대) 밖이면 점을 찍지 않음. 출발지가 동백역으로 바뀌는 것과 같은 기준이라,
          // 지도가 멀리 있는 실제 위치로 끌려가지 않고 경로·동백 쪽에 머무름
          setPoint(isInServiceArea(here) ? here : null)
        },
        () => {
          // 위치를 못 얻으면 내 위치 표시만 빠짐
        },
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
      )
    }
    const stop = () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
      watchId = null
    }

    navigator.permissions.query({ name: 'geolocation' }).then(
      (result) => {
        if (cancelled) return
        status = result
        if (result.state === 'granted') start()
        result.onchange = () => (result.state === 'granted' ? start() : stop())
      },
      () => {},
    )

    return () => {
      cancelled = true
      stop()
      if (status) status.onchange = null
    }
  }, [enabled])

  return point
}
