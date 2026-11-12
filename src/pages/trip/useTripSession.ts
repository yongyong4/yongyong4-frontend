// S-05 이동 중 화면의 데이터와 동작
// - 진행 중인 이동 불러오기 (F-01-05)
// - 재평가: 처음 들어왔을 때, 2분마다, 화면 복귀, 새로고침, 상태 변경 직후 (F-05-02)
// - 상태 버튼 (F-05-01)

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import { changeTripStatus, decideSuggestion, getActiveTrip, reevaluateTrip } from '@/apis/trip'
import { RECALCULATED_TOAST_MS, REEVALUATE_INTERVAL_MS } from '@/constants/config'
import { MESSAGES } from '@/constants/messages'
import type {
  ChangeableTripStatus,
  ReevaluateResponse,
  TriggerType,
  TripStatusCode,
} from '@/types/tripApi'
import { formatTime } from '@/utils/time'

export const ACTIVE_TRIP_QUERY_KEY = ['trip', 'active'] as const

export function useTripSession({ justStarted }: { justStarted: boolean }) {
  const activeQuery = useQuery({ queryKey: ACTIVE_TRIP_QUERY_KEY, queryFn: getActiveTrip })
  const tripId = activeQuery.data?.trip?.tripId ?? null

  const [evaluation, setEvaluation] = useState<ReevaluateResponse | null>(null)
  /** 상태 변경 직후, 재평가 응답이 오기 전까지 화면에 먼저 반영할 상태 */
  const [statusOverride, setStatusOverride] = useState<TripStatusCode | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const reevaluate = useCallback(
    async (triggerType: TriggerType, { showToast = false } = {}) => {
      if (tripId === null) return null
      try {
        // TODO: 위치 권한이 있으면 currentPosition에 현재 좌표 넣기 (F-05-07, 좌표는 저장 안 함)
        const result = await reevaluateTrip(tripId, { triggerType, currentPosition: null })
        setEvaluation(result)
        setStatusOverride(null)
        setErrorMessage(null)
        if (showToast) setToast(MESSAGES.recalculated(formatTime(result.evaluatedAt) ?? ''))
        return result
      } catch {
        // 실패하면 직전 결과를 그대로 두고 다음 주기에 다시 시도
        setErrorMessage(MESSAGES.updateFailed)
        return null
      }
    },
    [tripId],
  )

  // 최신 reevaluate를 타이머·이벤트에서 쓰기 위한 ref
  const reevaluateRef = useRef(reevaluate)
  useEffect(() => {
    reevaluateRef.current = reevaluate
  }, [reevaluate])

  // 처음 들어왔을 때 한 번
  useEffect(() => {
    if (tripId === null) return
    void reevaluateRef.current(justStarted ? 'INITIAL' : 'RESUME')
  }, [tripId, justStarted])

  // 화면이 보이는 동안 2분마다, 다른 앱에 갔다가 돌아오면 바로 (토스트 표시)
  useEffect(() => {
    if (tripId === null) return
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void reevaluateRef.current('AUTO')
    }, REEVALUATE_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void reevaluateRef.current('RESUME', { showToast: true })
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [tripId])

  // 토스트는 잠깐만
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), RECALCULATED_TOAST_MS)
    return () => window.clearTimeout(id)
  }, [toast])

  const refresh = useCallback(async () => {
    setBusy(true)
    await reevaluate('REFRESH')
    setBusy(false)
  }, [reevaluate])

  /** 상태 버튼. 성공하면 바로 재평가까지 함 */
  const changeStatus = useCallback(
    async (status: ChangeableTripStatus, segmentId: number | null) => {
      if (tripId === null) return null
      setBusy(true)
      try {
        const res = await changeTripStatus(tripId, { status, segmentId, plateNo: null })
        setStatusOverride(res.currentStatus)
        return await reevaluate('STATUS_CHANGE')
      } catch {
        setErrorMessage(MESSAGES.updateFailed)
        return null
      } finally {
        setBusy(false)
      }
    },
    [tripId, reevaluate],
  )

  const queryClient = useQueryClient()

  /** P-01 수락·무시, P-02 선택 (탑승 실패 때 false = 다음 버스 기다리기) */
  const decide = useCallback(
    async (evaluationId: number, accepted: boolean) => {
      if (tripId === null) return
      setBusy(true)
      try {
        const res = await decideSuggestion(tripId, evaluationId, accepted)
        setStatusOverride(res.currentStatus)
        // 수락하면 경로가 바뀌므로 구간을 다시 불러옴
        if (accepted) await queryClient.invalidateQueries({ queryKey: ACTIVE_TRIP_QUERY_KEY })
        await reevaluate('STATUS_CHANGE')
      } catch {
        setErrorMessage(MESSAGES.updateFailed)
      } finally {
        setBusy(false)
      }
    },
    [tripId, reevaluate, queryClient],
  )

  return {
    activeQuery,
    decide,
    trip: activeQuery.data?.trip ?? null,
    evaluation,
    statusOverride,
    busy,
    toast,
    errorMessage,
    refresh,
    changeStatus,
  }
}
