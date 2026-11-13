// /api/v1/trips 관련 요청·응답 타입 (API 명세서 기준)
// [BE 추가 예정]: 백엔드가 응답에 넣기로 했지만 아직 명세서에 없는 필드. 이름이 바뀔 수 있어서 optional로 둠

import type {
  IsoDateTime,
  MatchStatus,
  Position,
  RiskStageCode,
  SeatType,
  SegmentMode,
  StageCode,
  StrategyType,
} from '@/types/api'

/** 이동 상태. ENDED는 종료 API에서만 바뀜 */
export type TripStatusCode =
  'BEFORE_DEPART' | 'MOVING' | 'WAITING' | 'BOARDED' | 'BOARD_FAILED' | 'ENDED'

/** 상태 변경 API로 보낼 수 있는 값 */
export type ChangeableTripStatus = 'MOVING' | 'WAITING' | 'BOARDED' | 'BOARD_FAILED'

/** INITIAL 시작 직후 / AUTO 2분 자동 / REFRESH 새로고침 / STATUS_CHANGE 상태 변경 / RESUME 화면 복귀 */
export type TriggerType = 'INITIAL' | 'AUTO' | 'REFRESH' | 'STATUS_CHANGE' | 'RESUME'

export type EndType = 'USER' | 'AUTO'

// ─── 구간 ───

/** POST /trips에 보내는 구간 (S-03 strategies[].route.segments를 그대로 보냄) */
export type TripSegmentInput = {
  seq: number
  mode: SegmentMode
  gbisRouteId: string | null
  routeLabel: string | null
  boardStationId: string | null
  alightStationId: string | null
  boardName: string | null
  alightName: string | null
  matchStatus: MatchStatus
  plannedStartAt: IsoDateTime | null
  plannedEndAt: IsoDateTime | null
  walkMin: number | null
  userAlightAt: IsoDateTime | null
}

/** 저장된 구간 (GET /trips/active). 응답 예시가 축약이라 일부 필드는 optional */
export type TripSegment = {
  segmentId: number
  seq: number
  mode: SegmentMode
  routeLabel: string | null
  boardName: string | null
  alightName: string | null
  gbisRouteId?: string | null
  boardStationId?: string | null
  alightStationId?: string | null
  matchStatus?: MatchStatus
  walkMin?: number | null
  userAlightAt?: IsoDateTime | null
  /** BE는 이미 있다고 했지만 응답 예시에는 없음. 확인 필요 */
  plannedStartAt?: IsoDateTime | null
  plannedEndAt?: IsoDateTime | null
}

// ─── POST /trips 이동 시작 ───

export type CreateTripRequest = {
  destName: string
  strategyType: StrategyType
  expectedArrivalAt?: IsoDateTime | null
  selectedRoute: { routeIndex?: number; segments: TripSegmentInput[] }
  alternativeRoutes: unknown[]
}

export type CreateTripResponse = {
  tripId: number
  currentRouteId: number
  currentStatus: TripStatusCode
  destName: string
  strategyType: StrategyType
  startedAt: IsoDateTime
  expectedArrivalAt: IsoDateTime | null
}

// ─── GET /trips/active 진행 중인 이동 ───

export type ActiveTrip = {
  tripId: number
  currentStatus: TripStatusCode
  destName: string
  startedAt: IsoDateTime
  expectedArrivalAt: IsoDateTime | null
  lastSuggestedAt: IsoDateTime | null
  currentRoute: {
    tripRouteId: number
    /** 경로 출처 (예: INITIAL) */
    source: string
    strategyType: StrategyType
    segments: TripSegment[]
  }
}

export type ActiveTripResponse = {
  active: boolean
  trip: ActiveTrip | null
  /** 자동 종료됐는데 요약을 아직 안 본 이동. 있으면 S-06으로 보냄 */
  pendingAutoSummaryTripId: number | null
}

// ─── PATCH /trips/{tripId}/status 상태 변경 ───

export type ChangeStatusRequest = {
  status: ChangeableTripStatus
  /** BOARDED, BOARD_FAILED일 때 필수 */
  segmentId?: number | null
  plateNo?: string | null
}

export type ChangeStatusResponse = {
  tripId: number
  previousStatus: TripStatusCode
  currentStatus: TripStatusCode
  segmentId: number | null
  changedAt: IsoDateTime
  reevaluationRequired: boolean
  nextAction: 'REEVALUATE' | string
}

