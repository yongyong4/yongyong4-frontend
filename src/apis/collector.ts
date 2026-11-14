// 내부·개발용 API (스웨거의 "내부·개발용" 태그). 화면에서는 쓰지 않고, 서버 상태나 버스 수집 데이터가
// 제대로 들어오는지 개발 중에 확인하는 용도
// GET /api/v1/health              서버 상태 확인
// GET /api/v1/collector/snapshot  수집 데이터 스냅샷 조회

import { request } from '@/apis/client'

/** 스웨거에는 응답 스키마가 없고(임의 객체), 실제 응답은 아래 모양 */
export type HealthResponse = {
  timestamp: string
  service: string
  /** 정상이면 "UP" */
  status: string
}

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>('/v1/health', { signal })
}

/** 수집된 버스 한 대 */
export type SnapshotVehicle = {
  plateNo: string
  /** 노선 안에서 지금 몇 번째 정류장인지 */
  stationSeq: number
  stationName: string
  remainSeatCnt: number | null
  collectedAt: string
  /** 최근에 수집된 값인지 */
  fresh: boolean
}

/** 정류장에 들어오는 버스 도착 예측 */
export type SnapshotArrival = {
  stationName: string
  arrivalOrder: number
  plateNo: string
  predictTimeMin: number | null
  remainSeatCnt: number | null
  collectedAt: string
  fresh: boolean
}

export type SegmentSnapshot = {
  source: string
  routeId: string
  routeName: string
  stationId: string
  locationsFresh: boolean
  arrivalsFresh: boolean
  /** true여야 이 구간의 실시간 분석이 가능함 */
  readyForLiveAnalysis: boolean
  vehicles: SnapshotVehicle[]
  arrivals: SnapshotArrival[]
}

/** routeId = 노선 ID(localRouteId), stationId = 정류장 ID(startLocalStationId 등) */
export function getSegmentSnapshot(
  params: { routeId: string; stationId: string },
  signal?: AbortSignal,
): Promise<SegmentSnapshot> {
  const search = new URLSearchParams({ routeId: params.routeId, stationId: params.stationId })
  return request<SegmentSnapshot>(`/v1/collector/snapshot?${search}`, { signal })
}
