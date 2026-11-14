// S-05 이동 중 (기능 2). 팝업 P-01~P-04는 components/popups
// 관련 기능: F-05-01~09
//
// 화면 4가지 (피그마)
// - 정류장으로 걷는 중 (MOVING)       → [도착했어요] = 정류장 도착 (WAITING)
// - 정류장에서 대기 중 (WAITING)       → [탔어요] BOARDED / [못 탔어요] BOARD_FAILED → P-02
// - 대기 중 + 화면 복귀 재계산 토스트  → 다른 앱에 갔다 돌아오면 3초 동안
// - 탑승 중 (BOARDED)                 → [도착했어요] = 마지막 구간이면 P-03, 아니면 환승 하차
//
// 팝업
// - P-01 경로 변경 제안: 재평가 결과가 SUGGEST일 때 (탑승 실패 제외)
// - P-02 탑승 실패 후 재평가: 재평가 결과에 failureOptions가 있을 때
// - P-03 이동 종료 확인: [종료] 또는 마지막 구간 [도착했어요]
// - P-04 정류장 도착 확인: 정류장 50m 안에 들어왔을 때 (정류장 좌표가 BE에 추가되면 연결)

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { endTrip } from '@/apis/trip'
import { readTripGeometry, transitLines } from '@/components/map/geometry'
import BoardingFailedPopup from '@/components/popups/BoardingFailedPopup'
import EndTripPopup from '@/components/popups/EndTripPopup'
import RouteChangePopup from '@/components/popups/RouteChangePopup'
import StopArrivalPopup from '@/components/popups/StopArrivalPopup'
import { useNow } from '@/hooks/useNow'
import { PATHS } from '@/routes/paths'

import RecalculatedToast from './components/RecalculatedToast'
import TripMap from './components/TripMap'
import TripSheet from './components/TripSheet'
import TripTopBar from './components/TripTopBar'
import { buildBoardingFailed, buildRouteChange, hasRouteChange } from './popupViews'
import { buildTripView, type TripAction } from './tripView'
import { useTripSession } from './useTripSession'

type ManualPopup = 'endTrip' | 'stopArrival' | null

/** 개발 확인용: /trip?mockPopup=end 또는 arrival 로 P-03, P-04를 바로 띄움 */
function initialManualPopup(): ManualPopup {
  if (!import.meta.env.DEV) return null
  const value = new URLSearchParams(window.location.search).get('mockPopup')
  if (value === 'end') return 'endTrip'
  if (value === 'arrival') return 'stopArrival'
  return null
}