// ─── POST /trips/{tripId}/reevaluations 재평가 ───

export type ReevaluateRequest = {
  triggerType: TriggerType
  /** 위치 권한이 있을 때만 넣음 */
  currentPosition?: Position | null
  /** 지하철 하차 시각 수정 */
  alightUpdate?: { segmentId: number; userAlightAt: IsoDateTime } | null
}

// 아래 재평가 응답 타입은 명세서가 아니라 실제 BE 응답 기준 (2026-11-13 배포 서버에서 확인)
// 명세서와 다른 점: currentRoute 묶음 없이 펼쳐서 옴, nextSegment는 segmentId 대신 segmentIndex,
// 탑승 실패 선택지는 failureOptions.waitOption / alternativeOption

/** 다음에 탈 버스 구간의 분석 결과 (구간 분석 segments[]와 같은 모양) */
export type NextSegment = {
  /** 경로 안 순번. 구간 ID는 응답의 targetSegmentId를 쓸 것 */
  segmentIndex: number
  routeLabel: string | null
  boardName: string | null
  predictedBusArrivalAt: IsoDateTime | null
  slackMin: number | null
  slackStage: StageCode
  remainSeats: number | null
  seatType: SeatType
  seatStage: StageCode
  boardingStage: StageCode
  arriveIfBoard: IsoDateTime | null
  totalMinIfBoard: number | null
  arriveIfMiss: IsoDateTime | null
  totalMinIfMiss: number | null
  nextRouteLabel: string | null
  /** 그다음 버스 도착 시각 ("다음 도착 18분 후") */
  nextBusArrivalAt: IsoDateTime | null
  nextBusRemainSeats: number | null
  nextBusSeatType: SeatType | null
  dataBasisAt: IsoDateTime | null
}

/**
 * 경로 변경 제안 (P-01) / 탑승 실패 후 대안 (P-02)
 * TODO: 실제 응답에서 아직 못 봄 (확인한 시간대에 버스 정보가 없어서 제안이 안 나옴).
 * 명세서 + /strategies의 strategies[] 이름으로 가정. 실제 응답을 보면 맞출 것
 */
export type Suggestion = {
  strategyType?: StrategyType
  comparisonValueMin?: number | null
  /** 지금 경로보다 몇 분 빨라지는지 */
  improvementMin?: number | null
  expectedArrivalAt?: IsoDateTime | null
  strategyRiskStage?: RiskStageCode
  reason?: string
  canAccept?: boolean
  title?: string
  routeLabel?: string | null
  moveToName?: string | null
  moveToX?: number | null
  moveToY?: number | null
  extraWalkMin?: number | null
  busArrivalAt?: IsoDateTime | null
  remainSeats?: number | null
  seatType?: SeatType
  totalMin?: number | null
  route?: { segments: TripSegmentInput[] }
}

/** 탑승 실패 후 "다음 버스 기다리기" 선택지. 고르면 POST /boarding-failure/wait */
export type WaitOption = {
  action: 'WAIT_FOR_NEXT_BUS' | string
  endpoint: string
  /** 다음 버스 도착 예정 시각. 도착 정보가 없으면 null */
  nextBusArrivalAt: IsoDateTime | null
  busArrivalAt: IsoDateTime | null
  /** 다음 버스를 탔을 때 목적지 예상 도착 시각 */
  expectedArrivalAt: IsoDateTime | null
  totalMin: number | null
  totalMinIfBoard: number | null
  boardingStage: StageCode
  strategyRiskStage: RiskStageCode
  remainSeats: number | null
  seatType: SeatType
  routeLabel: string | null
  title: string
}

/** 탑승 실패 후 선택지 (P-02). 대안을 고르면 decision(accepted: true) */
export type FailureOptions = {
  waitOption: WaitOption
  alternativeOption: Suggestion | null
}

