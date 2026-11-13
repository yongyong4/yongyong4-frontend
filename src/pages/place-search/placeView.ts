// 장소 검색 응답(PlaceInfo)을 화면용(PlaceResult)으로 바꾸는 함수

import { distanceMeters, type PlaceInfo } from '@/apis/places'

import type { PlaceKind, PlaceResult } from './components/PlaceResultItem'

// BE 응답에는 장소 종류가 없어서 이름으로 구분함
// TODO: BE가 카카오의 카테고리(category_group_code: SW8 지하철역 등)를 내려주면 그 값을 쓰기
const BUS_STOP = /(버스정류장|정류장|정류소)(\s*\(.*\))?$/
// 택시 승강장, 병원·호텔 셔틀 정류장은 노선버스 정류장이 아니라서 "장소"로 봄
const NOT_BUS_STOP = /택시|셔틀/
const STATION = /역(\s+\S*(호선|선|라인))?$/

export function inferKind(name: string): PlaceKind {
  if (BUS_STOP.test(name) && !NOT_BUS_STOP.test(name)) return 'busStop'
  if (STATION.test(name)) return 'station'
  return 'place'
}

/**
 * 칩마다 서버에 보낼 검색어.
 * 서버가 종류별 검색을 지원하지 않아서, 검색어에 "역"·"정류장"을 붙여 관련 결과가 나오게 함
 * TODO: BE가 카테고리 검색을 지원하면 검색어는 그대로 두고 카테고리만 보내기
 */
export function queryFor(keyword: string, kind: 'all' | PlaceKind): string {
  if (kind === 'station') return keyword.endsWith('역') ? keyword : `${keyword}역`
  if (kind === 'busStop') return /정류(장|소)$/.test(keyword) ? keyword : `${keyword} 정류장`
  return keyword
}

/** 24000 → "24km", 900 → "900m" */
export function formatDistance(meters: number | null): string {
  if (meters === null) return ''
  if (meters < 1000) return `${meters}m`
  const km = meters / 1000
  return `${km < 10 ? km.toFixed(1) : Math.round(km)}km`
}

/** origin을 주면 출발지에서의 거리를 계산해서 붙임 (서버가 거리를 안 준 경우) */
export function toPlaceResult(place: PlaceInfo, origin?: { x: number; y: number }): PlaceResult {
  const meters = place.distanceMeters ?? (origin ? distanceMeters(origin, place) : null)
  return {
    id: place.placeId,
    kind: inferKind(place.placeName),
    x: place.x,
    y: place.y,
    name: place.placeName,
    description: place.roadAddressName || place.addressName || '',
    distance: formatDistance(meters),
  }
}
