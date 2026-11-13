// 시범 운영 지역 안내
export default function TrialNotice() {
  return (
    <aside className="bg-brand-weak text-brand-strong text-note mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5">
      <InfoIcon />
      <p className="min-w-0 flex-1">지금은 용인 동백 지역에서 시범 운영 중이에요</p>
    </aside>
  )
}

// icon/info 16px
function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
