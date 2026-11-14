import routeLine from '@/assets/trip/route-line.svg'
import routeLineOutline from '@/assets/trip/route-line-outline.svg'
import routeLineUp from '@/assets/trip/route-line-up.svg'
import routeWalk from '@/assets/trip/route-walk.svg'
import MapBase from '@/components/map/base'

type TripMapProps = {
  /** 내 위치 옆 이름표 (예: "동백2차 정류장", "내 위치") */
  label: string
  /** 이름표 왼쪽 위치(px). 피그마: 정류장 이름표 138, "내 위치"만 있을 때 161 */
  labelLeft?: number
  /** 정류장까지 걷는 중이면 도보 점선을 그림 */
  showWalkPath: boolean
}

/** 피그마에서 지도는 화면보다 60px 위로 올라가 있음 */
const MAP_OFFSET_Y = -60

/** 내 위치 (화면 기준 x 120, y 230 → 지도 기준으로 바꿔서 넘김) */
const MY_LOCATION = { x: 120, y: 230 - MAP_OFFSET_Y }

// 이동 중 화면 뒤의 지도 (피그마 S-05)
// 지도 바탕·지명·역 마커·내 위치는 공통 지도(components/map/base)를 쓰고,
// 이동 중 화면에만 있는 경로선과 이름표만 여기서 얹음
// TODO: 지도 SDK를 붙이기 전까지 쓰는 임시 지도. 마커 위치도 피그마 위치 그대로 고정
// 버스 현재 위치 마커는 BE와 협의해 MVP에서 뺐음 (도착·좌석 정보는 바텀시트에서 보여줌)
export default function TripMap({ label, labelLeft = 138, showWalkPath }: TripMapProps) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#f6f5f1]">
      <div className="absolute left-0" style={{ top: MAP_OFFSET_Y }}>
        <MapBase currentLocation={MY_LOCATION} />
      </div>

      {/* 경로 오버레이 (피그마 "경로 오버레이" 390×460) */}
      <div className="absolute inset-x-0 top-0 h-[460px] overflow-hidden">
        <div className="absolute inset-[-2.17%_-2.56%_41.3%_30.77%]">
          <div className="absolute inset-[0_0_-1.96%_-1.96%]">
            <img alt="" src={routeLineOutline} className="block size-full max-w-none" />
          </div>
        </div>
        <div className="absolute inset-[-2.17%_-2.56%_41.3%_30.77%]">
          <div className="absolute inset-[0_0_-1.07%_-1.07%]">
            <img alt="" src={routeLine} className="block size-full max-w-none" />
          </div>
        </div>
        <div className="absolute inset-[-2.17%_69.23%_67.39%_30.77%]">
          <div className="absolute inset-[0_-3px]">
            <img alt="" src={routeLineUp} className="block size-full max-w-none" />
          </div>
        </div>
        {showWalkPath && (
          <div className="absolute inset-[50.43%_55.13%_28.26%_32.31%]">
            <div className="absolute inset-[-2.04%_-4.08%]">
              <img alt="" src={routeWalk} className="block size-full max-w-none" />
            </div>
          </div>
        )}
      </div>

      {/* 내 위치 이름표 */}
      <div
        style={{ left: labelLeft }}
        className="shadow-elevation-1 text-caption1 text-brand-strong absolute top-[218px] z-10 rounded-lg bg-white px-2 py-1 font-medium whitespace-nowrap"
      >
        {label}
      </div>
    </div>
  )
}
