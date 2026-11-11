import { useEffect, useRef, useState, type PointerEvent } from 'react'

import Button from '@/components/common/Button'
import HomeIndicator from '@/components/layout/HomeIndicator'

import StrategySheet, { type StrategyOption, type StrategySheetData } from './StrategySheet'

// 이동 중 화면 위에 얹는 전략 비교 전체 (시트 + 뒤로가기 + 하단 버튼).
//
// 이동 중 페이지에서 쓰는 방법:
//   {strategyOpen && (
//     <StrategyOverlay
//       {...data}
//       onClose={() => setStrategyOpen(false)}
//       onConfirm={(strategy) => { 경로에 반영; setStrategyOpen(false) }}
//     />
//   )}
// 이동(navigate)은 하지 않음. 닫으면 이동 중 화면이 그대로 아래에 있다가 드러남.
// 화면 전체를 덮는 fixed 레이어지만 시트·버튼·뒤로가기 밖은 클릭이 아래 화면(지도)으로 통과함

type StrategyOverlayProps = StrategySheetData & {
  /** 처음 선택돼 있을 전략 id. 없으면 맨 위 전략 */
  defaultSelectedId?: string
  /** 시트를 내리거나, 손잡이·뒤로가기를 눌렀을 때 */
  onClose: () => void
  /** "이 전략으로 출발". 고른 전략을 그대로 넘겨줌 */
  onConfirm: (strategy: StrategyOption) => void
  onDetail?: () => void
}

/** 이만큼(px) 이상 내리면 시트가 닫힘 */
const DISMISS_DISTANCE = 80
/** 시트가 내려가는 애니메이션 시간(ms) */
const DISMISS_ANIMATION_MS = 200

export default function StrategyOverlay({
  defaultSelectedId,
  onClose,
  onConfirm,
  onDetail,
  ...sheetData
}: StrategyOverlayProps) {
  const { strategies } = sheetData
  const [selectedId, setSelectedId] = useState(defaultSelectedId ?? strategies[0]?.id ?? '')

  // 손잡이를 잡고 내리는 동안 시트가 손가락을 따라 내려감
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef<number | null>(null)
  const moved = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const close = () => {
    setDragY(window.innerHeight)
    timer.current = window.setTimeout(onClose, DISMISS_ANIMATION_MS)
  }

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    startY.current = e.clientY
    moved.current = false
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (startY.current === null) return
    const distance = Math.max(0, e.clientY - startY.current)
    if (distance > 4) moved.current = true
    setDragY(distance)
  }

  const handlePointerEnd = (e: PointerEvent<HTMLButtonElement>) => {
    if (startY.current === null) return
    const distance = e.clientY - startY.current
    startY.current = null
    setDragging(false)
    if (distance > DISMISS_DISTANCE) close()
    else setDragY(0)
  }

  // 손잡이를 그냥 누르거나 키보드로 누르면(드래그가 아니면) 같은 동작
  const handleHandleClick = () => {
    if (!moved.current) close()
  }

  const confirm = () => {
    const selected = strategies.find((option) => option.id === selectedId)
    if (selected) onConfirm(selected)
  }

  return (
    <div
      role="dialog"
      aria-label="이동 전략 비교"
      className="pointer-events-none fixed top-0 bottom-0 left-1/2 z-40 w-[390px] -translate-x-1/2"
    >
      {/* 위쪽 흐림 처리 (뒤로가기 버튼이 잘 보이게) */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[90px] bg-linear-to-b from-white/95 to-white/0"
      />

      <button
        type="button"
        onClick={close}
        aria-label="닫기"
        className="bg-surface-default shadow-elevation-1 pointer-events-auto absolute top-[54px] left-4 flex size-10 items-center justify-center rounded-full"
      >
        <BackIcon />
      </button>

      {/* 시트: 위에서 130px 아래부터 화면 끝까지. 안쪽만 스크롤됨 */}
      <div
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragging ? 'none' : `transform ${DISMISS_ANIMATION_MS}ms ease-out`,
        }}
        className="bg-surface-default shadow-elevation-2 pointer-events-auto absolute inset-x-0 top-[130px] bottom-0 flex flex-col rounded-t-3xl"
      >
        {/* 회색 손잡이. 잡기 쉽게 위쪽 28px 전체를 누르는 영역으로 씀 */}
        <button
          type="button"
          aria-label="전략 시트 내리기"
          onClick={handleHandleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          className="flex h-7 w-full shrink-0 touch-none items-start justify-center pt-2.5"
        >
          <span aria-hidden="true" className="bg-line-strong h-1 w-9 rounded-sm" />
        </button>

        {/* 아래 pb는 하단 버튼에 가려지지 않게 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[120px]">
          <StrategySheet {...sheetData} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="bg-surface-default border-line-default pointer-events-auto absolute inset-x-0 bottom-0 border-t px-5 pt-3 pb-[42px]">
        <div className="flex items-center gap-2">
          <Button variant="tertiary" onClick={onDetail} className="w-[120px] shrink-0">
            상세
          </Button>
          <Button onClick={confirm} className="min-w-0 flex-1">
            이 전략으로 출발
          </Button>
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <HomeIndicator />
        </div>
      </div>
    </div>
  )
}

// icon/back 22px (선 굵기 1.83)
function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.83333"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13.75 4.58333L7.33333 11L13.75 17.4167" />
    </svg>
  )
}
