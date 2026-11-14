import MapBase, { type MapLabel, type MyLocationKind } from '@/components/map/base'
import { boardingFocus, type RouteGeometry } from '@/components/map/geometry'
import { type MapPoint, useMyLocation } from '@/components/map/kakao'
import { useWalkingPaths } from '@/components/map/useWalkingPaths'

type TripMapProps = {
  /** 내 위치 옆 이름표 (예: "동백2차 정류장", "동백2차 · 내 위치", "내 위치") */
  label: string
  /** 출발할 때 저장해 둔 정류장 좌표. 경로가 바뀌었거나 다른 기기면 없음 */
  geometry: RouteGeometry | null
  /** 지금 단계: 정류장으로 걷는 중 / 정류장 대기 / 탑승 중 / 탑승 실패 */
  phase: 'walking' | 'waiting' | 'riding' | 'failed'
  /** 지금 타려는(타고 있는) 탈것 구간이 탈것 구간 중 몇 번째인지. 모르면 -1 */
  transitIndex: number
  transitMode: 'bus' | 'subway'
}

/** 상단바 아래 */
const VISIBLE_TOP = 110
/** 시트가 가장 커졌을 때의 위쪽 (TripSheet: 화면 위에서 313px 아래부터) */
const SHEET_TOP = 313

// 이동 중 화면 뒤의 카카오맵 (피그마 S-05)
// - 정류장·경로선: 출발할 때 저장한 좌표 (이동 중 응답에는 좌표가 없음)
// - 지금 구간만 진하게, 나머지는 흐리게
// - 내 위치 표시: 도보=걷는 아이콘(GPS), 대기=정류장 위 링, 버스·지하철=탈것 아이콘(GPS)
// 버스 현재 위치 마커는 BE와 협의해 MVP에서 뺐음 (도착·좌석 정보는 바텀시트에서 보여줌)
export default function TripMap({
  label,
  geometry,
  phase,
  transitIndex,
  transitMode,
}: TripMapProps) {
  const gps = useMyLocation()
  // 환승 사이·도착지까지 걷는 구간은 직선 대신 실제 도보 경로로 (받아오는 동안은 직선)
  const walked = useWalkingPaths(geometry)

  // 저장된 paths에서 탈것 구간 위치. k번째 탈것 앞의 도보는 바로 앞 칸
  const transitPathIdx: number[] = []
  geometry?.paths.forEach((p, i) => {
    if (p.kind !== 'walk') transitPathIdx.push(i)
  })
  const current = transitIndex >= 0 ? transitPathIdx[transitIndex] : undefined
  const prevWalk =
    current !== undefined && current > 0 && geometry?.paths[current - 1].kind === 'walk'
      ? current - 1
      : undefined

  const drawn: RouteGeometry | null =
    walked && current !== undefined
      ? {
          ...walked,
          paths: walked.paths.map((p, i) => {
            const keep = phase === 'riding' ? i === current : i === current || i === prevWalk
            return keep ? p : { ...p, dim: true }
          }),
        }
      : walked

  const stopPoint: MapPoint | null =
    current !== undefined ? (geometry?.paths[current].points[0] ?? null) : null

  const atStop = (phase === 'waiting' || phase === 'failed') && stopPoint
  const myPoint: MapPoint | null = atStop ? stopPoint : gps
  const kind: MyLocationKind = atStop ? 'wait' : phase === 'riding' ? transitMode : 'walk'

  const labels: MapLabel[] = myPoint ? [{ point: myPoint, text: label, tone: 'brand' }] : []

  let focus: MapPoint[] | null
  if (phase === 'riding' && current !== undefined && geometry) {
    focus = [...geometry.paths[current].points, ...(gps ? [gps] : [])]
  } else if (atStop) {
    focus = [stopPoint]
  } else if (phase === 'walking' && stopPoint) {
    focus = [stopPoint, ...(gps ? [gps] : [])]
  } else if (phase === 'riding') {
    focus = null
  } else {
    focus = boardingFocus(geometry, [gps])
  }
  if (focus && focus.length === 0) focus = null

  return (
    <div className="absolute inset-0 isolate overflow-hidden">
      <MapBase
        geometry={drawn}
        myLocation={myPoint}
        myLocationKind={kind}
        labels={labels}
        focus={focus}
        visibleTop={VISIBLE_TOP}
        visibleBottom={SHEET_TOP}
      />
    </div>
  )
}
