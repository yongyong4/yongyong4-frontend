// 장소 검색 API (S-01-1)와 출발지(현재 위치) 확인
// GET /api/v1/places/search  — 카카오 장소 검색 (F-01-01)

import { request } from '@/apis/client'

export type PlaceInfo = {
  placeId: string
  placeName: string
  addressName: string | null
  roadAddressName: string | null
  /** 경도 */
  x: number
  /** 위도 */
  y: number
  /** 검색 기준 좌표(x, y를 보냈을 때)에서의 거리 */
  distanceMeters: number | null
  placeUrl: string | null
}

export type PlaceSearchResponse = {
  query: string
  count: number
  places: PlaceInfo[]
}

/** x, y를 보내면 그 위치에서 가까운 순으로 거리도 같이 옴 */
export type PlaceSearchParams = { query: string; x?: number; y?: number; radius?: number }

export function searchPlaces(
  params: PlaceSearchParams,
  signal?: AbortSignal,
): Promise<PlaceSearchResponse> {
  const search = new URLSearchParams({ query: params.query })
  if (params.x !== undefined) search.set('x', String(params.x))
  if (params.y !== undefined) search.set('y', String(params.y))
  if (params.radius !== undefined) search.set('radius', String(params.radius))
  return request<PlaceSearchResponse>(`/v1/places/search?${search}`, { signal })
}

// ── 출발지 ─────────────────────────────────────────────────────────

export type Origin = {
  /** 화면에 보여줄 이름 */
  name: string
  x: number
  y: number
  /** true면 기기 위치, false면 기본 출발지(위치를 쓸 수 없을 때) */
  isCurrent: boolean
  /** 위치는 얻었지만 서비스 지역 밖이라 동백역으로 대신한 경우 (안내 문구용) */
  outOfService?: boolean
}

// 위치를 쓸 수 없을 때(권한 없음·거부·미지원) 쓰는 출발지. 시연 지역인 동백역
export const DEFAULT_ORIGIN: Origin = { name: '동백역', x: 127.1459, y: 37.2699, isCurrent: false }

// 실시간 분석은 용인 동백 일대 버스만 함. 이보다 멀면 실제 위치로 경로를 찾아도 "분석 불가"만 나와서,
// 서비스 지역 밖이면 출발지를 동백역으로 바꿔 모든 화면이 제대로 보이게 함 (경로 계산 기준도 동백역)
const SERVICE_RADIUS_M = 15_000

/** 기기 위치가 서비스 지역(동백 일대) 안인지. 출발지와 지도의 내 위치가 같은 기준을 쓰게 함 */
export function isInServiceArea(point: { x: number; y: number }): boolean {
  return distanceMeters(point, DEFAULT_ORIGIN) <= SERVICE_RADIUS_M
}

let originPromise: Promise<Origin> | null = null
let resolvedOrigin: Origin | null = null

async function resolveOrigin(): Promise<Origin> {
  try {
    if (!('geolocation' in navigator) || !('permissions' in navigator)) return DEFAULT_ORIGIN
    // 이미 허용된 경우에만 위치를 읽음. 허용 창은 홈의 위치 권한 안내(P-05)에서만 띄움
    const status = await navigator.permissions.query({ name: 'geolocation' })
    if (status.state !== 'granted') return DEFAULT_ORIGIN

    const position = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8_000,
        maximumAge: 60_000,
      }),
    )
    const here = { x: position.coords.longitude, y: position.coords.latitude }
    // 서비스 지역에서 너무 멀면 동백역 기준으로 (실제 위치로는 분석할 버스가 없음)
    if (!isInServiceArea(here)) {
      return { ...DEFAULT_ORIGIN, outOfService: true }
    }
    // 좌표는 경로 계산에만 쓰고 저장하지 않음 (NFR-09)
    // TODO: BE에 좌표 → 주소 변환 API가 생기면 "현재 위치 · 동백동"처럼 동네 이름을 붙이기
    return { name: '현재 위치', x: here.x, y: here.y, isCurrent: true }
  } catch {
    return DEFAULT_ORIGIN
  }
}

/** 출발지 확인. 한 번 확인하면 다시 묻지 않음 (권한이 바뀌면 resetOrigin 호출) */
export function getOrigin(): Promise<Origin> {
  originPromise ??= resolveOrigin().then((origin) => (resolvedOrigin = origin))
  return originPromise
}

/** 이미 확인된 출발지. 아직이면 기본 출발지 */
export function peekOrigin(): Origin {
  return resolvedOrigin ?? DEFAULT_ORIGIN
}

/** 위치 권한을 새로 허용했을 때 등, 출발지를 다시 확인해야 할 때 */
export function resetOrigin() {
  originPromise = null
  resolvedOrigin = null
}

/** 화면에 보여줄 출발지 문구 */
export function originLabel(origin: Origin): string {
  return origin.name
}

/** 두 좌표 사이 거리(m). 가까운 곳인지 판단하는 정도로만 쓰는 근사값 */
export function distanceMeters(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const R = 6_371_000
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.y - a.y)
  const dLng = rad(b.x - a.x)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.y)) * Math.cos(rad(b.y)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}
