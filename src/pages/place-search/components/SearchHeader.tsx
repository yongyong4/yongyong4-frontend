type SearchHeaderProps = {
  query: string
  onQueryChange: (value: string) => void
  onClear?: () => void
  onBack?: () => void
  /** 출발지 표시 문구 (예: "현재 위치 · 동백역 부근") */
  origin: string
}

// 뒤로가기 + 검색 입력 + 출발지 한 줄
export default function SearchHeader({
  query,
  onQueryChange,
  onClear,
  onBack,
  origin,
}: SearchHeaderProps) {
  return (
    <header className="flex flex-col gap-2 pt-[51px] pr-4 pb-3 pl-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로 가기"
          className="flex size-10 shrink-0 items-center justify-center"
        >
          <BackIcon />
        </button>

        <div className="border-brand-primary bg-surface-default flex min-w-0 flex-1 items-center gap-2 rounded-xl border-[1.5px] py-3 pr-2.5 pl-3.5">
          <SearchIcon />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="도착지를 검색하세요"
            aria-label="장소 검색"
            enterKeyHint="search"
            autoFocus
            className="text-body1 placeholder:text-text-tertiary min-w-0 flex-1 bg-transparent font-medium outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={onClear}
              aria-label="검색어 지우기"
              className="bg-line-strong flex size-[18px] shrink-0 items-center justify-center rounded-full"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      <div className="text-note text-text-secondary flex items-center gap-2 pl-12">
        <span aria-hidden="true" className="bg-brand-primary size-2 shrink-0 rounded-full" />
        <p className="whitespace-pre">{`출발  ${origin}`}</p>
      </div>
    </header>
  )
}

// icon/back 24px
function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 5L8 12L15 19" />
    </svg>
  )
}

// icon/search 18px
function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-brand-strong shrink-0"
    >
      <path d="M13.5 8.25C13.5 11.1495 11.1495 13.5 8.25 13.5C5.35051 13.5 3 11.1495 3 8.25C3 5.35051 5.35051 3 8.25 3C11.1495 3 13.5 5.35051 13.5 8.25Z" />
      <path d="M15 15L12.375 12.375" />
    </svg>
  )
}

// icon/close 12px (흰색)
function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="white"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3L6 6M6 6L9 9M6 6L9 3M6 6L3 9" />
    </svg>
  )
}
