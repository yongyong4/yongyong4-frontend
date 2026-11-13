// /api/v1/trips 요청 함수 (S-05 이동 중, S-06 이동 요약, P-01~P-04)
// VITE_USE_MOCK이 true면 mocks/tripMock.ts의 가짜 응답을 씀
// 값을 따로 안 정하면 개발 서버(npm run dev)에서는 목, 배포 빌드에서는 실제 API

import { request } from '@/apis/client'
import * as mock from '@/mocks/tripMock'
import type {
  ActiveTripResponse,
  ChangeStatusRequest,
  ChangeStatusResponse,
  CreateTripRequest,
  CreateTripResponse,
  DecisionResponse,
  EndTripResponse,
  ReevaluateRequest,
  ReevaluateResponse,
  SummarySeenResponse,
  TripSummary,
  WaitNextBusResponse,
} from '@/types/tripApi'

const useMockEnv = import.meta.env.VITE_USE_MOCK
export const USE_TRIP_MOCK = useMockEnv ? useMockEnv === 'true' : import.meta.env.DEV

/** F-03-07 [출발]을 누르면 이동 세션 생성. 이미 진행 중이면 409 */
export function createTrip(body: CreateTripRequest) {
  if (USE_TRIP_MOCK) return mock.delay(mock.mockCreateTrip(body))
  return request<CreateTripResponse>('/v1/trips', { method: 'POST', body })
}

/** F-01-05 진행 중인 이동 조회 (새로고침·재진입 시 복원) */
export function getActiveTrip() {
  if (USE_TRIP_MOCK) return mock.delay(mock.mockGetActiveTrip())
  return request<ActiveTripResponse>('/v1/trips/active')
}

/** F-05-01 상태 버튼 (도착했어요 / 탔어요 / 못 탔어요 / 하차) */
export function changeTripStatus(tripId: number, body: ChangeStatusRequest) {
  if (USE_TRIP_MOCK) return mock.delay(mock.mockChangeStatus(body))
  return request<ChangeStatusResponse>(`/v1/trips/${tripId}/status`, { method: 'PATCH', body })
}

/** F-05-02, F-05-05, F-05-07 재평가 (자동, 새로고침, 상태 변경, 화면 복귀, 탑승 실패) */
export function reevaluateTrip(tripId: number, body: ReevaluateRequest) {
  if (USE_TRIP_MOCK) return mock.delay(mock.mockReevaluate(body))
  return request<ReevaluateResponse>(`/v1/trips/${tripId}/reevaluations`, {
    method: 'POST',
    body,
  })
}

/** F-05-04 경로 변경 제안 수락(true) / 무시(false). 탑승 실패 때 false = 다음 버스 기다리기 */
export function decideSuggestion(tripId: number, evaluationId: number, accepted: boolean) {
  if (USE_TRIP_MOCK) return mock.delay(mock.mockDecide(evaluationId, accepted))
  return request<DecisionResponse>(`/v1/trips/${tripId}/evaluations/${evaluationId}/decision`, {
    method: 'PATCH',
    body: { accepted },
  })
}

/** F-05-09 이동 종료 (P-03에서 확정했을 때) */
export function endTrip(tripId: number) {
  if (USE_TRIP_MOCK) return mock.delay(mock.mockEndTrip())
  return request<EndTripResponse>(`/v1/trips/${tripId}/end`, {
    method: 'PATCH',
    body: { confirmed: true },
  })
}

/** F-06-01 이동 요약 조회 */
export function getTripSummary(tripId: number) {
  if (USE_TRIP_MOCK) return mock.delay(mock.mockGetSummary(tripId))
  return request<TripSummary>(`/v1/trips/${tripId}/summary`)
}

/** F-06-01 요약 확인 완료. 조회만으로는 부르지 말고, 이용자가 실제로 확인을 끝냈을 때 호출 */
export function markSummarySeen(tripId: number) {
  if (USE_TRIP_MOCK) return mock.delay(mock.mockSummarySeen(tripId))
  return request<SummarySeenResponse>(`/v1/trips/${tripId}/summary/seen`, {
    method: 'PATCH',
    body: { seen: true },
  })
}

/**
 * F-05-05 탑승 실패 후 "다음 버스 기다리기" (P-02)
 * 명세서에는 decision(accepted: false)로 되어 있지만 실제 BE는 이 API를 씀 (decision은 409)
 */
export function waitForNextBus(tripId: number) {
  if (USE_TRIP_MOCK) return mock.delay(mock.mockWaitNextBus())
  return request<WaitNextBusResponse>(`/v1/trips/${tripId}/boarding-failure/wait`, {
    method: 'POST',
  })
}
