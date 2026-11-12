import { useEffect, useId, useRef, type ReactNode } from 'react'

import { cn } from '@/utils/cn'

type PopupSheetProps = {
  /** 48px 둥근 칸 안의 아이콘 (26px) */
  icon: ReactNode
  /** 아이콘 칸 배경색 클래스 (예: bg-brand-weak) */
  iconClassName: string
  title: string
  description?: ReactNode
  children?: ReactNode
  /** 맨 아래 작은 회색 안내 문구 */
  footnote?: string
  /** 바깥(어두운 곳) 클릭, Esc. 없으면 닫히지 않음 */
  onDismiss?: () => void
}

// P-01~P-04 공통 하단 시트. 이동 중 화면 위에 겹쳐서 뜸 (390px 폭 안에서만 어둡게)
// 구조는 P-05 위치 권한 시트(pages/home/components/LocationPermissionSheet)와 같게 맞춤
export default function PopupSheet({
  icon,
  iconClassName,
  title,
  description,
  children,
  footnote,
  onDismiss,
}: PopupSheetProps) {
  const titleId = useId()

  // 열릴 때 포커스를 시트로 옮김
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!onDismiss) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onDismiss])

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed top-0 bottom-0 left-1/2 z-30 w-[390px] -translate-x-1/2 outline-none"
    >
      <div aria-hidden="true" onClick={onDismiss} className="absolute inset-0 bg-black/50" />

      <div className="bg-surface-default absolute inset-x-0 bottom-0 flex flex-col rounded-t-[28px] px-5 pt-7 pb-[42px]">
        <div className={cn('flex size-12 items-center justify-center rounded-2xl', iconClassName)}>
          {icon}
        </div>

        <h2 id={titleId} className="text-title1 mt-3.5 font-semibold">
          {title}
        </h2>
        {description && <div className="text-body2 text-text-secondary mt-1.5">{description}</div>}

        {children}

        {footnote && <p className="text-note text-text-tertiary mt-2.5 text-center">{footnote}</p>}
      </div>
    </div>
  )
}
