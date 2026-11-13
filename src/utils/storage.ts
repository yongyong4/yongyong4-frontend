// 기기에만 저장하는 값 (NFR-09: 서버 저장 없음)
// 시크릿 모드 등에서 localStorage가 막혀도 화면이 깨지지 않게 try/catch로 감쌈

const KEYS = {
  onboardingSeen: 'yy4:onboarding-seen',
  recentSearches: 'yy4:recent-searches',
  deviceId: 'yy4:device-id',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 실패는 무시 (기능은 계속 동작)
  }
}

/** F-O-01 온보딩 본 기록 */
export const onboardingStorage = {
  isSeen: () => read(KEYS.onboardingSeen, false),
  markSeen: () => write(KEYS.onboardingSeen, true),
}

/** F-01-05, F-03-07 익명 기기 ID. 없으면 새로 만듦 */
export function getDeviceId() {
  const saved = read<string | null>(KEYS.deviceId, null)
  if (saved) return saved

  // randomUUID는 HTTPS·localhost에서만 있음 (휴대폰에서 http로 접속하면 없음)
  // BE는 UUID 모양이 아니면 400을 줘서, 없을 때도 UUID 모양으로 만듦
  const id = crypto.randomUUID?.() ?? fallbackUuid()
  write(KEYS.deviceId, id)
  return id
}

/** UUID v4 모양 문자열 (getRandomValues는 http에서도 동작) */
function fallbackUuid() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export const storage = { read, write, KEYS }
