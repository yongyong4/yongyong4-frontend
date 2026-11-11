import { MESSAGES } from '@/constants/messages'

type RoutesHeaderProps = {
  origin: string
  destination: string
  /** 출발 시각 (예: "07:30") */
  departAt: string
  /** 실시간 정보 기준 시각 (예: "07:29") */
  baseAt: string
  onBack?: () => void
  onSwap?: () => void
}

// 후보 경로 목록 상단: 뒤로가기 + 출발지→도착지 + 기준 시각 + 안내 박스. 스크롤해도 위에 붙어 있음
export default function RoutesHeader({
  origin,
  destination,
  departAt,
  baseAt,
  onBack,
  onSwap,
}: RoutesHeaderProps) {
  return (
    <header className="bg-surface-default sticky top-0 z-20 flex flex-col gap-2.5 pt-[51px] pr-5 pb-3.5 pl-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로 가기"
          className="flex size-10 shrink-0 items-center justify-center"
        >
          <BackIcon />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="text-title3 font-medium whitespace-nowrap">
            {origin} → {destination}
          </h1>
          <p className="text-note text-text-tertiary whitespace-nowrap">
            {departAt} 출발 · {baseAt} 실시간 기준
          </p>
        </div>

        <button
          type="button"
          onClick={onSwap}
          aria-label="출발지와 도착지 바꾸기"
          className="text-text-secondary shrink-0"
        >
          <SwapIcon />
        </button>
      </div>

      <div className="bg-brand-weak text-brand-strong text-caption1 flex items-center gap-2 rounded-xl px-3 py-2.5 font-medium">
        <InfoIcon />
        <p>{MESSAGES.routesNotice}</p>
      </div>
    </header>
  )
}

// icon/back 24px
function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 5L8 12L15 19" />
    </svg>
  )
}

// icon/swap 20px (선 굵기 1.67)
function SwapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="block"
    >
      <path d="M5.83333 3.33333V16.6667M8.33333 5.83333L5.83333 3.33333L3.33333 5.83333M14.1667 16.6667V3.33333M16.6667 14.1667L14.1667 16.6667L11.6667 14.1667" />
    </svg>
  )
}

// icon/info 16px (선 굵기 1.33)
function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" />
      <path d="M8 7.33333V10.6667M8 5.33333H8.00667" />
    </svg>
  )
}
