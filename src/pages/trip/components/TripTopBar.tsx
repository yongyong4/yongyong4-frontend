type TripTopBarProps = {
  /** "이동 중" 또는 "탑승" */
  statusLabel: string
  /** 예: "동백역 → 강남역 · 08:29 도착 예정" */
  title: string
  onEnd: () => void
}

// 피그마 "이동 상단바" + 위쪽 흰 그라데이션
export default function TripTopBar({ statusLabel, title, onEnd }: TripTopBarProps) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[110px] bg-linear-to-b from-white/95 to-white/0" />
      <div className="shadow-elevation-1 absolute top-[54px] right-4 left-4 flex h-11 items-center gap-2 rounded-full bg-white py-1.5 pr-1.5 pl-3.5">
        <span className="bg-brand-primary text-micro text-text-inverse flex shrink-0 items-center gap-[5px] rounded-full px-2 py-[3px] font-medium">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-white" />
          {statusLabel}
        </span>
        <p className="text-label1 min-w-0 flex-1 truncate font-medium">{title}</p>
        <button
          type="button"
          onClick={onEnd}
          className="bg-surface-sunken text-caption1 text-text-secondary shrink-0 rounded-full px-3 py-1.5 font-medium"
        >
          종료
        </button>
      </div>
    </>
  )
}
