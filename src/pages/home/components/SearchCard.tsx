import { cn } from '@/utils/cn'

type SearchCardProps = {
  /** 출발지 표시 문구 (예: "현재 위치 · 동백동") */
  origin: string
  /** 고른 도착지 이름. 없으면 "도착지를 검색하세요"가 보임 */
  destination?: string
  onUseMyLocation?: () => void
  onDestinationClick?: () => void
  onSwap?: () => void
  onPickOnMap?: () => void
}

// 출발지·도착지 입력 카드. 히어로 위로 84px 겹쳐 올라감
export default function SearchCard({
  origin,
  destination,
  onUseMyLocation,
  onDestinationClick,
  onSwap,
  onPickOnMap,
}: SearchCardProps) {
  return (
    <section className="bg-surface-default shadow-elevation-2 relative mx-5 -mt-[84px] rounded-[20px] py-1.5">
      <div className="flex items-center gap-2.5 py-1 pr-3 pl-4">
        <RouteDots />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-line-default flex items-center justify-between border-b py-[11px]">
            <p className="text-body1">{origin}</p>
            <button
              type="button"
              onClick={onUseMyLocation}
              className="bg-brand-weak text-brand-strong text-caption1 flex items-center gap-[3px] rounded-full py-1 pr-2 pl-1.5 font-medium"
            >
              <LocateIcon />내 위치
            </button>
          </div>
          <button
            type="button"
            onClick={onDestinationClick}
            className={cn(
              'text-body1 truncate py-[11px] text-left font-medium',
              destination ? 'text-text-primary' : 'text-text-tertiary',
            )}
          >
            {destination ?? '도착지를 검색하세요'}
          </button>
        </div>

        <button
          type="button"
          onClick={onSwap}
          aria-label="출발지와 도착지 바꾸기"
          className="bg-surface-sunken text-text-secondary flex size-8 shrink-0 items-center justify-center rounded-full"
        >
          <SwapIcon />
        </button>
      </div>

      <button
        type="button"
        onClick={onPickOnMap}
        className="border-line-default text-note text-text-secondary flex w-full items-center justify-center gap-1.5 border-t px-4 pt-2.5 pb-2"
      >
        <FlagIcon />
        지도에서 선택
      </button>
    </section>
  )
}

// 출발지(초록 테두리) → 점선 → 도착지(검정 원)를 잇는 세로 표시 (10×45)
function RouteDots() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="45"
      viewBox="0 0 10 45"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="5" cy="5" r="3.5" strokeWidth="3" className="stroke-brand-primary fill-white" />
      <circle cx="5" cy="15.5" r="1.5" className="fill-line-default" />
      <circle cx="5" cy="22.5" r="1.5" className="fill-line-default" />
      <circle cx="5" cy="29.5" r="1.5" className="fill-line-default" />
      <circle cx="5" cy="40" r="5" className="fill-text-primary" />
    </svg>
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

// icon/swap 16px
function SwapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M4.66667 2.66667V13.3333M6.66667 4.66667L4.66667 2.66667L2.66667 4.66667M11.3333 13.3333V2.66667M13.3333 11.3333L11.3333 13.3333L9.33333 11.3333" />
    </svg>
  )
}

// icon/flag 14px
function FlagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-brand-strong shrink-0"
    >
      <path d="M2.91667 12.25V7M2.91667 7V2.33333H9.33333L8.16667 4.66667L9.33333 7H2.91667Z" />
    </svg>
  )
}
