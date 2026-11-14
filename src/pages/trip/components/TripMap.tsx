import MapBase, { type MapLabel } from '@/components/map/base'
import { boardingFocus, type RouteGeometry } from '@/components/map/geometry'
import { useMyLocation } from '@/components/map/kakao'

type TripMapProps = {
  /** 내 위치 옆 이름표 (예: "동백2차 정류장", "동백2차 · 내 위치", "내 위치") */
  label: string
  /** 출발할 때 저장해 둔 정류장 좌표. 경로가 바뀌었거나 다른 기기면 없음 */
  geometry: RouteGeometry | null
  /** 탑승 중이면 경로 전체를, 정류장으로 가는 중·대기 중이면 정류장 주변을 크게 보여줌 */
  riding: boolean
}

/** 상단바 아래 */
const VISIBLE_TOP = 110
/** 시트가 가장 커졌을 때의 위쪽 (TripSheet: 화면 위에서 313px 아래부터) */
const SHEET_TOP = 313

// 이동 중 화면 뒤의 카카오맵 (피그마 S-05)
// - 정류장·경로선: 출발할 때 저장한 좌표 (이동 중 응답에는 좌표가 없음)
// - 내 위치: 위치 권한이 허용돼 있으면 실시간으로 따라감 (저장하지 않음)
// 버스 현재 위치 마커는 BE와 협의해 MVP에서 뺐음 (도착·좌석 정보는 바텀시트에서 보여줌)
export default function TripMap({ label, geometry, riding }: TripMapProps) {
  const myLocation = useMyLocation()

  // 이름표 자리: 정류장 이름이 들어 있으면 그 정류장 옆, 아니면 내 위치 옆
  const stopName = label.replace(/ 정류장$/, '').replace(/ · 내 위치$/, '')
  const stop = geometry?.stops.find(
    (s) => s.name && (s.name === stopName || s.name.includes(stopName)),
  )
  const point = label.endsWith('내 위치') && myLocation ? myLocation : (stop ?? myLocation)
  const labels: MapLabel[] = point ? [{ point, text: label, tone: 'brand' }] : []

  return (
    <div className="absolute inset-0 isolate overflow-hidden">
      <MapBase
        geometry={geometry}
        myLocation={myLocation}
        labels={labels}
        focus={riding ? null : boardingFocus(geometry, [myLocation])}
        visibleTop={VISIBLE_TOP}
        visibleBottom={SHEET_TOP}
      />
    </div>
  )
}
