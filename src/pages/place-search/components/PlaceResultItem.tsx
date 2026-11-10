export type PlaceKind = 'place' | 'busStop' | 'station'

export type PlaceResult = {
  id: string
  kind: PlaceKind
  name: string
  /** 주소 또는 정류장이면 지나는 노선 등 보조 설명 */
  description: string
  /** 현재 위치에서의 거리 표시 문구 (예: "24km") */
  distance: string
  /** 역이면 지나는 호선. color는 배지 배경색 (예: "#3db04a") */
  lines?: { label: string; color: string }[]
}

type PlaceResultItemProps = {
  place: PlaceResult
  /** 검색어. 이름 안에서 일치하는 부분을 초록색으로 표시 */
  query: string
  onSelect?: (place: PlaceResult) => void
}

// 검색 결과 한 줄
export default function PlaceResultItem({ place, query, onSelect }: PlaceResultItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(place)}
        className="border-line-default flex w-full items-center gap-3 border-b py-3.5 text-left"
      >
        <span className="bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-full">
          <KindIcon kind={place.kind} />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="flex items-center gap-1.5">
            <span className="text-label1 font-semibold">
              <Highlight text={place.name} query={query} />
            </span>
            {place.lines?.map((line) => (
              <span
                key={line.label}
                style={{ backgroundColor: line.color }}
                className="text-micro text-text-inverse rounded px-[5px] py-px font-medium"
              >
                {line.label}
              </span>
            ))}
          </span>
          <span className="text-note text-text-tertiary">{place.description}</span>
        </span>

        <span className="text-caption1 text-text-tertiary shrink-0 font-medium">
          {place.distance}
        </span>
      </button>
    </li>
  )
}

// 이름 중 검색어와 처음 일치하는 부분만 강조
function Highlight({ text, query }: { text: string; query: string }) {
  const keyword = query.trim()
  const start = keyword ? text.toLowerCase().indexOf(keyword.toLowerCase()) : -1
  if (start < 0) return <>{text}</>

  const end = start + keyword.length
  return (
    <>
      {text.slice(0, start)}
      <span className="text-brand-strong">{text.slice(start, end)}</span>
      {text.slice(end)}
    </>
  )
}

function KindIcon({ kind }: { kind: PlaceKind }) {
  if (kind === 'station') return <TrainIcon />
  if (kind === 'busStop') return <BusIcon />
  return <FlagIcon />
}

const ICON_PROPS = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 18,
  height: 18,
  viewBox: '0 0 18 18',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

// icon/train 18px
function TrainIcon() {
  return (
    <svg {...ICON_PROPS} className="text-text-secondary">
      <path d="M6.75 2.25H11.25C12.9069 2.25 14.25 3.59315 14.25 5.25V9.75C14.25 11.4069 12.9069 12.75 11.25 12.75H6.75C5.09315 12.75 3.75 11.4069 3.75 9.75V5.25C3.75 3.59315 5.09315 2.25 6.75 2.25Z" />
      <path d="M3.75 7.5H14.25M6 15.75L7.5 12.75M12 15.75L10.5 12.75" />
    </svg>
  )
}

// icon/bus 18px (광역버스 빨강)
function BusIcon() {
  return (
    <svg {...ICON_PROPS} className="text-transit-express">
      <path d="M6 2.25H12C13.2426 2.25 14.25 3.25736 14.25 4.5V11.25C14.25 12.4926 13.2426 13.5 12 13.5H6C4.75736 13.5 3.75 12.4926 3.75 11.25V4.5C3.75 3.25736 4.75736 2.25 6 2.25Z" />
      <path d="M3.75 8.25H14.25M6 15.75V13.5M12 15.75V13.5" />
    </svg>
  )
}

// icon/flag 18px
function FlagIcon() {
  return (
    <svg {...ICON_PROPS} className="text-text-secondary">
      <path d="M3.75 15.75V9M3.75 9V3H12L10.5 6L12 9H3.75Z" />
    </svg>
  )
}
