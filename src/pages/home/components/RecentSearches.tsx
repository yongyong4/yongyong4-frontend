type RecentSearchesProps = {
  items: string[]
  onSelect?: (name: string) => void
  onClear?: () => void
}

// 최근 검색한 장소 칩 목록
export default function RecentSearches({ items, onSelect, onClear }: RecentSearchesProps) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-title3 font-medium">최근 검색</h2>
        <button type="button" onClick={onClear} className="text-note text-text-tertiary">
          전체 삭제
        </button>
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-2">
        {items.map((name) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => onSelect?.(name)}
              className="bg-surface-default border-line-default text-label1 flex items-center gap-1.5 rounded-full border px-3 py-2 font-medium"
            >
              <ClockIcon />
              {name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

// icon/clock 14px
function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-text-tertiary shrink-0"
    >
      <path d="M12.25 7C12.25 9.8995 9.8995 12.25 7 12.25C4.1005 12.25 1.75 9.8995 1.75 7C1.75 4.1005 4.1005 1.75 7 1.75C9.8995 1.75 12.25 4.1005 12.25 7Z" />
      <path d="M7 4.08333V7L8.75 8.16667" />
    </svg>
  )
}
