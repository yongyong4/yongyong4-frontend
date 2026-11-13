// 전략 비교 API (S-03)
// POST /api/v1/strategies — 선택한 경로와 대안 전략 비교·추천 (F-03-01~05, F-03-08)

import { request } from '@/apis/client'
import { type RouteAnalysis, type RouteInput, type SegmentView } from '@/apis/routes'
import type { IsoDateTime, SeatType, StageCode, StrategyType } from '@/types/api'

/** 출발할 때 POST /trips로 그대로 보내는 구간 (TripSegmentInput과 같은 모양, segmentIndex만 더 있음) */
export type StrategyRouteSegment = {
  segmentIndex: number
  seq: number
  mode: string
  gbisRouteId: string | null
  routeLabel: string | null
  boardStationId: string | null
  alightStationId: string | null
  boardName: string | null
  alightName: string | null
  matchStatus: string
  plannedStartAt: IsoDateTime | null
  plannedEndAt: IsoDateTime | null
  walkMin: number | null
  userAlightAt: IsoDateTime | null
}

export type StrategyView = {
  /** 이 전략이 추천인지 */
  recommended: boolean
  /** 지금 고른 경로 그대로인지 */
  isCurrent: boolean
  strategyType: StrategyType
  title: string
  /** 옮겨 타야 하는 정류장 (그대로 타기면 null) */
  moveToName: string | null
  moveToX: number | null
  moveToY: number | null
  extraWalkMin: number | null
  strategyRiskStage: StageCode | null
  totalMinIfBoard: number | null
  totalMinIfMiss: number | null
  /** 전략끼리 비교할 때 쓴 값(분) */
  comparisonValueMin: number | null
  expectedArrivalAt: IsoDateTime | null
  remainSeats: number | null
  seatType: SeatType | null
  busArrivalAt: IsoDateTime | null
  nextBusArrivalAt: IsoDateTime | null
  /** 명세서에는 타입이 없고(실제 응답은 null), 화면에서는 아직 쓰지 않음 */
  missIntervalMin: unknown
  /** 추천 이유 문장 (1~2개) */
  reasons: string[]
  route: { segments: StrategyRouteSegment[] }
  analysis: SegmentView[]
}

export type StrategyResponse = {
  dataBasisAt: IsoDateTime
  dataDelayed: boolean
  currentRoute: RouteAnalysis
  strategies: StrategyView[]
}

export type StrategyRequest = {
  selectedRoute: RouteInput
  alternativeRoutes: RouteInput[]
  /** 하차 시각을 직접 고친 구간이 있을 때만 (이동 중 화면에서 사용) */
  alightUpdates: { segmentIndex: number; userAlightAt: IsoDateTime }[]
  currentLocation: { x: number; y: number }
}

export function fetchStrategies(
  body: StrategyRequest,
  signal?: AbortSignal,
): Promise<StrategyResponse> {
  return request<StrategyResponse>('/v1/strategies', { method: 'POST', body, signal })
}
