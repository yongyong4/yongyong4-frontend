import MapBase, { type MapLabel } from '@/components/map/base'
import { boardingFocus, type RouteGeometry } from '@/components/map/geometry'
import type { MapPoint } from '@/components/map/kakao'

type StrategyMapPreviewProps = {
  /** 고른(또는 [상세]를 누른) 전략의 경로 */
  geometry: RouteGeometry | null
  labels: MapLabel[]
  /** 기기 현재 위치일 때만 내 위치 점을 찍음 */
  myLocation: MapPoint | null
  /** 출발 위치 (동백역 또는 현재 위치). 타는 정류장과 함께 지도가 맞춰질 범위에 들어감 */
  origin: MapPoint
}

/** 시트가 시작되는 위치 (StrategyOverlay의 top-[313px]) */
const SHEET_TOP = 313
/** 뒤로가기 버튼과 위쪽 흐림 아래 */
const VISIBLE_TOP = 110

// 전략 화면 뒤에 비치는 카카오맵 (피그마 S-03).
// 시트에 가려지지 않는 위쪽(110~313px) 안에 경로가 다 보이게 맞춤.
// 지도는 시트 밖 영역에서 손가락으로 움직일 수 있음
export default function StrategyMapPreview({
  geometry,
  labels,
  myLocation,
  origin,
}: StrategyMapPreviewProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <MapBase
        geometry={geometry}
        labels={labels}
        myLocation={myLocation}
        // 정류장 선택 화면이라 경로 전체(동백 → 강남)가 아니라 출발 위치와 타는 정류장 주변을 보여줌
        focus={boardingFocus(geometry, [origin])}
        visibleTop={VISIBLE_TOP}
        visibleBottom={SHEET_TOP}
      />
      {/* 위쪽 흐림 처리는 StrategyOverlay에 있음 (이동 중 화면 위에서도 같이 보이게) */}
    </div>
  )
}
