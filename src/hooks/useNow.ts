import { useEffect, useState } from 'react'

/** 일정 간격으로 현재 시각을 다시 읽어서 "○분 후" 같은 표시가 저절로 줄어들게 함 */
export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
