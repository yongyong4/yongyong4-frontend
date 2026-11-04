// 기능명세서 2-1 단계 산정. 단계 계산은 BE가 하고 FE는 표시만 함

/** 여유시간 단계·탑승 위험 단계·구간 탑승 단계·전략 위험 단계 공통 값 */
export type Stage = '가능' | '주의' | '위험'

/** 구간 상세의 탑승 위험 단계는 "정보 없음"을 포함 (C-01) */
export type StageWithUnknown = Stage | '정보 없음'
