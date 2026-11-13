import iconLocate from '@/assets/popups/icon-locate.svg'
import Button from '@/components/common/Button'

import PopupSheet from './PopupSheet'

type StopArrivalPopupProps = {
  /** 예: "동백2차" */
  stopName: string
  onConfirm: () => void
  onDismiss: () => void
  pending?: boolean
}

// P-04 정류장 도착 확인 (F-05-06). 정류장 50m 안에 들어오면 한 번 물어봄
export default function StopArrivalPopup({
  stopName,
  onConfirm,
  onDismiss,
  pending = false,
}: StopArrivalPopupProps) {
  return (
    <PopupSheet
      icon={<img alt="" src={iconLocate} width={26} height={26} />}
      iconClassName="bg-brand-weak"
      title={`${stopName} 정류장에 도착했나요?`}
      description="도착했다면 기다리는 버스 기준으로 다시 계산해요"
      footnote="정류장 50m 안에 들어온 걸 확인했어요 · 정류장마다 한 번만 물어봐요"
      onDismiss={onDismiss}
    >
      <div className="mt-5 flex gap-2">
        <Button variant="tertiary" className="w-[120px] shrink-0" onClick={onDismiss}>
          아니요
        </Button>
        <Button className="min-w-0 flex-1" disabled={pending} onClick={onConfirm}>
          네, 도착했어요
        </Button>
      </div>
    </PopupSheet>
  )
}