export type ReevaluateResponse = {
  tripId: number
  evaluationId: number
  triggerType: TriggerType
  currentStatus: TripStatusCode
  evaluatedAt: IsoDateTime
  dataBasisAt: IsoDateTime | null
  /** true면 "○○:○○ 정보로 보여드려요" 표시 */
  dataDelayed: boolean
  /** KEEP 경로 유지 / SUGGEST 변경 제안 */
  result: 'KEEP' | 'SUGGEST' | string
  /** 재평가한 버스 구간 ID (상태 변경 API에 보낼 segmentId) */
  targetSegmentId: number | null
  /** 지금 경로 비교값(분) */
  currentValueMin: number | null
  /** 제안 경로 비교값(분) */
  suggestedValueMin: number | null
  /** 바꾸면 몇 분 빨라지는지 */
  savedMinutes: number | null
  /** 다음 버스 구간. 탄 버스가 마지막이면 null */
  nextSegment: NextSegment | null
  suggestion: Suggestion | null
  /** 탑승 실패 재평가에서만 옴 (failureOptions.waitOption과 같은 값) */
  waitOption: WaitOption | null
  failureOptions: FailureOptions | null
  /** BE가 만든 근거 문장 (확률·퍼센트 없음) */
  reason: string | null
}

/** 다음 버스 좌석 */
export function getNextSegmentSeats(segment: NextSegment): {
  remainSeats: number | null
  seatType: SeatType
} {
  return { remainSeats: segment.remainSeats, seatType: segment.seatType ?? 'NONE' }
}

// ─── POST /trips/{tripId}/boarding-failure/wait 탑승 실패 후 다음 버스 기다리기 ───
// 명세서에는 decision(accepted: false)로 되어 있지만 실제로는 이 API를 씀 (decision은 409)

export type WaitNextBusResponse = {
  tripId: number
  currentStatus: TripStatusCode
  segmentId: number
  reevaluationRequired: boolean
}

// ─── PATCH /trips/{tripId}/evaluations/{evaluationId}/decision 제안 수락·무시 ───

export type DecisionRequest = {
  /** 탑승 실패 상황에서 false = 다음 버스 기다리기 */
  accepted: boolean
}

export type DecisionResponse = {
  tripId: number
  evaluationId: number
  accepted: boolean
  previousRouteId: number
  currentRouteId: number
  currentStatus: TripStatusCode
  strategyType: StrategyType
  expectedArrivalAt: IsoDateTime | null
  respondedAt: IsoDateTime
}

// ─── PATCH /trips/{tripId}/end 이동 종료 ───

export type EndTripResponse = {
  tripId: number
  currentStatus: 'ENDED'
  endType: EndType
  endedAt: IsoDateTime
  // 명세서에는 있지만 실제 응답에는 없음 (요약은 summary API로 따로 받음)
  startedAt?: IsoDateTime
  durationMin?: number | null
}

// ─── GET /trips/{tripId}/summary 이동 요약 ───

export type BoardingResult = {
  segmentId: number
  routeLabel: string | null
  /** [BE 추가 필요] 탄 정류장 이름 (S-06 "동백2차 정류장"). 명세서에 없음 */
  boardName?: string | null
  /** 같은 구간에서 실패 후 다음 차를 탔으면 두 기록이 모두 있음 */
  events: { status: 'BOARDED' | 'BOARD_FAILED'; changedAt: IsoDateTime }[]
}

export type RouteChangeHistory = {
  evaluationId: number
  suggestedAt: IsoDateTime
  strategyType: StrategyType
  /** 응답하지 않았으면 null */
  accepted: boolean | null
  respondedAt: IsoDateTime | null
  appliedRouteId: number | null
}

export type TripSummary = {
  tripId: number
  destName: string
  currentStatus: 'ENDED'
  endType: EndType
  startedAt: IsoDateTime
  endedAt: IsoDateTime
  nearDestAt: IsoDateTime | null
  /** 자동 종료이고 도착 시각 기록이 없으면 null */
  durationMin: number | null
  summaryShown: boolean
  boardingResults: BoardingResult[]
  routeChangeHistory: RouteChangeHistory[]
  /** [BE 추가 예정] 처음 고른 경로의 예상 소요 시간(분). 필드 이름 미정 */
  initialExpectedMin?: number | null
  /** [BE 추가 예정] 탑승 실패 당시 예상 소요 시간(분). 필드 이름 미정 */
  failedExpectedMin?: number | null
}

// ─── PATCH /trips/{tripId}/summary/seen 요약 확인 완료 ───

export type SummarySeenResponse = {
  tripId: number
  summaryShown: boolean
}
