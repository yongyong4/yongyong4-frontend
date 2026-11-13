import { getDeviceId } from '@/utils/storage'

// 환경 변수가 없거나 빈 값이면 /api (Vercel에 빈 값으로 넣으면 /v1/...로 불려서 HTML이 돌아옴)
const BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, body: unknown) {
    super(`API 요청 실패 (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

// 모든 BE 요청은 이 함수를 거침. 화면별 API 함수는 apis/ 아래에 따로 만들기
// X-Device-Id: trips API에 필수 (F-01-05, F-03-07). 다른 API에 붙여도 문제없어서 모든 요청에 붙임
export async function request<T>(path: string, { body, headers, ...init }: RequestOptions = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'X-Device-Id': getDeviceId(),
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null as T

  // 주소 설정이 틀리면 BE 대신 사이트 HTML(200)이 와서 화면이 계속 "불러오는 중"에 멈춤 → 에러로 처리
  const isJson = res.headers.get('content-type')?.includes('application/json') ?? false
  const data = isJson ? await res.json().catch(() => null) : null
  if (!res.ok) throw new ApiError(res.status, data)
  if (!isJson) throw new ApiError(res.status, 'JSON이 아닌 응답 (API 주소 설정 확인)')
  return data as T
}
