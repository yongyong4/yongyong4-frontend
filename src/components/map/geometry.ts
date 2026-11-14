// 지도에 그릴 경로 모양 (정류장 + 선)
// 후보 경로 탐색 응답(GET /routes/search)의 구간 좌표로 만듦.
// 구간이 지나는 정류장 좌표(passStops)를 따라 선을 이음. BE가 도로를 따라가는 실제 노선 모양까지는
// 주지 않아서 정류장과 정류장 사이는 직선이고, passStops가 없는 구간은 출발·도착 두 점만 직선으로 이음
// 걷는 구간은 useWalkingPaths가 실제 도보 경로(GET /routes/walking)로 바꿔 줌

import type { RouteInfo } from '@/apis/routes'

import type { MapPoint } from './kakao'

/** board 첫 승차 / moveTo 옮겨 타는 정류장 / transfer 환승 / alight 마지막 하차 / destination 도착지 */
export type StopKind = 'board' | 'moveTo' | 'transfer' | 'alight' | 'destination'

export type MapStop = MapPoint & { name: string; kind: StopKind }

export type PathKind = 'bus' | 'subway' | 'walk'

/** dim: 지금 단계와 상관없는 구간이라 흐리게 그림 (이동 중 화면에서 지금 구간만 돋보이게) */
export type MapPath = { kind: PathKind; points: MapPoint[]; dim?: boolean }

export type RouteGeometry = { stops: MapStop[]; paths: MapPath[] }

type Options = {
  /** 출발 위치. 있으면 여기서 첫 정류장까지 도보 선을 그림 */
  origin?: MapPoint
  destination?: MapPoint & { name: string }
  /** 앞 정류장에서 타기처럼 첫 승차 정류장을 옮기는 경우 */
  moveTo?: MapPoint & { name: string }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const same = (a: MapPoint, b: MapPoint) =>
  Math.abs(a.x - b.x) < 0.0002 && Math.abs(a.y - b.y) < 0.0002

export function geometryFromRoute(route: RouteInfo, options: Options = {}): RouteGeometry {
  const transit = route.segments
    .filter((s) => s.mode !== 'WALK')
    .filter((s) => isNum(s.startX) && isNum(s.startY) && isNum(s.endX) && isNum(s.endY))
    .map((s) => ({
      kind: (s.mode === 'BUS' ? 'bus' : 'subway') as PathKind,
      start: { x: s.startX!, y: s.startY!, name: s.startName ?? '' },
      end: { x: s.endX!, y: s.endY!, name: s.endName ?? '' },
      // 지나는 정류장 좌표. 좌표가 깨진 항목은 뺌
      pass: (s.passStops ?? [])
        .filter((p) => isNum(p.x) && isNum(p.y))
        .map((p) => ({ x: p.x, y: p.y })),
    }))

  const stops: MapStop[] = []
  const paths: MapPath[] = []
  const { origin, destination, moveTo } = options

  transit.forEach((seg, index) => {
    const first = index === 0
    // 정류장이 2개 이상 있으면 정류장을 따라, 없으면 출발·도착 두 점을 직선으로
    const busPoints: MapPoint[] = seg.pass.length >= 2 ? [...seg.pass] : [seg.start, seg.end]

    if (first && moveTo && !same(moveTo, seg.start)) {
      // 앞 정류장에서 타면: 앞 정류장 → 원래 정류장 → 하차
      stops.push({ ...moveTo, kind: 'moveTo' })
      busPoints.unshift(moveTo)
    }
    stops.push({ ...seg.start, kind: first ? 'board' : 'transfer' })
    paths.push({ kind: seg.kind, points: busPoints })

    // 환승 사이 도보
    const next = transit[index + 1]
    if (next && !same(seg.end, next.start)) {
      paths.push({ kind: 'walk', points: [seg.end, next.start] })
    }
  })

  const firstStart = transit[0] ? (moveTo ?? transit[0].start) : null
  const lastEnd = transit.at(-1)?.end ?? null

  if (lastEnd) stops.push({ ...lastEnd, kind: 'alight' })
  if (origin && firstStart && !same(origin, firstStart)) {
    paths.unshift({ kind: 'walk', points: [origin, firstStart] })
  }
  if (destination) {
    if (lastEnd && !same(lastEnd, destination)) {
      paths.push({ kind: 'walk', points: [lastEnd, destination] })
    }
    stops.push({ ...destination, kind: 'destination' })
  }

  return { stops, paths }
}

/**
 * 타는 정류장 주변만 보여주고 싶을 때 지도가 맞출 좌표 (출발 위치 + 타는 정류장들).
 * 경로 전체(예: 동백 → 강남 30km)에 맞추면 지도가 너무 멀어져서, "어느 정류장에서 탈지"를
 * 고르는 화면에서는 정류장끼리 겹쳐 보임. 경로선은 화면 밖으로 이어지게 그대로 둠.
 */
export function boardingFocus(
  geometry: RouteGeometry | null | undefined,
  extra: (MapPoint | null | undefined)[] = [],
): MapPoint[] {
  const stops = (geometry?.stops ?? []).filter((s) => s.kind === 'board' || s.kind === 'moveTo')
  return [...extra, ...stops].filter((p): p is MapPoint => !!p)
}

/** 지도에 담아야 할 모든 좌표 */
export function geometryPoints(geometry: RouteGeometry | null | undefined): MapPoint[] {
  if (!geometry) return []
  return [...geometry.stops, ...geometry.paths.flatMap((p) => p.points)]
}

// ── 이동 중 화면용 저장 ──────────────────────────────────────────────
// 이동 중 응답(GET /trips/active)에는 정류장 좌표가 없어서,
// 출발할 때 전략 비교 화면의 경로 모양을 기기에 저장해 두고 이동 중 화면에서 꺼내 씀.
// 정류장 좌표만 저장하고 사용자 위치(출발 위치)는 저장하지 않음 (NFR-09)
// TODO: BE가 이동 중 응답에 구간 좌표를 내려주면 그 값으로 바꾸기

const TRIP_MAP_KEY = 'yy4:trip-map'

/** 탈것 구간의 노선 목록. 이동 중 경로가 바뀌었는지(재평가 수락 등) 비교할 때 씀 */
export function transitLines(
  segments: { mode: string; routeLabel?: string | null; boardName?: string | null }[],
): string[] {
  return segments.filter((s) => s.mode !== 'WALK').map((s) => s.routeLabel ?? s.boardName ?? '')
}

type SavedTripMap = {
  tripId: number
  /** 저장할 때의 탈것 노선 (경로가 바뀌었는지 확인용) */
  lines: string[]
  geometry: RouteGeometry
}

export function saveTripGeometry(tripId: number, lines: string[], geometry: RouteGeometry) {
  try {
    const value: SavedTripMap = { tripId, lines, geometry }
    localStorage.setItem(TRIP_MAP_KEY, JSON.stringify(value))
  } catch {
    // 저장 실패면 이동 중 화면 지도에 경로만 안 보임
  }
}

/** 같은 이동이고 탈것 노선이 그대로일 때만 돌려줌 (경로가 바뀌었으면 null) */
export function readTripGeometry(tripId: number, lines: string[]): RouteGeometry | null {
  try {
    const raw = localStorage.getItem(TRIP_MAP_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as SavedTripMap
    if (saved.tripId !== tripId) return null
    if (saved.lines.join('|') !== lines.join('|')) return null
    return saved.geometry
  } catch {
    return null
  }
}
