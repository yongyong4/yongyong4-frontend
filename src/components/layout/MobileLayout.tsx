import { Outlet } from 'react-router'

// 모바일 웹 기준 (IA 10-1 확정). PC에서 열어도 휴대폰 폭으로 가운데에 보여줌
export default function MobileLayout() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-white shadow-sm">
      <Outlet />
    </div>
  )
}
