import { useEffect, useRef } from 'react'

import Button from '@/components/common/Button'

type LocationPermissionSheetProps = {
  onAllow: () => void
  onLater: () => void
  /** 허용을 시도하는 중이면 버튼을 잠금 */
  pending?: boolean
  /** 허용을 시도했는데 위치를 쓸 수 없었으면 아래 안내 문구를 바꿔 보여줌 */
  failed?: boolean
}

const NOTES = ['위치는 계산에만 쓰고 저장하지 않아요', '목적지 근처에 도착한 시각만 기록해요']

const DEFAULT_HINT = '허용하지 않아도 장소를 검색해서 쓸 수 있어요'
// TODO: 피그마에 없는 문구. 위치를 쓸 수 없는 경우 안내 문구 확정 필요
const FAILED_HINT = '위치를 사용할 수 없어요\n브라우저 설정에서 위치 권한을 확인해 주세요'

// P-05 위치 권한 안내. 홈 위에 겹쳐서 뜨는 하단 시트 (390px 폭 안에서만 어둡게)
export default function LocationPermissionSheet({
  onAllow,
  onLater,
  pending = false,
  failed = false,
}: LocationPermissionSheetProps) {
  // 열릴 때 포커스를 시트로 옮김 (버튼에 주면 포커스 링이 보여서 시트 자체에 줌)
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  // Esc로 닫기 = "나중에"
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onLater()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onLater])

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-sheet-title"
      className="fixed top-0 bottom-0 left-1/2 z-20 w-[390px] -translate-x-1/2 outline-none"
    >
      <div aria-hidden="true" onClick={onLater} className="absolute inset-0 bg-black/50" />

      <div className="bg-surface-default absolute inset-x-0 bottom-0 flex flex-col rounded-t-[28px] px-5 pt-7 pb-[42px]">
        <div className="bg-brand-weak text-brand-strong flex size-12 items-center justify-center rounded-2xl">
          <LocateIcon />
        </div>

        <h2 id="location-sheet-title" className="text-title1 mt-3.5 font-semibold">
          위치를 사용해도 될까요?
        </h2>
        <p className="text-body2 text-text-secondary mt-1.5 whitespace-pre-line">
          {'가까운 정류장을 찾고,\n정류장과 목적지에 도착했는지 확인할 때 써요.'}
        </p>

        <ul className="bg-surface-sunken mt-4 flex flex-col gap-2 rounded-xl px-3.5 py-3">
          {NOTES.map((note) => (
            <li
              key={note}
              className="text-caption1 text-text-secondary flex items-center gap-1.5 font-medium"
            >
              <CheckIcon />
              {note}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center gap-2">
          <Button variant="tertiary" onClick={onLater} className="w-[120px] shrink-0">
            나중에
          </Button>
          <Button onClick={onAllow} disabled={pending} className="min-w-0 flex-1">
            허용하기
          </Button>
        </div>

        <p className="text-note text-text-tertiary mt-2.5 text-center whitespace-pre-line">
          {failed ? FAILED_HINT : DEFAULT_HINT}
        </p>
      </div>
    </div>
  )
}

// icon/locate 26px
function LocateIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.3333 13C17.3333 15.3932 15.3932 17.3333 13 17.3333C10.6068 17.3333 8.66667 15.3932 8.66667 13C8.66667 10.6068 10.6068 8.66667 13 8.66667C15.3932 8.66667 17.3333 10.6068 17.3333 13Z" />
      <path d="M13 2.16667V5.41667M13 20.5833V23.8333M2.16667 13H5.41667M20.5833 13H23.8333" />
    </svg>
  )
}

// icon/check 14px
function CheckIcon() {
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
      className="text-level-ok shrink-0"
    >
      <path d="M2.91667 7L5.83333 9.91667L11.0833 4.08333" />
    </svg>
  )
}
