import refreshInverse from '@/assets/trip/icon-refresh-inverse.svg'

type RecalculatedToastProps = {
  message: string
}

// 피그마 "재계산 토스트". 화면으로 돌아와 다시 계산했을 때 잠깐 보여줌 (F-05-03)
export default function RecalculatedToast({ message }: RecalculatedToastProps) {
  return (
    <div
      role="status"
      className="shadow-elevation-2 absolute top-[341px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[rgba(25,31,40,0.92)] py-2.5 pr-4 pl-3.5"
    >
      <span className="relative size-4 shrink-0">
        <span className="absolute inset-[0_0_-9.09%_0]">
          <img
            alt=""
            src={refreshInverse}
            className="absolute inset-0 block size-full max-w-none"
          />
        </span>
      </span>
      <p className="text-label1 text-text-inverse font-medium whitespace-nowrap">{message}</p>
    </div>
  )
}
