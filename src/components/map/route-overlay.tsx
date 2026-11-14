interface RoutePoint {
  x: number // 픽셀 x (base에서 좌표 변환 후 전달)
  y: number // 픽셀 y
}

interface RouteOverlayProps {
  points: RoutePoint[]
  color?: string
}

export default function RouteOverlay({ points, color = '#F2A900' }: RouteOverlayProps) {
  if (points.length < 2) return null

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="390"
      height="844"
      viewBox="0 0 390 844"
      fill="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
