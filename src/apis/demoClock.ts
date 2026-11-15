// 시연용 가상 시계 (BE: GET /api/v1/demo/clock)
// VITE_DEMO_MODE=true일 때만 동작. 운영에서는 아무것도 하지 않고 기기 시각을 그대로 씀
//
// - BE 가상 시계는 고정형이라 FE가 시간을 직접 올리지 않음. 조회한 virtualNow를 그대로 "지금"으로 씀
// - 앱 시작, 화면 복귀, 재평가 이후, 그리고 몇 초마다 다시 조회함
// - 시각이 바뀌면(시연 중 BE가 시계를 넘기면) 경로 분석·전략 비교·이동 중 정보를 다시 불러옴

import { request } from '@/apis/client'
import { queryClient } from '@/apis/queryClient'

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

/** 시연 중 BE가 시계를 넘긴 걸 알아채는 간격 */
const POLL_INTERVAL_MS = 3_000

type DemoClockResponse = { demo: boolean; virtualNow: string }

let virtualNow: number | null = null
const listeners = new Set<() => void>()

/** 가상 시각(ms). 데모 모드가 아니거나 아직 못 받았으면 null */
export function getDemoNow(): number | null {
  return virtualNow
}

/** 가상 시각이 바뀔 때 알림 받기. 해제 함수를 돌려줌 (useSyncExternalStore 모양) */
export function subscribeDemoClock(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

let inFlight: Promise<void> | null = null

/** 가상 시각을 다시 조회. 바뀌었으면 화면 데이터도 다시 불러옴 */
export function refreshDemoClock(): Promise<void> {
  if (!DEMO_MODE) return Promise.resolve()
  inFlight ??= request<DemoClockResponse>('/v1/demo/clock')
    .then((res) => {
      const next = new Date(res.virtualNow).getTime()
      if (!res.demo || Number.isNaN(next) || next === virtualNow) return
      const first = virtualNow === null
      virtualNow = next
      listeners.forEach((listener) => listener())
      // 처음 받은 건 시작값이라 다시 불러올 필요 없음. 시연 중 시계를 넘겼을 때만
      if (!first) {
        void queryClient.invalidateQueries({ queryKey: ['routes', 'analysis'] })
        void queryClient.invalidateQueries({ queryKey: ['strategies'] })
        void queryClient.invalidateQueries({ queryKey: ['trip', 'active'] })
      }
    })
    .catch(() => {
      // 조회 실패면 직전 가상 시각을 그대로 씀 (다음 주기에 다시 시도)
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

/** 앱 시작 때 한 번 호출 (main.tsx). 데모 모드가 아니면 아무것도 안 함 */
export function startDemoClock() {
  if (!DEMO_MODE) return
  void refreshDemoClock()
  window.setInterval(() => {
    if (document.visibilityState === 'visible') void refreshDemoClock()
  }, POLL_INTERVAL_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refreshDemoClock()
  })
}

/** 지금 시각(ms). 데모 모드면 가상 시각, 아니면 기기 시각. 컴포넌트 밖 계산용 */
export function currentTime(): number {
  return DEMO_MODE && virtualNow !== null ? virtualNow : Date.now()
}
