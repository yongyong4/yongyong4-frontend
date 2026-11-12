import locationDot from '@/assets/trip/location-dot.svg'
import locationHalo from '@/assets/trip/location-halo.svg'
import mapBase from '@/assets/trip/map-base.svg'
import stationMarker from '@/assets/trip/map-station-marker.svg'
import routeLine from '@/assets/trip/route-line.svg'
import routeLineOutline from '@/assets/trip/route-line-outline.svg'
import routeLineUp from '@/assets/trip/route-line-up.svg'
import routeWalk from '@/assets/trip/route-walk.svg'

type TripMapProps = {
  /** 내 위치 옆 이름표 (예: "동백2차 정류장", "내 위치") */
  label: string
  /** 이름표 왼쪽 위치(px). 피그마: 정류장 이름표 138, "내 위치"만 있을 때 161 */
  labelLeft?: number
  /** 정류장까지 걷는 중이면 도보 점선을 그림 */
  showWalkPath: boolean
}

// 피그마 map/base-동백 지도 (시연 지역 고정 이미지)
// TODO: 지도 SDK를 붙이기 전까지 쓰는 임시 지도. 마커 위치도 피그마 위치 그대로 고정
// 버스 현재 위치 마커는 BE와 협의해 MVP에서 뺐음 (도착·좌석 정보는 바텀시트에서 보여줌)
export default function TripMap({ label, labelLeft = 138, showWalkPath }: TripMapProps) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#f6f5f1]">
      {/* 지도 바탕: 피그마에서 화면보다 60px 위로 올라가 있음 */}
      <div className="absolute inset-x-0 top-[-60px] h-[844px]">
        <img alt="" src={mapBase} width={390} height={844} className="absolute inset-0" />
        <MapText top={316} left={140}>
          동백죽전대로
        </MapText>
        <div className="absolute top-[560px] left-[113px] flex h-[34px] w-[13px] items-center justify-center">
          <MapText className="rotate-90">중부대로</MapText>
        </div>
        <div className="absolute top-[728px] left-[30px] flex h-[27px] w-[53px] items-center justify-center">
          <MapText color="#99731a" className="-rotate-16">
            영동고속도로
          </MapText>
        </div>
        <MapText top={700} left={282} size="place" color="#408040">
          동백호수공원
        </MapText>
        <MapText top={212} left={200} color="#4d80b2">
          청덕천
        </MapText>
        <MapText top={170} left={40} size="area">
          동백동
        </MapText>
        <MapText top={420} left={320} size="area">
          중동
        </MapText>
        <MapText top={30} left={190} size="area">
          어정동
        </MapText>
        <MapText top={250} left={150}>
          쥬네브 아파트
        </MapText>
        <MapText top={520} left={150}>
          동백 세브란스병원
        </MapText>
        <MapText top={640} left={20}>
          백현마을
        </MapText>

        {/* 에버라인 동백역 */}
        <div className="absolute top-[383px] left-[60px] size-[26px]">
          <div className="absolute inset-[7.69%]">
            <div className="absolute inset-[-6.82%]">
              <img alt="" src={stationMarker} className="block size-full max-w-none" />
            </div>
          </div>
          <span className="text-micro absolute inset-0 flex items-center justify-center font-bold text-white">
            E
          </span>
        </div>
        <MapText top={410} left={32} size="place" color="#408c26">
          동백역
        </MapText>
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

        {/* 내 위치 */}
        <div className="absolute inset-[45.22%_63.59%_45.22%_25.13%]">
          <img alt="" src={locationHalo} className="absolute inset-0 block size-full max-w-none" />
        </div>
        <div className="absolute inset-[48.04%_66.92%_48.04%_28.46%]">
          <div className="absolute inset-[-8.33%]">
            <img alt="" src={locationDot} className="block size-full max-w-none" />
          </div>
        </div>
      </div>

      {/* 내 위치 이름표 */}
      <div
        style={{ left: labelLeft }}
        className="shadow-elevation-1 text-caption1 text-brand-strong absolute top-[218px] rounded-lg bg-white px-2 py-1 font-medium whitespace-nowrap"
      >
        {label}
      </div>
    </div>
  )
}

type MapTextProps = {
  children: string
  top?: number
  left?: number
  /** label 10px 보통 / place 11px 굵게 / area 동네 이름 13px 굵게 */
  size?: 'label' | 'place' | 'area'
  color?: string
  className?: string
}

const SIZE_CLASS: Record<NonNullable<MapTextProps['size']>, string> = {
  label: 'text-[10px] font-medium',
  place: 'text-[11px] font-bold',
  area: 'text-[13px] font-bold',
}

const DEFAULT_COLOR: Record<NonNullable<MapTextProps['size']>, string> = {
  label: '#73757a',
  place: '#595c61',
  area: '#595c61',
}

function MapText({ children, top, left, size = 'label', color, className }: MapTextProps) {
  const positioned = top !== undefined && left !== undefined
  return (
    <p
      style={{
        color: color ?? DEFAULT_COLOR[size],
        ...(positioned && { position: 'absolute', top, left }),
      }}
      className={`leading-[1.3] tracking-[-0.02em] whitespace-nowrap ${SIZE_CLASS[size]} ${className ?? ''}`}
    >
      {children}
    </p>
  )
}
