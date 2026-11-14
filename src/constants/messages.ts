// 기능명세서 9장 화면 문구 모음
// 확률·퍼센트 표현 금지 (2-4). 문구를 추가할 때도 지킬 것

export const MESSAGES = {
  noSearchResult: '검색 결과가 없어요',
  sameOriginDestination: '출발지와 목적지가 같아요',
  routeNotFound: '경로를 찾지 못했어요 다시 시도해 주세요',
  ongoingTrip: '진행 중인 이동이 있어요',
  locationDenied: '위치 권한 없이도 장소를 검색해서 쓸 수 있어요',
  locationPermission:
    '가까운 정류장을 찾고, 정류장과 목적지에 도착했는지 확인할 때 써요 / 위치는 계산에만 쓰고 저장하지 않아요',

  routesNotice: '경로마다 탑승/환승에 실패하는 경우를 보여드려요',
  nextBus: (busNo: string, minutes: number) => `→ 다음 ${busNo}번 (${minutes}분 뒤)`,
  transferArrival: (time: string, stopName: string) => `${time} ${stopName} 도착`,

  keepRoute: '지금 경로가 가장 빠르고 안정적이에요',
  recalculated: (time: string) => `방금 다시 계산했어요 · ${time} 기준`,
  updateFailed: '업데이트에 실패했어요. 다시 시도할게요',
  fasterBy: (minutes: number) => `${minutes}분 더 빨리 도착할 수 있어요`,
  arrivedQuestion: '도착하셨나요?',
  autoEnded: '자동으로 종료된 이동이에요',

  // 공통 표시 요소 (2-3)
  analysisUnavailable: '실시간 분석이 어려운 구간이에요 경로 정보만 보여드려요',

  // 실시간 분석 범위 안내 (BE 요청: 실시간 분석은 경기버스만 지원)
  /** 탈 버스가 모두 서울버스 등 미지원 노선 */
  analysisUnsupported: '실시간 분석 미지원 노선',
  /** 경기버스와 미지원 노선이 섞인 경로 */
  analysisPartial: '일부 구간만 실시간 분석 지원',
  /** 경기버스인데 지금 도착정보가 없음 */
  noLiveArrival: '현재 실시간 도착정보 없음',
  /** 버스 없이 지하철(·도보)만 이용 */
  analysisNotBus: '버스 위험 분석 대상 아님',
  waitingPassengers: '해당 정류장의 대기 인원에 따라 빈자리가 있어도 못 탈 수 있어요!',
  apiError: (time: string) => `실시간 정보를 불러오지 못해 ${time} 정보로 보여드려요`,
} as const
