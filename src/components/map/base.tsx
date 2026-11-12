import type { ReactNode } from 'react'

import mapBase from '@/assets/map/map-base.svg'

import CurrentLocation from './current-location'
import RouteOverlay from './route-overlay'

interface RoutePoint {
  x: number
  y: number
}

interface MapBaseProps {
  // 현재 위치 좌표 (픽셀)
  currentLocation?: { x: number; y: number }
  // 이동 경로 좌표 배열 (픽셀)
  routePoints?: RoutePoint[]
  routeColor?: string
  // 지도 위에 얹을 것들 (마커, 라벨 등). 지도 왼쪽 위(0,0) 기준 절대 좌표로 배치
  children?: ReactNode
}

// map/base-동백 (390×844). 시연 지역 고정 이미지 + 지명 라벨.
// TODO: 지도 SDK를 붙이면 이 컴포넌트의 이미지·라벨 부분을 SDK 지도로 교체
export default function MapBase({
  currentLocation,
  routePoints = [],
  routeColor,
  children,
}: MapBaseProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 390,
        height: 844,
        background: '#F6F5F1',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 지도 타일 */}
      <img
        alt=""
        src={mapBase}
        width={390}
        height={844}
        style={{ position: 'absolute', inset: 0, maxWidth: 'none' }}
      />

      {/* 지명 라벨. 좌표는 피그마 위치 그대로 */}
      <Label top={316} left={140}>
        동백죽전대로
      </Label>
      <Label top={560} left={113} box={{ width: 13, height: 34 }} rotate={90}>
        중부대로
      </Label>
      <Label top={728} left={30} box={{ width: 53, height: 27 }} rotate={-16} color="#99731A">
        영동고속도로
      </Label>
      <Label top={700} left={282} kind="place" color="#408040">
        동백호수공원
      </Label>
      <Label top={212} left={200} color="#4D80B2">
        청덕천
      </Label>
      <Label top={170} left={40} kind="area">
        동백동
      </Label>
      <Label top={420} left={320} kind="area">
        중동
      </Label>
      <Label top={30} left={190} kind="area">
        어정동
      </Label>
      <Label top={250} left={150}>
        쥬네브 아파트
      </Label>
      <Label top={520} left={150}>
        동백 세브란스병원
      </Label>
      <Label top={640} left={20}>
        백현마을
      </Label>

      {/* 동백역 */}
      <StationMarker top={383} left={60} />
      <Label top={410} left={32} kind="place" color="#408C26">
        동백역
      </Label>

      {/* 이동 경로 오버레이 */}
      {routePoints.length >= 2 && <RouteOverlay points={routePoints} color={routeColor} />}

      {/* 현재 위치 마커 */}
      {currentLocation && <CurrentLocation x={currentLocation.x} y={currentLocation.y} />}

      {children}
    </div>
  )
}

// ui/Map-label 10 · ui/Map-place 11 · ui/Map-area 13
const LABEL_STYLE = {
  label: { fontSize: 10, fontWeight: 500, letterSpacing: '-0.02em', color: '#73757A' },
  place: { fontSize: 11, fontWeight: 700, letterSpacing: '-0.02em', color: '#408040' },
  area: { fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em', color: '#595C61' },
} as const

interface LabelProps {
  top: number
  left: number
  kind?: keyof typeof LABEL_STYLE
  color?: string
  // 회전하는 라벨은 피그마 상자 크기 안에서 가운데 정렬
  box?: { width: number; height: number }
  rotate?: number
  children: ReactNode
}

function Label({ top, left, kind = 'label', color, box, rotate, children }: LabelProps) {
  const text = (
    <span
      style={{
        ...LABEL_STYLE[kind],
        color: color ?? LABEL_STYLE[kind].color,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
        display: 'block',
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      {children}
    </span>
  )

  if (!box) {
    return <p style={{ position: 'absolute', top, left, margin: 0 }}>{text}</p>
  }

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width: box.width,
        height: box.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {text}
    </div>
  )
}

// 역 마커: 초록 원 + 흰 테두리 + "E"
function StationMarker({ top, left }: { top: number; left: number }) {
  return (
    <div style={{ position: 'absolute', top, left, width: 26, height: 26 }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill="none"
        style={{ position: 'absolute', top: 0.5, left: 0.5 }}
      >
        <circle cx="12.5" cy="12.5" r="11" fill="#56AD2D" stroke="white" strokeWidth="3" />
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          color: 'white',
        }}
      >
        E
      </span>
    </div>
  )
}
