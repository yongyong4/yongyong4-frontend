// 후보 경로 API (S-02)
// GET  /api/v1/routes/search    — 대중교통 경로 탐색 (ODsay, 하루 30회 한도!) (F-01-04, F-02-01)
// POST /api/v1/routes/analysis  — 후보 경로 위험 분석 (F-02-01)
//
// 경로 탐색은 한도가 있어서 화면에서 같은 조건이면 캐시를 쓰고 다시 부르지 않게 할 것

import { request } from '@/apis/client'
import type { IsoDateTime, SeatType, StageCode } from '@/types/api'

// ── 경로 탐색 ───────────────────────────────────────────────────────

export type BusOption = {
  busNo: string
  localRouteId: string
  /** 광역 / 일반 / 마을. 명세서에는 없지만 실제 응답에 있음 */
  busType?: string
}

/** 구간이 지나는 정류장·역 (이름 + 좌표). 첫 항목은 구간 시작점, 마지막 항목은 구간 끝점과 같음 */
export type PassStop = {
  name: string
  /** 경도 */
  x: number
  /** 위도 */
  y: number
}

export type SegmentInfo = {
  segmentIndex: number
  mode: 'WALK' | 'BUS' | 'SUBWAY' | string
  durationMin: number
  distanceM: number | null
  startName: string | null
  endName: string | null
  startLocalStationId: string | null
  endLocalStationId: string | null
  startX: number | null
  startY: number | null
  endX: number | null
  endY: number | null
  /** 지하철 호선 이름 (예: "에버라인", "수인분당") */
  lineName: string | null
  busOptions: BusOption[]
  /** 지나는 정류장 좌표 전체. 지도에서 정류장 사이를 직선이 아니라 실제 정류장을 따라 그릴 때 씀 */
  passStops?: PassStop[] | null
}

export type RouteInfo = {
  routeIndex: number
  totalTimeMin: number
  totalDistanceM: number
  busTransfers: number
  subwayTransfers: number
  segments: SegmentInfo[]
}

export type RouteSearchResponse = {
  provider: string
  count: number
  routes: RouteInfo[]
}

export type RouteSearchParams = { startX: number; startY: number; endX: number; endY: number }

export function searchRoutes(
  params: RouteSearchParams,
  signal?: AbortSignal,
): Promise<RouteSearchResponse> {
  const search = new URLSearchParams({
    startX: String(params.startX),
    startY: String(params.startY),
    endX: String(params.endX),
    endY: String(params.endY),
  })
  return request<RouteSearchResponse>(`/v1/routes/search?${search}`, { signal })
}

// ── 위험 분석 ───────────────────────────────────────────────────────

/** 구간 한 칸의 실시간 분석. 버스 구간만 옴. 실시간 정보가 없으면 단계·시각 값이 null로 옴 */
export type SegmentView = {
  segmentIndex: number
  routeLabel: string | null
  boardName: string | null
  predictedBusArrivalAt: IsoDateTime | null
  slackMin: number | null
  slackStage: StageCode | null
  remainSeats: number | null
  seatType: SeatType | null
  seatStage: StageCode | null
  boardingStage: StageCode | null
  /** 탔을 때 */
  arriveIfBoard: IsoDateTime | null
  totalMinIfBoard: number | null
  /** 못 탔을 때 */
  arriveIfMiss: IsoDateTime | null
  totalMinIfMiss: number | null
  nextRouteLabel: string | null
  nextBusArrivalAt: IsoDateTime | null
  nextBusRemainSeats: number | null
  nextBusSeatType: SeatType | null
  dataBasisAt: IsoDateTime | null
}

export type RouteAnalysis = {
  routeIndex: number
  /** 명세서 기준 필드. 지하철만 있는 경로도 실제 응답은 true로 와서, 분석 여부는 segments가 비었는지로 봄 */
  analyzable: boolean
  /** 분석된 구간이 없으면(지하철만 있는 경로 등) null */
  strategyRiskStage: StageCode | null
  totalTimeMin: number
  segments: SegmentView[]
}

export type AnalysisResponse = {
  evaluatedAt: IsoDateTime
  dataBasisAt: IsoDateTime
  /** true면 수집 데이터가 늦어서 이전 기준으로 계산한 것 */
  dataDelayed: boolean
  routes: RouteAnalysis[]
}

/** 분석·전략 요청에 보내는 경로 모양 (경로 탐색 응답에서 필요한 값만 추림) */
export type RouteInput = {
  routeIndex: number
  totalTimeMin: number
  segments: {
    segmentIndex: number
    mode: string
    durationMin: number
    startName: string | null
    endName: string | null
    startLocalStationId: string | null
    endLocalStationId: string | null
    busOptions: { busNo: string; localRouteId: string }[]
  }[]
}

export function toRouteInput(route: RouteInfo): RouteInput {
  return {
    routeIndex: route.routeIndex,
    totalTimeMin: route.totalTimeMin,
    segments: route.segments.map((s) => ({
      segmentIndex: s.segmentIndex,
      mode: s.mode,
      durationMin: s.durationMin,
      startName: s.startName,
      endName: s.endName,
      startLocalStationId: s.startLocalStationId,
      endLocalStationId: s.endLocalStationId,
      busOptions: s.busOptions.map(({ busNo, localRouteId }) => ({ busNo, localRouteId })),
    })),
  }
}

// ── 도보 경로 ───────────────────────────────────────────────────────

export type WalkingStep = {
  stepIndex: number
  /** 안내 문구 */
  guidance: string
  distanceMeters: number
  durationSeconds: number
  /** [경도, 위도] 좌표 목록 */
  pathPoints: [number, number][]
}

export type WalkingRouteResponse = {
  provider: string
  routeMode: string
  totalDistanceMeters: number
  totalTimeSeconds: number
  steps: WalkingStep[]
  /** 전체 경로 좌표 [경도, 위도] 목록. 지도에 점선으로 그릴 때 사용 */
  pathPoints: [number, number][]
}

export type WalkingRouteParams = {
  startX: number
  startY: number
  endX: number
  endY: number
  /** 기본 SHORTEST */
  routeMode?: string
}

/**
 * GET /api/v1/routes/walking — 도보 경로 탐색 (카카오)
 * TODO: 지도가 고정 이미지라서 아직 화면에서 쓰지 않음. 지도 SDK를 붙이면 pathPoints로 도보 구간을 그리기
 */
export function searchWalkingRoute(
  params: WalkingRouteParams,
  signal?: AbortSignal,
): Promise<WalkingRouteResponse> {
  const search = new URLSearchParams({
    startX: String(params.startX),
    startY: String(params.startY),
    endX: String(params.endX),
    endY: String(params.endY),
  })
  if (params.routeMode) search.set('routeMode', params.routeMode)
  return request<WalkingRouteResponse>(`/v1/routes/walking?${search}`, { signal })
}

export function analyzeRoutes(
  routes: RouteInfo[],
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  const body = { routes: routes.map(toRouteInput) }
  return request<AnalysisResponse>('/v1/routes/analysis', { method: 'POST', body, signal })
}
