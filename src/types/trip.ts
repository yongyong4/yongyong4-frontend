// 기능명세서 6장 F-05-01 이동 상태

export type TripStatus = '출발 전' | '이동 중' | '대기 중' | '탑승' | '탑승 실패'

/** F-05-02 재평가 트리거 (F-SV-03 기록 항목과 같음) */
export type ReevaluateTrigger = '자동' | '새로고침' | '상태 변경' | '화면 복귀'

/** F-05-09, F-SV-02 종료 방식 */
export type TripEndType = '이용자' | '자동'