export default function TripPage() {
  const navigate = useNavigate()
  const now = useNow()

  const session = useTripSession()
  const { activeQuery, trip, evaluation } = session

  const [manualPopup, setManualPopup] = useState<ManualPopup>(initialManualPopup)
  /** 이미 답한(또는 닫은) 재평가 결과. 같은 제안을 다시 띄우지 않음 */
  const [handledEvaluationId, setHandledEvaluationId] = useState<number | null>(null)
  const [ending, setEnding] = useState(false)

  // 진행 중인 이동이 없으면: 자동 종료된 요약이 있으면 요약으로, 아니면 홈으로
  useEffect(() => {
    const data = activeQuery.data
    if (!data || data.active) return
    if (data.pendingAutoSummaryTripId !== null) {
      navigate(`${PATHS.tripSummary}?tripId=${data.pendingAutoSummaryTripId}`, { replace: true })
    } else {
      navigate(PATHS.home, { replace: true })
    }
  }, [activeQuery.data, navigate])

  if (!trip) {
    return (
      <main className="relative flex min-h-[844px] items-center justify-center bg-[#f6f5f1]">
        <p className="text-label1 text-text-tertiary">
          {activeQuery.isError ? '이동 정보를 불러오지 못했어요' : '이동 정보를 불러오는 중이에요'}
        </p>
      </main>
    )
  }

  const view = buildTripView(trip, evaluation, session.statusOverride, now)

  // 재평가 결과로 뜨는 팝업 (아직 답하지 않은 결과만)
  const pending = evaluation && evaluation.evaluationId !== handledEvaluationId ? evaluation : null
  const boardingFailed =
    pending && view.phase === 'failed' ? buildBoardingFailed(pending, view, now) : null
  const routeChange =
    pending && hasRouteChange(pending) ? buildRouteChange(pending, view, now) : null

  const answer = async (accepted: boolean) => {
    if (!pending) return
    setHandledEvaluationId(pending.evaluationId)
    await session.decide(pending.evaluationId, accepted)
  }

  const finishTrip = async () => {
    setEnding(true)
    try {
      await endTrip(trip.tripId)
      navigate(`${PATHS.tripSummary}?tripId=${trip.tripId}`, { replace: true })
    } finally {
      setEnding(false)
    }
  }

  const handleAction = async (action: TripAction) => {
    const segmentId = view.currentSegmentId
    switch (action) {
      case 'arriveStop':
        await session.changeStatus('WAITING', segmentId)
        break
      case 'board':
        await session.changeStatus('BOARDED', segmentId)
        break
      case 'fail':
        // 재평가 응답의 failureOptions로 P-02가 뜸
        await session.changeStatus('BOARD_FAILED', segmentId)
        break
      case 'alight':
        // 환승하려고 내림
        await session.changeStatus('MOVING', segmentId)
        break
      case 'arriveDest':
        setManualPopup('endTrip')
        break
    }
  }

  const stopLabel = view.mapLabel.replace(/ 정류장$/, '').replace(/ · 내 위치$/, '')

  return (
    // 지도+시트 전체 화면. 폰 화면(브라우저 주소창 빼고)에 딱 맞춰서 버튼이 화면 밖으로 밀리지 않게 함
    // (레이아웃 기준 최소 844px를 쓰면 화면이 짧은 폰에서 시트 아래 버튼이 안 보였음)
    <main className="fixed inset-y-0 left-1/2 w-[390px] -translate-x-1/2 overflow-hidden">
      <TripMap
        label={view.mapLabel}
        riding={view.phase === 'riding'}
        geometry={readTripGeometry(trip.tripId, transitLines(trip.currentRoute.segments))}
      />
      <TripTopBar
        statusLabel={view.statusLabel}
        title={view.topTitle}
        onEnd={() => setManualPopup('endTrip')}
      />

      {session.toast && <RecalculatedToast message={session.toast} />}

      <TripSheet
        view={view}
        delayed={evaluation?.dataDelayed ?? false}
        notice={session.errorMessage}
        busy={session.busy}
        onAction={(action) => void handleAction(action)}
        onRefresh={() => void session.refresh()}
      />

      {manualPopup === 'endTrip' ? (
        <EndTripPopup
          onEnd={() => void finishTrip()}
          onDismiss={() => setManualPopup(null)}
          pending={ending}
        />
      ) : manualPopup === 'stopArrival' ? (
        <StopArrivalPopup
          stopName={stopLabel}
          pending={session.busy}
          onDismiss={() => setManualPopup(null)}
          onConfirm={() => {
            setManualPopup(null)
            void handleAction('arriveStop')
          }}
        />
      ) : boardingFailed ? (
        <BoardingFailedPopup
          {...boardingFailed}
          pending={session.busy}
          onSelect={(id) => {
            if (!pending) return
            setHandledEvaluationId(pending.evaluationId)
            // 다음 버스 기다리기는 boarding-failure/wait, 대안 경로는 decision(accepted: true)
            void (id === 'wait'
              ? session.waitNextBus()
              : session.decide(pending.evaluationId, true))
          }}
        />
      ) : routeChange ? (
        <RouteChangePopup
          {...routeChange}
          pending={session.busy}
          onKeep={() => void answer(false)}
          onAccept={() => void answer(true)}
        />
      ) : null}
    </main>
  )
}
