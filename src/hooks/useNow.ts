import { useEffect, useState, useSyncExternalStore } from 'react'

import { DEMO_MODE, getDemoNow, subscribeDemoClock } from '@/apis/demoClock'

/**
 * 일정 간격으로 현재 시각을 다시 읽어서 "○분 후" 같은 표시가 저절로 줄어들게 함.
 * 시연 모드(VITE_DEMO_MODE=true)면 BE 가상 시각을 씀. 가상 시계는 고정형이라
 * BE가 시계를 넘길 때만 바뀜 (FE가 직접 시간을 올리지 않음)
 */
export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => Date.now())
  const demoNow = useSyncExternalStore(subscribeDemoClock, getDemoNow)

  useEffect(() => {
    if (DEMO_MODE) return
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return DEMO_MODE && demoNow !== null ? demoNow : now
}
