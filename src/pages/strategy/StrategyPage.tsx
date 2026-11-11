// S-03 전략 비교 (기능 1)
// 관련 기능: F-03-01~08
//
// 전략 비교는 이동 중 화면 위에 얹는 StrategyOverlay로 만들어져 있음.
// 이 페이지는 이동 중 페이지가 아직 아래에 없을 때 /strategy에서 단독으로 확인하는 용도.
// 이동 중 페이지(/trip)는 다른 담당자 페이지라 여기서는 닫거나 출발할 때 그리로 이동만 시킴.
// 이동 중 페이지가 StrategyOverlay를 직접 띄우면 이동 없이 같은 화면 위에서 열고 닫히므로 이 페이지는 필요 없어짐

import { useNavigate } from 'react-router'

import { PATHS } from '@/routes/paths'

import StrategyMapPreview from './components/StrategyMapPreview'
import StrategyOverlay from './components/StrategyOverlay'
import { Em, type StrategyOption } from './components/StrategySheet'

// TODO: 아래 값들은 전략 비교 API 연동 전 임시 데이터. 연동하면 응답을 StrategyOverlay props 모양으로 바꿔서 넘기면 됨
const MOCK_STRATEGIES: StrategyOption[] = [
  {
    id: 'move-forward',
    tag: { label: '추천', tone: 'recommend' },
    title: '앞 정류장에서 5003번 타기',
    level: '가능',
    timeLabel: '예상',
    time: '61분',
    detail: '도보 7분 · 예측 빈자리 6석',
    note: '한 정류장 앞(동백 쥬네브)에서 타면 자리가 더 여유 있어요',
  },
  {
    id: 'stay',
    tag: { label: '현재 경로', tone: 'current' },
    title: '그대로 5003번 타기',
    level: '주의',
    timeLabel: '실패 시',
    timeLabelTone: 'warn',
    time: '76분',
    detail: '성공 시 58분 · 다음 도착 18분 후',
    note: (
      <>
        여유 <Em>2</Em>분, 예측 빈자리 <Em>3</Em>석이라 못 탈 수 있어요
      </>
    ),
  },
  {
    id: 'switch-5005',
    title: '5005번으로 바꾸기',
    level: '가능',
    timeLabel: '예상',
    time: '64분',
    detail: '동백 호수공원 · 도보 6분',
    note: '15분 후 도착 · 예측 빈자리 21석',
  },
]

export default function StrategyPage() {
  const navigate = useNavigate()

  // replace로 갈아끼워서 이동 중 화면에서 뒤로가기를 눌러도 이 화면이 다시 열리지 않음
  const goTrip = () => navigate(PATHS.trip, { replace: true })

  // 고른 전략을 이동 중 화면으로 넘김. 경로에 실제로 반영하는 것은 이동 중 화면 담당 몫.
  // navigate state는 복사 가능한 값만 담을 수 있어서(React 요소 불가) id와 제목만 보냄
  const startWith = (strategy: StrategyOption) =>
    navigate(PATHS.trip, {
      replace: true,
      state: { strategy: { id: strategy.id, title: strategy.title } },
    })

  return (
    <div className="bg-surface-default relative min-h-[844px]">
      {/* 이동 중 화면 대신 보이는 임시 지도 */}
      <StrategyMapPreview />

      {/* 지도 위 라벨. 위치는 피그마 좌표 */}
      <p className="bg-surface-default text-caption1 text-brand-strong shadow-elevation-1 absolute top-[74px] left-[140px] rounded-lg px-2 py-1 font-medium whitespace-nowrap">
        앞 정류장 · 동백 쥬네브
      </p>

      <StrategyOverlay
        routeBadge={{ type: '광역', label: '5003' }}
        title="동백2차 → 강남역"
        baseAt="07:29"
        arrivesInMinutes={11}
        level="주의"
        levelLabel="탑승 주의"
        slack={{ value: '2분', level: '주의' }}
        seats={{ value: '3석', level: '주의' }}
        strategies={MOCK_STRATEGIES}
        onClose={goTrip}
        onConfirm={startWith}
      />
    </div>
  )
}
