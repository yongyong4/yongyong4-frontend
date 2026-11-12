// BE 코드값 → 화면에 보여줄 한글 값
// 컴포넌트(LevelPill 등)는 한글 타입을 받으므로 API 응답을 넘기기 전에 여기서 바꿈

import type { RiskStageCode, StageCode, StrategyType } from '@/types/api'
import type { Stage, StageWithUnknown } from '@/types/stage'
import type { ReevaluateTrigger, TripEndType, TripStatus } from '@/types/trip'
import type { EndType, TriggerType, TripStatusCode } from '@/types/tripApi'

const STAGE_LABEL: Record<StageCode, StageWithUnknown> = {
  OK: '가능',
  CAUTION: '주의',
  RISK: '위험',
  UNKNOWN: '정보 없음',
}

/** 구간 단계 (정보 없음 포함). LevelPill에 바로 넘길 수 있음 */
export function toStageLabel(code: StageCode): StageWithUnknown {
  return STAGE_LABEL[code]
}

const RISK_STAGE_LABEL: Record<RiskStageCode, Stage> = {
  OK: '가능',
  CAUTION: '주의',
  RISK: '위험',
}

/** 전략 위험 단계 (3단계) */
export function toRiskStageLabel(code: RiskStageCode): Stage {
  return RISK_STAGE_LABEL[code]
}

const TRIP_STATUS_LABEL: Record<TripStatusCode, TripStatus> = {
  BEFORE_DEPART: '출발 전',
  MOVING: '이동 중',
  WAITING: '대기 중',
  BOARDED: '탑승',
  BOARD_FAILED: '탑승 실패',
  ENDED: '종료',
}

export function toTripStatusLabel(code: TripStatusCode): TripStatus {
  return TRIP_STATUS_LABEL[code]
}

const TRIGGER_LABEL: Record<TriggerType, ReevaluateTrigger> = {
  INITIAL: '시작',
  AUTO: '자동',
  REFRESH: '새로고침',
  STATUS_CHANGE: '상태 변경',
  RESUME: '화면 복귀',
}

export function toTriggerLabel(code: TriggerType): ReevaluateTrigger {
  return TRIGGER_LABEL[code]
}

const STRATEGY_LABEL: Record<StrategyType, string> = {
  KEEP: '그대로 타기',
  BACKTRACK: '앞 정류장에서 타기',
  DETOUR: '다른 정류장에서 타기',
  ALT_ROUTE: '다른 노선으로 바꾸기',
  OTHER_MODE: '다른 교통수단',
}

/** 전략 종류 → 짧은 설명 (S-06 경로 변경 기록 등) */
export function toStrategyLabel(code: StrategyType): string {
  return STRATEGY_LABEL[code]
}

const END_TYPE_LABEL: Record<EndType, TripEndType> = {
  USER: '이용자',
  AUTO: '자동',
}

export function toEndTypeLabel(code: EndType): TripEndType {
  return END_TYPE_LABEL[code]
}
