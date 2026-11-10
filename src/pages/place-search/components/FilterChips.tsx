import { cn } from '@/utils/cn'

type FilterOption<T extends string> = {
  key: T
  label: string
}

type FilterChipsProps<T extends string> = {
  options: FilterOption<T>[]
  value: T
  onChange: (key: T) => void
}

// 검색 결과 종류 필터 (전체 / 장소 / 정류장 / 역)
export default function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label="검색 종류" className="flex items-center gap-2 px-4 pb-2.5">
      {options.map((option) => {
        const selected = option.key === value
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.key)}
            className={cn(
              'text-caption1 rounded-full px-3 py-1.5 font-medium',
              selected
                ? 'bg-text-primary text-text-inverse'
                : 'bg-surface-sunken text-text-secondary',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
