type TouchMarkerProps = {
  className?: string
}

// 버튼을 누르는 손가락 위치 표시 (44×44 반투명 원 + 안쪽 점)
export default function TouchMarker({ className }: TouchMarkerProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="22"
        cy="22"
        r="20"
        fill="white"
        fillOpacity="0.35"
        stroke="white"
        strokeWidth="2"
      />
      <circle cx="22" cy="22" r="8" fill="white" />
    </svg>
  )
}
