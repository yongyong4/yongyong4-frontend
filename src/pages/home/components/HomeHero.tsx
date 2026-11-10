type HomeHeroProps = {
  /** 현재 동네 · 시각 · 날씨 한 줄 (예: "동백동 · 07:30 · 맑음") */
  status: string
}

// 홈 상단 초록 히어로 (높이 300). 검색 카드가 아래에서 겹쳐 올라옴
export default function HomeHero({ status }: HomeHeroProps) {
  return (
    <header className="relative h-[300px] shrink-0 overflow-hidden bg-[linear-gradient(150deg,#3fa375_14.286%,#60974c_85.714%)]">
      {/* 장식용 흐린 원 */}
      <div
        aria-hidden="true"
        className="absolute -top-[41px] -right-[68px] size-[225px] rounded-full bg-white/12 blur-[4.7px]"
      />
      <div
        aria-hidden="true"
        className="absolute top-[150px] -right-[30px] size-[120px] rounded-full bg-white/10 blur-[4.7px]"
      />

      <div className="text-text-inverse absolute top-[72px] left-5 flex flex-col items-start">
        <p className="text-caption1 flex items-center gap-1 rounded-full bg-white/22 px-2.5 py-1 font-medium">
          <LocateIcon />
          {status}
        </p>
        <h1 className="text-title1 mt-[18px] font-semibold whitespace-pre">
          {'내가 탈 버스의\n예측 빈 자리를 확인해보세요'}
        </h1>
        <p className="text-note mt-1.5 whitespace-nowrap">
          버스를 못 타도 다른 방법을 제안해드립니다
        </p>
      </div>
    </header>
  )
}

// icon/locate 12px
function LocateIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M8 6C8 7.10457 7.10457 8 6 8C4.89543 8 4 7.10457 4 6C4 4.89543 4.89543 4 6 4C7.10457 4 8 4.89543 8 6Z" />
      <path d="M6 1V2.5M6 9.5V11M1 6H2.5M9.5 6H11" />
    </svg>
  )
}
