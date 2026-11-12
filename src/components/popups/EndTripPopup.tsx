import iconFlag from '@/assets/popups/icon-flag.svg'
import iconLocateSmall from '@/assets/popups/icon-locate-small.svg'
import Button from '@/components/common/Button'
import { MESSAGES } from '@/constants/messages'

import PopupSheet from './PopupSheet'

type EndTripPopupProps = {
  /** 목적지 근처 도착을 확인했을 때만 (예: "강남역 근처에 08:31 도착한 걸 확인했어요") */
  nearDestNote?: string | null
  onEnd: () => void
  onDismiss: () => void
  pending?: boolean
}

// P-03 이동 종료 확인 (F-05-09)
export default function EndTripPopup({
  nearDestNote,
  onEnd,
  onDismiss,
  pending = false,
}: EndTripPopupProps) {
  return (
    <PopupSheet
      icon={<img alt="" src={iconFlag} width={26} height={26} />}
      iconClassName="bg-level-ok-weak"
      title={MESSAGES.arrivedQuestion}
      description="종료하면 이번 이동 요약을 보여드려요."
      footnote="그냥 두면 도착 예정 30분 뒤에 자동으로 끝나요"
      onDismiss={onDismiss}
    >
      {nearDestNote && (
        <div className="bg-surface-sunken mt-5 flex items-center gap-2 rounded-xl px-3.5 py-3">
          <img alt="" src={iconLocateSmall} width={16} height={16} className="shrink-0" />
          <p className="text-caption1 text-text-secondary font-medium">{nearDestNote}</p>
        </div>
      )}
      <div className="mt-5 flex gap-2">
        <Button variant="tertiary" className="w-[120px] shrink-0" onClick={onDismiss}>
          아직 이동 중
        </Button>
        <Button className="min-w-0 flex-1" disabled={pending} onClick={onEnd}>
          이동 종료
        </Button>
      </div>
    </PopupSheet>
  )
}
