// 전략 화면 위쪽에 비치는 지도 + 경로.
// TODO: 지도 SDK 연동 전 임시. 지금은 배경색 위에 경로선과 정류장 점만 그려둠
// (시트에 가려지는 아래쪽 부분은 그리지 않음)
export default function StrategyMapPreview() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-[320px] overflow-hidden bg-[#f6f5f1]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="390"
        height="320"
        viewBox="0 0 390 320"
        fill="none"
        className="absolute inset-0"
      >
        {/* 버스 노선: 흰 외곽선 위에 노란선 */}
        <path d="M120 -10V190H400" stroke="white" strokeWidth="11" strokeLinejoin="round" />
        <path d="M120 -10V190H400" stroke="#F2A900" strokeWidth="6" strokeLinejoin="round" />

        {/* 앞 정류장으로 이어지는 초록 점선 */}
        <path
          d="M2.2504 2.2504C2.39409 2.33123 2.53775 2.4129 2.68136 2.49542M9.35482 6.9604C9.62004 7.1632 9.8849 7.3688 10.1494 7.57718M16.1891 12.8841C16.431 13.1193 16.6724 13.3568 16.9134 13.5966M22.3544 19.5107C22.5691 19.7647 22.7834 20.0205 22.997 20.2782M27.896 26.6625C28.088 26.9323 28.2793 27.2036 28.4699 27.4765M32.8579 34.2234C33.0299 34.5074 33.2012 34.7928 33.3718 35.0795"
          stroke="#4CB282"
          strokeWidth="4.5"
          strokeLinecap="round"
          transform="translate(125.75 89.75)"
        />

        {/* 앞 정류장 */}
        <circle cx="120" cy="90" r="10" fill="#4CB282" stroke="white" strokeWidth="3" />
      </svg>

      {/* 위쪽 흐림 처리는 StrategyOverlay에 있음 (이동 중 화면 위에서도 같이 보이게) */}
    </div>
  )
}
