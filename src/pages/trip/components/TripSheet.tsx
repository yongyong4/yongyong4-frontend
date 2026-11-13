import iconRefresh from '@/assets/trip/icon-refresh.svg'
import iconSeat from '@/assets/trip/icon-seat.svg'
import stepCurrent from '@/assets/trip/step-current.svg'
import stepDone from '@/assets/trip/step-done.svg'
import stepEnd from '@/assets/trip/step-end.svg'
import stepUpcoming from '@/assets/trip/step-upcoming.svg'
import Button from '@/components/common/Button'
import LevelPill from '@/components/common/LevelPill'
import LineBadge from '@/components/common/LineBadge'
import { cn } from '@/utils/cn'

import type { SeatsView, StepState, TimelineStep, TripAction, TripView } from '../tripView'

type TripSheetProps = {
  view: TripView
  /** 정보가 늦었을 때 (dataDelayed) */
  delayed: boolean
  /** 업데이트 실패 같은 안내. 있으면 기준 시각 줄 대신 보여줌 */
  notice: string | null
  /** 버튼을 누른 뒤 응답을 기다리는 중 */
  busy: boolean
  onAction: (action: TripAction) => void
  onRefresh: () => void
}

// 피그마 S-05 "바텀시트"
export default function TripSheet({
  view,
  delayed,
  notice,
  busy,
  onAction,
  onRefresh,
}: TripSheetProps) {
  // 기능명세서 2-2 (C-02): 정보 지연이면 "○○:○○ 기준 · 정보 지연" + 회색
  // F-05-02: 요청 실패면 "업데이트에 실패했어요. 다시 시도할게요" (주황)
  const basisText =
    notice ??
    (view.basisTime
      ? delayed
        ? `${view.basisTime} 기준 · 정보 지연`
        : `${view.basisTime} 기준 · 2분마다 갱신`
      : '2분마다 갱신')

  return (
    // 환승이 많으면 내용이 길어짐 → 시트는 상단바 아래까지만 커지고 안쪽에서 스크롤, 버튼은 항상 아래에 보임
    // z-20: 지도 위 마커·이름표보다 위
    <section className="shadow-elevation-2 absolute inset-x-0 bottom-[-6px] z-20 flex max-h-[calc(100%-104px)] flex-col items-center rounded-t-3xl bg-white pt-2.5 pb-[42px]">
      <div aria-hidden="true" className="bg-line-strong h-1 w-9 shrink-0 rounded-xs" />

      <div className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto overscroll-contain px-5">
        <div className="mt-3.5 flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {view.badge && <LineBadge type={view.badge.type} label={view.badge.label} />}
            <h1 className="text-label1 truncate font-semibold">{view.sheetTitle}</h1>
          </div>
          {view.level && <LevelPill level={view.level.level} label={view.level.label} />}
        </div>

        <div className="mt-2.5 flex w-full items-baseline gap-2.5">
          <p className="flex items-baseline gap-0.5 whitespace-nowrap">
            {view.headline.value !== null && (
              <span className="text-display text-live font-bold">{view.headline.value}</span>
            )}
            <span className="text-title2 font-medium">{view.headline.unit}</span>
          </p>
          {view.seats && <Seats seats={view.seats} />}
        </div>

        <div className="flex w-full items-center gap-1">
          <p
            className={cn(
              'text-note',
              notice ? 'text-level-warn' : delayed ? 'text-level-na' : 'text-text-tertiary',
            )}
          >
            {basisText}
          </p>
          <button
            type="button"
            onClick={onRefresh}
            disabled={busy}
            aria-label="지금 다시 계산하기"
            className="relative h-[11.917px] w-[13px] shrink-0 disabled:opacity-40"
          >
            <span className="absolute inset-[0_0_-9.09%_0]">
              <img
                alt=""
                src={iconRefresh}
                className="absolute inset-0 block size-full max-w-none"
              />
            </span>
          </button>
        </div>

        {view.info && (
          <div className="bg-surface-sunken mt-3.5 flex w-full items-center gap-2 rounded-xl px-3.5 py-3">
            <p className="text-caption1 text-text-secondary font-medium whitespace-nowrap">
              {view.info.label}
            </p>
            <p className="text-label1 min-w-0 flex-1 font-medium">{view.info.value}</p>
            {view.info.pill && (
              <LevelPill level={view.info.pill.level} label={view.info.pill.label} />
            )}
          </div>
        )}

        <ol className="mt-[18px] flex w-full flex-col">
          {view.steps.map((step) => (
            <TimelineRow key={step.key} step={step} />
          ))}
        </ol>
      </div>

      <div className="mt-3 flex w-full shrink-0 gap-2 px-5">
        {view.secondary && (
          <Button
            variant="tertiary"
            className="min-w-0 flex-1"
            disabled={busy}
            onClick={() => onAction(view.secondary!.action)}
          >
            {view.secondary.label}
          </Button>
        )}
        <Button
          className="min-w-0 flex-1"
          disabled={busy}
          onClick={() => onAction(view.primary.action)}
        >
          {view.primary.label}
        </Button>
      </div>
    </section>
  )
}

function Seats({ seats }: { seats: SeatsView }) {
  return (
    <p className="text-label1 text-text-secondary flex items-center gap-[3px] font-medium whitespace-nowrap">
      <img alt="" src={iconSeat} width={14} height={14} className="shrink-0" />
      <span>
        {seats.prefix}
        <span className={seats.warn ? 'text-[#dc2626]' : undefined}>{seats.count}</span>
        {seats.suffix}
      </span>
    </p>
  )
}

const STEP_IMAGE: Record<StepState, { src: string; height: number }> = {
  done: { src: stepDone, height: 48 },
  current: { src: stepCurrent, height: 56 },
  upcoming: { src: stepUpcoming, height: 48 },
  end: { src: stepEnd, height: 14 },
}

function TimelineRow({ step }: { step: TimelineStep }) {
  const image = STEP_IMAGE[step.state]
  const titleClass =
    step.state === 'current'
      ? 'font-semibold text-text-primary'
      : step.state === 'upcoming'
        ? 'font-semibold text-text-secondary'
        : step.state === 'end'
          ? 'font-medium text-text-tertiary'
          : 'font-medium text-text-primary'

  return (
    <li className="flex w-full items-start gap-3">
      <img
        alt=""
        src={image.src}
        width={22}
        height={image.height}
        style={{ height: image.height }}
        className="w-[22px] shrink-0"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-2 whitespace-nowrap">
        <p className={cn('text-label1', titleClass)}>{step.title}</p>
        {step.hint ? (
          <p className="text-note text-brand-strong">
            <span className="leading-[1.3] font-bold">현재 구간</span> · {step.hint}
          </p>
        ) : (
          step.sub && <p className="text-note text-text-tertiary">{step.sub}</p>
        )}
      </div>
    </li>
  )
}
