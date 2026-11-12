interface CurrentLocationProps {
  x: number // 픽셀 x 좌표 (base에서 변환 후 전달)
  y: number // 픽셀 y 좌표
}

export default function CurrentLocation({ x, y }: CurrentLocationProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 외곽 반투명 원 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        style={{ position: 'absolute' }}
      >
        <path
          d="M22 44C34.1503 44 44 34.1503 44 22C44 9.84974 34.1503 0 22 0C9.84974 0 0 9.84974 0 22C0 34.1503 9.84974 44 22 44Z"
          fill="#4CB282"
          fillOpacity="0.15"
        />
      </svg>

      {/* 내부 채워진 원 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 21 21"
        fill="none"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <path
          d="M10.5 19.5C15.4706 19.5 19.5 15.4706 19.5 10.5C19.5 5.52944 15.4706 1.5 10.5 1.5C5.52944 1.5 1.5 5.52944 1.5 10.5C1.5 15.4706 5.52944 19.5 10.5 19.5Z"
          fill="#4CB282"
          strokeWidth="3"
          stroke="white"
        />
      </svg>
    </div>
  )
}
