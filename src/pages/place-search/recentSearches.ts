// 최근 검색 장소 (F-01-03). 기기에만 저장하고 서버에는 보내지 않음 (NFR-09)

import { MAX_RECENT_SEARCHES } from '@/constants/config'
import { storage } from '@/utils/storage'

import type { PlaceResult } from './components/PlaceResultItem'

const KEY = storage.KEYS.recentSearches

export function readRecentSearches(): PlaceResult[] {
  const saved = storage.read<unknown>(KEY, [])
  if (!Array.isArray(saved)) return []
  // 예전 형식이나 깨진 값은 걸러냄
  return saved.filter(
    (p): p is PlaceResult =>
      !!p && typeof p.name === 'string' && typeof p.x === 'number' && typeof p.y === 'number',
  )
}

/** 맨 앞에 추가. 같은 장소는 위로 올리고 최대 개수까지만 남김 */
export function addRecentSearch(place: PlaceResult): PlaceResult[] {
  const next = [place, ...readRecentSearches().filter((p) => p.id !== place.id)].slice(
    0,
    MAX_RECENT_SEARCHES,
  )
  storage.write(KEY, next)
  return next
}

export function clearRecentSearches() {
  storage.write(KEY, [])
}
