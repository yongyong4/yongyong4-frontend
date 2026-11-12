// trips API 목 데이터. BE가 [BE 추가 예정] 필드를 넣기 전까지 화면 개발용
// 시각은 "지금 기준 ○분 뒤"로 만들어서 카운트다운이 자연스럽게 보이게 함
//
// 동작 규칙 (실제 BE와 비슷하게)
// - 상태 변경을 하면 내부 상태가 바뀌고, 그다음 재평가 응답에 반영됨
// - 상태가 BOARD_FAILED면 재평가에서 failureOptions가 옴 (P-02)
// - triggerType이 REFRESH면 경로 변경 제안이 옴 (P-01 확인용)
// - 그 외에는 경로 유지 (KEEP)

import type { IsoDateTime } from '@/types/api'
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
  TripSegment,
  TripStatusCode,
  TripSummary,
} from '@/types/tripApi'

const MOCK_DELAY_MS = 300

function minutesFromNow(min: number): IsoDateTime {
  return new Date(Date.now() + min * 60 * 1000).toISOString()
}

export function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

const SEGMENTS: TripSegment[] = [
  {
    segmentId: 301,
    seq: 1,
    mode: 'WALK',
    routeLabel: null,
    boardName: '동백역',
    alightName: '동백2차',
    walkMin: 4,
  },
  {
    segmentId: 302,
    seq: 2,
    mode: 'BUS',
    gbisRouteId: '228000431',
    routeLabel: '5003',
    boardStationId: '228000172',
    alightStationId: '121000009',
    boardName: '동백2차',
    alightName: '강남역',
    matchStatus: 'MATCHED',
    plannedStartAt: minutesFromNow(6),
    plannedEndAt: minutesFromNow(50),
  },
  {
    segmentId: 303,
    seq: 3,
    mode: 'WALK',
    routeLabel: null,
    boardName: '강남역',
    alightName: '강남역 11번 출구',
    walkMin: 6,
  },
]

// 화면 확인용: /trip?mockStatus=WAITING 처럼 주소에 넣으면 그 상태로 시작
const INITIAL_STATUSES: TripStatusCode[] = ['MOVING', 'WAITING', 'BOARDED', 'BOARD_FAILED']
const requestedStatus = new URLSearchParams(window.location.search).get('mockStatus')
const initialStatus = INITIAL_STATUSES.find((s) => s === requestedStatus) ?? 'MOVING'
// 화면 확인용: 주소에 mockSuggest가 있으면 재평가마다 경로 변경 제안(P-01)을 줌
const forceSuggest = new URLSearchParams(window.location.search).has('mockSuggest')

// 목 서버의 현재 상태 (새로고침하면 처음으로 돌아감)
const state = {
  tripId: 101,
  status: initialStatus,
  evaluationId: 500,
  startedAt: minutesFromNow(-5),
  active: true,
}

export function mockCreateTrip(body: CreateTripRequest): CreateTripResponse {
  state.status = 'MOVING'
  state.active = true
  state.startedAt = minutesFromNow(0)
  return {
    tripId: state.tripId,
    currentRouteId: 201,
    currentStatus: state.status,
    destName: body.destName,
    strategyType: body.strategyType,
    startedAt: state.startedAt,
    expectedArrivalAt: body.expectedArrivalAt ?? minutesFromNow(70),
  }
}

export function mockGetActiveTrip(): ActiveTripResponse {
  if (!state.active) return { active: false, trip: null, pendingAutoSummaryTripId: null }
  return {
    active: true,
    trip: {
      tripId: state.tripId,
      currentStatus: state.status,
      destName: '강남역',
      startedAt: state.startedAt,
      expectedArrivalAt: minutesFromNow(65),
      lastSuggestedAt: null,
      currentRoute: {
        tripRouteId: 201,
        source: 'INITIAL',
        strategyType: 'KEEP',
        segments: SEGMENTS,
      },
    },
    pendingAutoSummaryTripId: null,
  }
}

export function mockChangeStatus(body: ChangeStatusRequest): ChangeStatusResponse {
  const previousStatus = state.status
  state.status = body.status
  return {
    tripId: state.tripId,
    previousStatus,
    currentStatus: state.status,
    segmentId: body.segmentId ?? null,
    changedAt: minutesFromNow(0),
    reevaluationRequired: true,
    nextAction: 'REEVALUATE',
  }
}

