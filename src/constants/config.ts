// FE에서 쓰는 기준값. [가정]·[신규 가정] 값은 팀 확정 후 바뀔 수 있음

/** F-05-02 화면이 열려 있는 동안 자동 재평가 주기 [가정] */
export const REEVALUATE_INTERVAL_MS = 2 * 60 * 1000

/** F-05-03 화면 복귀 재계산 토스트 표시 시간 [신규 가정] */
export const RECALCULATED_TOAST_MS = 3 * 1000

/** F-01-03 최근 검색 최대 개수 [신규 가정] */
export const MAX_RECENT_SEARCHES = 5

/** F-05-06, F-05-09 도착 확인 반경 [신규 가정] */
export const ARRIVAL_RADIUS_M = 50
