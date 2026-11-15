/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** 'true'면 trips API 대신 목 데이터. 안 정하면 개발 서버에서만 목 */
  readonly VITE_USE_MOCK?: string
  /** 'true'면 시연 모드. BE 가상 시계(GET /demo/clock)를 "지금"으로 씀 */
  readonly VITE_DEMO_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
