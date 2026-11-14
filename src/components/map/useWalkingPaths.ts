// 지도의 걷는 구간(두 점을 직선으로 이은 선)을 실제 도보 경로로 바꿈
// GET /api/v1/routes/walking (카카오 도보 경로). 응답의 pathPoints([경도, 위도] 목록)를 선으로 그림

import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import { distanceMeters } from '@/apis/places'
import { searchWalkingRoute } from '@/apis/routes'

import type { MapPath, RouteGeometry } from './geometry'

/** 이보다 가까우면 직선으로 충분해서 도보 경로를 따로 받지 않음 (m) */
const MIN_WALK_METERS = 60

const round = (n: number) => Math.round(n * 100_000) / 100_000

/** 두 점만 있는 걷는 선이 아직 직선인 구간 */
const isStraightWalk = (path: MapPath) =>
  path.kind === 'walk' &&
  path.points.length === 2 &&
  distanceMeters(path.points[0], path.points[1]) >= MIN_WALK_METERS

/**
 * 직선으로 그려진 걷는 구간마다 도보 경로를 받아서, 받은 것부터 실제 경로로 바꾼 지도 모양을 돌려줌.
 * 아직 오지 않았거나 실패하면 직선 그대로 보여줌 (같은 구간은 캐시해서 다시 부르지 않음)
 */
export function useWalkingPaths(geometry: RouteGeometry | null): RouteGeometry | null {
  const straight = useMemo(
    () =>
      (geometry?.paths ?? [])
        .map((path, index) => ({ path, index }))
        .filter(({ path }) => isStraightWalk(path)),
    [geometry],
  )

  const results = useQueries({
    queries: straight.map(({ path }) => {
      const [from, to] = path.points
      return {
        queryKey: ['walking', round(from.x), round(from.y), round(to.x), round(to.y)],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          searchWalkingRoute({ startX: from.x, startY: from.y, endX: to.x, endY: to.y }, signal),
        staleTime: 30 * 60_000,
        retry: 0,
        refetchOnWindowFocus: false,
      }
    }),
  })

  // 결과가 바뀔 때만 새로 만들어서, 지도가 불필요하게 다시 그려지지 않게 함
  const signature = results.map((r) => r.dataUpdatedAt).join(',')

  return useMemo(() => {
    if (!geometry || straight.length === 0) return geometry
    const replaced = new Map<number, MapPath>()
    straight.forEach(({ index }, i) => {
      const points = results[i]?.data?.pathPoints
      if (points && points.length >= 2) {
        replaced.set(index, {
          kind: 'walk',
          points: points.map(([x, y]) => ({ x, y })),
        })
      }
    })
    if (replaced.size === 0) return geometry
    return { ...geometry, paths: geometry.paths.map((p, i) => replaced.get(i) ?? p) }
    // results는 매번 새 배열이라 값이 바뀐 것만 signature로 확인함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, straight, signature])
}
