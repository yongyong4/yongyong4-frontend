// BE가 응답에 쓰는 코드값 (API 명세서 기준)
// 화면에 보여줄 때는 utils/codeLabels.ts로 한글로 바꿔서 씀

/** 단계 코드. 여유시간·좌석·탑승·전략 위험 단계 공통 */
export type StageCode = 'OK' | 'CAUTION' | 'RISK' | 'UNKNOWN'

/** 전략 위험 단계는 UNKNOWN 없이 3단계 (정보 없음은 BE가 CAUTION으로 줌) */
export type RiskStageCode = Exclude<StageCode, 'UNKNOWN'>

/** 좌석 수 출처. PREDICTED 예측 / OBSERVED 실측 / NONE 정보 없음 */
export type SeatType = 'PREDICTED' | 'OBSERVED' | 'NONE'

export type SegmentMode = 'WALK' | 'BUS' | 'SUBWAY'

/** GBIS 노선 매칭 결과. 버스가 아닌 구간은 NA */
export type MatchStatus = 'MATCHED' | 'FAILED' | 'NA'

/** KEEP 그대로 / BACKTRACK 거슬러타기 / DETOUR 우회 / ALT_ROUTE 대체 노선 / OTHER_MODE 다른 수단 */
export type StrategyType = 'KEEP' | 'BACKTRACK' | 'DETOUR' | 'ALT_ROUTE' | 'OTHER_MODE'

/** ISO 8601 시각 문자열 (예: 2026-11-05T07:21:00+09:00) */
export type IsoDateTime = string

/** 좌표. x = 경도, y = 위도 (WGS84) */
export type Position = {
  x: number
  y: number
}

/** BE 에러 응답. message가 없는 경우도 있어서 status로 문구를 정할 것 */
export type ApiErrorBody = {
  timestamp?: IsoDateTime
  status: number
  error?: string
  message?: string
  path?: string
}
