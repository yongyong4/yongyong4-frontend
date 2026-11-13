import LineBadge from '@/components/common/LineBadge'
import type { TransitType } from '@/types/transit'

type OngoingTripBannerProps = {
  origin: string
  destination: string
  /** 지금 타려는(기다리는) 노선 */
  transitType: TransitType
  busNo: string
  minutesToArrival: number
  onResume?: () => void
}

// 진행 중인 이동이 있을 때 화면 아래에 떠 있는 "이어 보기" 배너.
// 내용이 길어도 화면 하단(아래에서 42px)에 붙어 있음
export default function OngoingTripBanner({
  origin,
  destination,
  transitType,
  busNo,
  minutesToArrival,
  onResume,
}: OngoingTripBannerProps) {
  return (
    <button
      type="button"
      onClick={onResume}
      className="bg-text-primary sticky bottom-[42px] z-20 mt-4 flex w-[350px] items-center gap-2.5 self-center rounded-2xl py-3 pr-3 pl-4 text-left"
    >
      <span aria-hidden="true" className="bg-level-bad size-2 shrink-0 rounded-full" />

      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-caption1 text-text-tertiary font-medium">
          이동 중 · {origin} → {destination}
        </span>
        <span className="flex items-center gap-1.5">
          <LineBadge type={transitType} label={busNo} />
          <span className="text-label1 text-text-inverse font-semibold">
            {minutesToArrival}분 후 도착
          </span>
        </span>
      </span>

      <span className="text-caption1 text-text-inverse flex shrink-0 items-center gap-0.5 rounded-full bg-white/14 py-1.5 pr-2 pl-3 font-medium">
        이어 보기
        <ChevronIcon />
      </span>
    </button>
  )
}

// icon/chevron 14px, 선 굵기 1.17
function ChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M5.25 3.5L8.75 7L5.25 10.5" />
    </svg>
  )
}