export function mockReevaluate(body: ReevaluateRequest): ReevaluateResponse {
  state.evaluationId += 1

  const base: ReevaluateResponse = {
    tripId: state.tripId,
    evaluationId: state.evaluationId,
    triggerType: body.triggerType,
    evaluatedAt: minutesFromNow(0),
    dataBasisAt: minutesFromNow(-1),
    dataDelayed: false,
    currentRoute: {
      tripRouteId: 201,
      currentStatus: state.status,
      expectedArrivalAt: minutesFromNow(65),
      comparisonValueMin: 65,
      strategyRiskStage: 'CAUTION',
      nextSegment: {
        segmentId: 302,
        mode: 'BUS',
        routeLabel: '5003',
        boardName: '동백2차',
        predictedBusArrivalAt: minutesFromNow(6),
        remainSeats: 3,
        seatType: 'PREDICTED',
        slackMin: 3,
        slackStage: 'CAUTION',
        seatStage: 'CAUTION',
        boardingStage: 'CAUTION',
        dataBasisAt: minutesFromNow(-1),
        nextBusArrivalAt: minutesFromNow(24),
        nextRemainSeats: 25,
        nextSeatType: 'PREDICTED',
      },
    },
    result: 'KEEP',
    suggestion: null,
    failureOptions: null,
  }

  if (state.status === 'BOARD_FAILED') {
    // 명세서 "탑승 실패 후 재평가": 대안은 suggestion, 다음 버스 대기는 failureOptions.waitNextBus
    return {
      ...base,
      currentRoute: {
        ...base.currentRoute,
        expectedArrivalAt: minutesFromNow(83),
        comparisonValueMin: 83,
        nextSegment: {
          ...base.currentRoute.nextSegment!,
          predictedBusArrivalAt: minutesFromNow(18),
          remainSeats: 25,
          slackMin: 18,
          slackStage: 'OK',
          seatStage: 'OK',
          boardingStage: 'OK',
        },
      },
      result: 'SUGGEST',
      suggestion: {
        strategyType: 'ALT_ROUTE',
        comparisonValueMin: 75,
        improvementMin: 8,
        expectedArrivalAt: minutesFromNow(75),
        strategyRiskStage: 'CAUTION',
        reason: '다른 노선으로 이동할 수 있어요',
        canAccept: true,
        title: '5005번으로 바꾸기',
        routeLabel: '5005',
        moveToName: null,
        extraWalkMin: 0,
        busArrivalAt: minutesFromNow(7),
        remainSeats: 3,
        seatType: 'PREDICTED',
      },
      failureOptions: {
        waitNextBus: {
          routeLabel: '5003',
          predictedArrivalAt: minutesFromNow(18),
          expectedArrivalAt: minutesFromNow(83),
          boardingStage: 'OK',
          comparisonValueMin: 83,
          remainSeats: 25,
          seatType: 'PREDICTED',
        },
        alternativeAvailable: true,
      },
    }
  }

  if (body.triggerType === 'REFRESH' || forceSuggest) {
    return {
      ...base,
      result: 'SUGGEST',
      suggestion: {
        strategyType: 'ALT_ROUTE',
        comparisonValueMin: 57,
        improvementMin: 8,
        expectedArrivalAt: minutesFromNow(57),
        strategyRiskStage: 'OK',
        reason: '5005번으로 바꾸면 8분 빨리 도착해요',
        canAccept: true,
        title: '5005번으로 바꾸기',
        routeLabel: '5005',
        moveToName: '동백 주네브',
        moveToX: 127.1501,
        moveToY: 37.2712,
        extraWalkMin: 6,
        busArrivalAt: minutesFromNow(9),
        remainSeats: 21,
        seatType: 'PREDICTED',
      },
    }
  }

  return base
}

export function mockDecide(evaluationId: number, accepted: boolean): DecisionResponse {
  // 탑승 실패 후: 다음 버스 기다리기 → WAITING, 대안 경로 → MOVING
  if (state.status === 'BOARD_FAILED') state.status = accepted ? 'MOVING' : 'WAITING'
  return {
    tripId: state.tripId,
    evaluationId,
    accepted,
    previousRouteId: 201,
    currentRouteId: accepted ? 202 : 201,
    currentStatus: state.status,
    strategyType: accepted ? 'ALT_ROUTE' : 'KEEP',
    expectedArrivalAt: minutesFromNow(accepted ? 57 : 65),
    respondedAt: minutesFromNow(0),
  }
}

export function mockEndTrip(): EndTripResponse {
  state.active = false
  state.status = 'ENDED'
  return {
    tripId: state.tripId,
    currentStatus: 'ENDED',
    endType: 'USER',
    startedAt: state.startedAt,
    endedAt: minutesFromNow(0),
    durationMin: 72,
  }
}

export function mockGetSummary(tripId: number): TripSummary {
  return {
    tripId,
    destName: '강남역',
    currentStatus: 'ENDED',
    endType: 'USER',
    startedAt: minutesFromNow(-62),
    endedAt: minutesFromNow(0),
    nearDestAt: null,
    durationMin: 62,
    summaryShown: false,
    // 피그마 S-06: 5003번 못 타고 5005번으로 갈아탐
    boardingResults: [
      {
        segmentId: 302,
        routeLabel: '5003',
        boardName: '동백2차',
        events: [{ status: 'BOARD_FAILED', changedAt: minutesFromNow(-52) }],
      },
      {
        segmentId: 304,
        routeLabel: '5005',
        boardName: '동백 호수공원',
        events: [{ status: 'BOARDED', changedAt: minutesFromNow(-40) }],
      },
    ],
    routeChangeHistory: [
      {
        evaluationId: 502,
        suggestedAt: minutesFromNow(-56),
        strategyType: 'ALT_ROUTE',
        accepted: false,
        respondedAt: minutesFromNow(-55),
        appliedRouteId: null,
      },
    ],
    // "처음 예상 시간(58분)보다 4분 늦었지만, 탑승 실패 시 예상 시간(70분)보다 8분 빨랐어요"
    initialExpectedMin: 58,
    failedExpectedMin: 70,
  }
}

export function mockSummarySeen(tripId: number): SummarySeenResponse {
  return { tripId, summaryShown: true }
}
