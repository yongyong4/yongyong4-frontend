// 시각 표시·계산 공통 함수. BE 시각은 ISO 8601 문자열로 옴

const TIME_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Seoul',
})

/** "07:33" 형식. 값이 없으면 null */
export function formatTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return TIME_FORMAT.format(date)
}

const DATE_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Seoul',
})

/** "10월 30일" 형식 */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : DATE_FORMAT.format(date)
}

/** 지금부터 몇 분 남았는지 (지났으면 0). 값이 없으면 null */
export function minutesUntil(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return null
  return Math.max(0, Math.round((time - now) / 60_000))
}

/** 두 시각 사이 분 (b - a). 하나라도 없으면 null */
export function minutesBetween(
  a: string | null | undefined,
  b: string | null | undefined,
): number | null {
  if (!a || !b) return null
  const diff = new Date(b).getTime() - new Date(a).getTime()
  return Number.isNaN(diff) ? null : Math.round(diff / 60_000)
}
