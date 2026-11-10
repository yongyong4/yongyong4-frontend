// O-01~03 온보딩 (선택, 불필요 시 삭제 예정)
// 관련 기능: F-O-01

import { useState } from 'react'
import { useNavigate } from 'react-router'

import { PATHS } from '@/routes/paths'

import Onboarding1 from './Onboarding1'
import Onboarding2 from './Onboarding2'
import Onboarding3 from './Onboarding3'
import type { OnboardingStep } from './components/OnboardingHeader'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<OnboardingStep>(1)

  const goNext = () => setStep((s) => (s < 3 ? ((s + 1) as OnboardingStep) : s))
  // 건너뛰기·시작하기 → 홈. 온보딩으로 뒤로가기 못 하게 replace
  const goHome = () => navigate(PATHS.home, { replace: true })

  if (step === 1) return <Onboarding1 onNext={goNext} onSkip={goHome} />
  if (step === 2) return <Onboarding2 onNext={goNext} onSkip={goHome} />
  return <Onboarding3 onStart={goHome} onStartWithoutLocation={goHome} />
}
