// P-04 정류장 도착 자동 확인 (F-05-06)
// 걷는 중에 내 위치가 타려는 정류장 50m 안에 들어오면 "도착했나요?"를 한 번 물어봄.
// 이동 중 응답(GET /trips/active)에는 정류장 좌표가 없어서, 출발할 때 저장해 둔 경로 모양
// (readTripGeometry)의 정류장 좌표를 씀
// TODO: BE가 이동 중 응답에 정류장 좌표를 내려주면 그 값으로 바꾸기

import { distanceMeters } from '@/apis/places'
import type { MapStop, RouteGeometry } from '@/components/map/geometry'
import type { MapPoint } from '@/components/map/kakao'

/** 정류장에 이만큼 가까워지면 물어봄 (m) */
export const STOP_ARRIVAL_METERS = 50

const ASKED_KEY = 'yy4:stop-arrival-asked'

const clean = (name: string | null | undefined) => (name ?? '').replace(/ 정류장$/, '').trim()

/**
 * 지금 걸어가는(타려는) 정류장 좌표.
 * 1) 이름이 같은 승차·환승 정류장 2) 없으면 탈것 순서(transitIndex)로 찾음
 */
export function findWalkTargetStop(
  geometry: RouteGeometry | null,
  transitIndex: number,
  boardName: string | null | undefined,
): MapStop | null {
  if (!geometry || transitIndex < 0) return null
  const candidates = geometry.stops.filter(
    (s) => s.kind === 'board' || s.kind === 'moveTo' || s.kind === 'transfer',
  )
  const name = clean(boardName)
  const byName = name ? candidates.find((s) => clean(s.name) === name) : undefined
  if (byName) return byName

  // 앞 정류장에서 타기(moveTo)는 첫 승차 정류장 대신이라 순서 비교에서 뺌
  const ordered = geometry.stops.filter((s) => s.kind === 'board' || s.kind === 'transfer')
  const byOrder = ordered[transitIndex]
  if (transitIndex === 0) return candidates.find((s) => s.kind === 'moveTo') ?? byOrder ?? null
  return byOrder ?? null
}

export function isNearStop(myLocation: MapPoint | null, stop: MapPoint | null) {
  if (!myLocation || !stop) return false
  return distanceMeters(myLocation, stop) <= STOP_ARRIVAL_METERS
}

// ── 정류장마다 한 번만 묻기 (새로고침해도 다시 묻지 않게 기기에 기록) ──

const askedKey = (tripId: number, segmentId: number) => `${tripId}:${segmentId}`

function readAsked(): string[] {
  try {
    const raw = localStorage.getItem(ASKED_KEY)
    const list: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function wasAsked(tripId: number, segmentId: number) {
  return readAsked().includes(askedKey(tripId, segmentId))
}

export function markAsked(tripId: number, segmentId: number) {
  try {
    // 지난 이동 기록이 계속 쌓이지 않게 같은 이동 것만 남김
    const prefix = `${tripId}:`
    const list = readAsked().filter((k) => k.startsWith(prefix))
    list.push(askedKey(tripId, segmentId))
    localStorage.setItem(ASKED_KEY, JSON.stringify(list))
  } catch {
    // 저장이 안 되면 이 화면에 있는 동안만 한 번 묻는 것으로 충분
  }
}
