// S-06 이동 요약
// 관련 기능: F-06-01
// 주소: /trip/summary?tripId=101 (새로고침해도 다시 볼 수 있게 tripId를 주소에 둠)

import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'

import { getTripSummary, markSummarySeen } from '@/apis/trip'
import iconAlert from '@/assets/summary/icon-alert.svg'
import iconCheck from '@/assets/summary/icon-check.svg'
import iconCheckSmall from '@/assets/summary/icon-check-small.svg'
import iconClose from '@/assets/summary/icon-close.svg'
import iconCloseSmall from '@/assets/summary/icon-close-small.svg'
import historyStep from '@/assets/summary/history-step.svg'
import historyStepAlert from '@/assets/summary/history-step-alert.svg'
import Button from '@/components/common/Button'
import LineBadge from '@/components/common/LineBadge'
import { PATHS } from '@/routes/paths'
import { cn } from '@/utils/cn'

import { buildSummaryView, type BoardingRow, type HistoryRow } from './summaryView'

export default function TripSummaryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tripId = Number(searchParams.get('tripId'))
  const validId = Number.isInteger(tripId) && tripId > 0

  const summaryQuery = useQuery({
    queryKey: ['trip', 'summary', tripId],
    queryFn: () => getTripSummary(tripId),
    enabled: validId,
  })

  // 이용자가 확인을 끝냈을 때만 확인 완료 처리 (조회만으로는 하지 않음, 명세)
  const goHome = async () => {
    if (validId) {
      try {
        await markSummarySeen(tripId)
      } catch {
        // 실패해도 홈으로는 보냄. 다음에 홈에서 다시 요약을 보여줄 수 있음
      }
    }
    navigate(PATHS.home, { replace: true })
  }

  if (!validId || !summaryQuery.data) {
    return (
      <main className="flex min-h-[844px] flex-col items-center justify-center gap-4 bg-white">
        <p className="text-label1 text-text-tertiary">
          {!validId || summaryQuery.isError
            ? '이동 요약을 불러오지 못했어요'
            : '이동 요약을 불러오는 중이에요'}
        </p>
        {(!validId || summaryQuery.isError) && (
          <Button variant="tertiary" size="md" onClick={() => navigate(PATHS.home)}>
            홈으로
          </Button>
        )}
      </main>
    )
  }

  const view = buildSummaryView(summaryQuery.data)

  return (
    <main className="relative flex min-h-[844px] flex-col bg-white">
      <div className="flex justify-end pt-[51px] pr-3">
        <button
          type="button"
          aria-label="닫기"
          onClick={() => void goHome()}
          className="flex size-10 items-center justify-center"
        >
          <img alt="" src={iconClose} width={22} height={22} />
        </button>
      </div>

      <section className="flex flex-col items-start gap-1.5 px-5 pb-5">
        <div className="bg-level-ok-weak flex size-12 items-center justify-center rounded-3xl">
          <img alt="" src={iconCheck} width={26} height={26} />
        </div>
        <h1 className="text-title1 mt-1.5 font-semibold">{view.title}</h1>
        <p className="text-note text-text-tertiary">{view.sub}</p>

        <div className="bg-surface-sunken mt-2.5 flex w-full flex-col gap-2.5 rounded-[18px] px-[18px] py-4">
          {view.durationMin === null ? (
            // 기능명세서 F-06-01: 자동 종료인데 목적지 근처 도착 시각이 없으면 "기록 없음"
            <p className="text-body1 font-medium">총 소요 시간 기록 없음</p>
          ) : (
            <p className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-label1 text-text-secondary font-medium">총</span>
              <span className="text-display font-bold">{view.durationMin}</span>
              <span className="text-body1 font-medium">분 걸렸어요</span>
            </p>
          )}
          {view.comparison && (
            <p className="text-caption1 text-text-secondary flex items-start gap-1.5 font-medium">
              <img alt="" src={iconAlert} width={14} height={14} className="mt-px shrink-0" />
              {view.comparison}
            </p>
          )}
        </div>
      </section>

      {view.boardings.length > 0 && (
        <>
          <Divider />
          <section className="flex flex-col gap-3 p-5">
            <h2 className="text-title3 font-medium">구간별 탑승 결과</h2>
            {view.boardings.map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                <LineBadge type={row.badge.type} label={row.badge.label} />
                <p className="text-label1 min-w-0 flex-1 truncate font-medium">{row.name}</p>
                <BoardingResultPill result={row.result} />
              </div>
            ))}
          </section>
        </>
      )}

      <Divider />
      <section className="flex flex-col p-5">
        <h2 className="text-title3 font-medium">경로 변경 기록</h2>
        <ol className="mt-3 flex flex-col">
          {view.history.map((row, i) => (
            <HistoryItem key={row.key} row={row} last={i === view.history.length - 1} />
          ))}
        </ol>
      </section>

      <div className="sticky bottom-0 mt-auto bg-white px-5 pt-3 pb-[42px]">
        <Button fullWidth onClick={() => void goHome()}>
          홈으로
        </Button>
      </div>
    </main>
  )
}

function Divider() {
  return <div aria-hidden="true" className="bg-surface-sunken h-2 w-full shrink-0" />
}

function BoardingResultPill({ result }: { result: BoardingRow['result'] }) {
  if (result === 'none') {
    // 피그마에 없는 상태라 정보 없음 단계 색으로 표시
    return (
      <span className="text-caption1 bg-level-na-weak text-level-na shrink-0 rounded-md px-2 py-[3px] font-medium">
        기록 없음
      </span>
    )
  }
  const boarded = result === 'boarded'
  return (
    <span
      className={cn(
        'text-caption1 flex shrink-0 items-center gap-1 rounded-md px-2 py-[3px] font-medium',
        boarded ? 'bg-level-ok-weak text-level-ok' : 'bg-level-bad-weak text-level-bad',
      )}
    >
      <img alt="" src={boarded ? iconCheckSmall : iconCloseSmall} width={12} height={12} />
      {boarded ? '탔어요' : '못 탔어요'}
    </span>
  )
}

function HistoryItem({ row, last }: { row: HistoryRow; last: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <p className="text-caption1 text-text-tertiary w-[30px] shrink-0 font-medium">{row.time}</p>
      {row.alert ? (
        <img alt="" src={historyStepAlert} width={8} height={12} className="shrink-0" />
      ) : (
        // 마지막 줄은 아래 선 없이 점만 보이게 위쪽 12px만 잘라 씀
        <span className={cn('w-2 shrink-0 overflow-hidden', last ? 'h-3' : 'h-[42px]')}>
          <img alt="" src={historyStep} width={8} height={42} className="block max-w-none" />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <p className="text-label1 font-medium">{row.title}</p>
        <p className="text-note text-text-secondary">{row.sub}</p>
      </div>
    </li>
  )
}
