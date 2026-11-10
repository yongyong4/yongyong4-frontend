// S-07 서비스 안내 (선택)
// 관련 기능: F-07-01

import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'

import LevelPill from '@/components/common/LevelPill'
import HomeIndicator from '@/components/layout/HomeIndicator'
import { PATHS } from '@/routes/paths'
import type { StageWithUnknown } from '@/types/stage'

type StageGuide = {
  title: string
  question: string
  rules: { level: StageWithUnknown; text: string }[]
}

// 안내 문구. 단계 기준은 기능명세서 2-1 기준 값이 확정되면 여기만 고치면 됨
const STAGE_GUIDES: StageGuide[] = [
  {
    title: '여유시간',
    question: '버스보다 먼저 도착하나요?',
    rules: [
      { level: '가능', text: '5분 이상' },
      { level: '주의', text: '2~5분' },
      { level: '위험', text: '2분 미만' },
    ],
  },
  {
    title: '예측 빈자리',
    question: '탈 때 자리가 있을까요?',
    rules: [
      { level: '가능', text: '5석 이상' },
      { level: '주의', text: '1~4석' },
      { level: '위험', text: '0석' },
      { level: '정보 없음', text: '좌석 정보 없음' },
    ],
  },
]

const STAGE_SUMMARY =
  '버스 구간마다 여유시간과 예측 빈자리의 단계를 파악해,\n탑승 가능성을 예측 제시해드립니다.'

const FAQS = [
  {
    title: '왜 확률(%)은 보여주지 않나요?',
    body: '예측이 충분히 검증되기 전에는 숫자가 실제보다 정확해 보일 수 있어서 단계로만 보여드려요. 또한 탑승하려는 정류장의 대기 인원에 따라 빈자리가 있어도 못 탈 수 있어요.',
  },
  {
    title: '데이터는 어디서 오나요?',
    body: '경기도 버스정보(GBIS)를 2분마다 받아요. 모든 화면에 기준 시각을 함께 보여주고, 4분 넘게 지난 정보는 "정보 지연"으로 표시해요.',
  },
]

export default function GuidePage() {
  const navigate = useNavigate()
  const location = useLocation()

  // 주소창으로 바로 들어와서 되돌아갈 기록이 없으면 홈으로
  const goBack = () => {
    if (location.key === 'default') navigate(PATHS.home, { replace: true })
    else navigate(-1)
  }

  return (
    <div className="bg-surface-sunken flex min-h-[844px] flex-col">
      <div className="flex flex-col gap-3 px-4 pb-10">
        {/* 피그마에서 내용 전체가 8.5px 위로 올라가 있어서 51px이 아니라 42.5px */}
        <header className="flex items-center gap-1 pt-[42.5px] pr-1">
          <button
            type="button"
            onClick={goBack}
            aria-label="뒤로 가기"
            className="flex size-10 shrink-0 items-center justify-center"
          >
            <BackIcon />
          </button>
          <h1 className="text-title3 font-medium">서비스 안내</h1>
        </header>

        <GuideCard title="단계는 이렇게 정해요">
          {STAGE_GUIDES.map((guide) => (
            <div
              key={guide.title}
              className="bg-surface-sunken flex flex-col gap-2 rounded-[14px] px-3.5 py-3"
            >
              <p className="text-caption1 text-text-secondary font-medium">
                <span className="text-note font-bold">{guide.title}</span> · {guide.question}
              </p>
              {guide.rules.map((rule) => (
                <div key={rule.level} className="flex items-center gap-2.5">
                  <LevelPill level={rule.level} />
                  <span className="text-note">{rule.text}</span>
                </div>
              ))}
            </div>
          ))}

          <div className="bg-brand-weak text-brand-strong text-caption1 flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-medium">
            <InfoIcon />
            <p className="whitespace-pre-line">{STAGE_SUMMARY}</p>
          </div>
        </GuideCard>

        {FAQS.map((faq) => (
          <GuideCard key={faq.title} title={faq.title}>
            <p className="text-note text-text-secondary">{faq.body}</p>
          </GuideCard>
        ))}
      </div>

      {/* 스크롤해도 화면 맨 아래에 붙어 있게 (피그마와 같음) */}
      <div className="sticky bottom-0 z-30 mt-auto">
        <HomeIndicator />
      </div>
    </div>
  )
}

// 흰색 안내 카드
function GuideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-surface-default flex flex-col gap-3 rounded-[20px] p-[18px]">
      <h2 className="text-label1 font-semibold">{title}</h2>
      {children}
    </section>
  )
}

// icon/back 24px
function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 5L8 12L15 19" />
    </svg>
  )
}

// icon/info 16px (선 굵기 1.33)
function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" />
      <path d="M8 7.33333V10.6667M8 5.33333H8.00667" />
    </svg>
  )
}
