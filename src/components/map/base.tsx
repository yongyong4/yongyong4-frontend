import { useEffect, useRef, useState } from 'react'

import { geometryPoints, type MapStop, type RouteGeometry } from './geometry'
import {
  loadKakaoMaps,
  type KakaoMap,
  type KakaoMaps,
  type KakaoOverlay,
  type MapPoint,
} from './kakao'

export type MapLabel = {
  point: MapPoint
  text: string
  /** brand: 초록 글자 (앞 정류장 등) / default: 검정 글자 */
  tone?: 'brand' | 'default'
}

type MapBaseProps = {
  /** 정류장 + 경로선 */
  geometry?: RouteGeometry | null
  /** 내 위치 (초록 점) */
  myLocation?: MapPoint | null
  /** 지점 옆 이름표 */
  labels?: MapLabel[]
  /**
   * 지도 위에 시트·상단바가 덮는 경우, 가려지지 않는 세로 구간(px, 지도 위쪽 기준).
   * 경로가 이 구간 안에 들어오게 맞춤. 예: 위 120 ~ 아래 313
   */
  visibleTop?: number
  visibleBottom?: number
  /**
   * 지도가 맞출 좌표. 주면 경로 전체 대신 이 좌표들이 보이게 맞춤 (경로선은 화면 밖으로 이어짐).
   * 타는 정류장 주변을 크게 보여줄 때 사용
   */
  focus?: MapPoint[] | null
  /** 경로도 내 위치도 없을 때 보여줄 곳 */
  fallbackCenter?: MapPoint
}

// 시연 지역(용인 동백역)
const DEFAULT_CENTER: MapPoint = { x: 127.1459, y: 37.2699 }
/** 지도가 최소한 보여줄 범위 (도 단위, 0.0035도 ≒ 400m) */
const MIN_SPAN = 0.0035

const COLORS = {
  bus: '#F2A900',
  subway: '#8B95A1',
  walk: '#4CB282',
  brand: '#4CB282',
  brandText: '#2A7D57',
  text: '#191F28',
  red: '#E60012',
  gray: '#8B95A1',
}

// 카카오맵 공통 지도. 부모 크기를 꽉 채움 (부모에 위치·크기 지정 필요)
// 키가 없거나 불러오지 못하면 바탕색과 안내 문구만 보임
export default function MapBase({
  geometry,
  myLocation,
  labels = [],
  visibleTop = 0,
  focus,
  visibleBottom,
  fallbackCenter = DEFAULT_CENTER,
}: MapBaseProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<KakaoMap | null>(null)
  const mapsRef = useRef<KakaoMaps | null>(null)
  const overlaysRef = useRef<KakaoOverlay[]>([])
  const fittedRef = useRef<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  // 지도 만들기 (한 번)
  useEffect(() => {
    let cancelled = false
    loadKakaoMaps().then(
      (maps) => {
        const el = containerRef.current
        if (cancelled || !el || mapRef.current) return
        mapsRef.current = maps
        mapRef.current = new maps.Map(el, {
          center: new maps.LatLng(fallbackCenter.y, fallbackCenter.x),
          level: 5,
        })
        setStatus('ready')
      },
      () => {
        if (!cancelled) setStatus('error')
      },
    )
    return () => {
      cancelled = true
    }
    // 처음 위치만 쓰고 이후에는 경로에 맞춰 움직이므로 다시 만들지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 시트 높이가 바뀌는 등 크기가 바뀌면 지도도 다시 그림
  useEffect(() => {
    const el = containerRef.current
    if (!el || status !== 'ready') return
    const observer = new ResizeObserver(() => mapRef.current?.relayout())
    observer.observe(el)
    return () => observer.disconnect()
  }, [status])

  const geometryKey = JSON.stringify(geometry ?? null)
  const focusKey = JSON.stringify(focus ?? null)
  const labelsKey = JSON.stringify(labels)
  const myKey = myLocation ? `${myLocation.x.toFixed(5)},${myLocation.y.toFixed(5)}` : ''

  // 정류장·선·이름표·내 위치 그리기
  useEffect(() => {
    const map = mapRef.current
    const maps = mapsRef.current
    if (status !== 'ready' || !map || !maps) return

    overlaysRef.current.forEach((o) => o.setMap(null))
    const added: KakaoOverlay[] = []
    const at = (p: MapPoint) => new maps.LatLng(p.y, p.x)

    for (const path of geometry?.paths ?? []) {
      if (path.points.length < 2) continue
      const linePath = path.points.map(at)
      if (path.kind === 'walk') {
        added.push(
          new maps.Polyline({
            map,
            path: linePath,
            strokeWeight: 5,
            strokeColor: COLORS.walk,
            strokeOpacity: 1,
            strokeStyle: 'shortdot',
            zIndex: 2,
          }),
        )
        continue
      }
      // 흰 외곽선 위에 색 선 (피그마 경로선)
      added.push(
        new maps.Polyline({
          map,
          path: linePath,
          strokeWeight: 11,
          strokeColor: '#FFFFFF',
          strokeOpacity: 1,
          zIndex: 1,
        }),
        new maps.Polyline({
          map,
          path: linePath,
          strokeWeight: 6,
          strokeColor: path.kind === 'bus' ? COLORS.bus : COLORS.subway,
          strokeOpacity: 1,
          zIndex: 2,
        }),
      )
    }

    for (const stop of geometry?.stops ?? []) {
      added.push(
        new maps.CustomOverlay({
          map,
          position: at(stop),
          content: stopElement(stop),
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 3,
        }),
      )
    }

    if (myLocation) {
      added.push(
        new maps.CustomOverlay({
          map,
          position: at(myLocation),
          content: myLocationElement(),
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 4,
        }),
      )
    }

    for (const label of labels) {
      added.push(
        new maps.CustomOverlay({
          map,
          position: at(label.point),
          content: labelElement(label),
          // 지점 오른쪽에 붙임 (labelElement 안에 왼쪽 여백 있음)
          xAnchor: 0,
          yAnchor: 0.5,
          zIndex: 5,
        }),
      )
    }

    overlaysRef.current = added
    // 값이 같으면 다시 그리지 않도록 문자열 키로 비교
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, geometryKey, labelsKey, myKey])

  // 경로가 바뀌면 경로 전체가 보이게 맞춤. 내 위치가 움직일 때는 다시 맞추지 않음
  // (경로가 없으면 처음 받은 내 위치로 한 번만 이동, 내 위치도 없으면 기본 위치(동백역))
  // 한 점뿐이어도 경로처럼 "시트에 안 가려지는 구간"의 한가운데에 오도록 같은 방식(setBounds)으로 맞춤
  useEffect(() => {
    const map = mapRef.current
    const maps = mapsRef.current
    const el = containerRef.current
    if (status !== 'ready' || !map || !maps || !el) return

    // focus가 있으면 그 좌표에, 없으면 경로 전체에 맞춤
    const points = focus && focus.length > 0 ? focus : geometryPoints(geometry)
    const target =
      points.length > 0
        ? focus && focus.length > 0
          ? `focus:${focusKey}`
          : geometryKey
        : myLocation
          ? 'my-location'
          : 'fallback'
    if (fittedRef.current === target) return
    fittedRef.current = target

    const all = points.length > 0 ? points : [myLocation ?? fallbackCenter]

    const bounds = new maps.LatLngBounds()
    all.forEach((p) => bounds.extend(new maps.LatLng(p.y, p.x)))
    // 점이 하나이거나 서로 아주 가까워도 너무 확대되지 않게, 가운데 기준으로 최소 범위(주변 약 400m)를 보장함
    const cx = all.reduce((sum, p) => sum + p.x, 0) / all.length
    const cy = all.reduce((sum, p) => sum + p.y, 0) / all.length
    bounds.extend(new maps.LatLng(cy - MIN_SPAN, cx - MIN_SPAN))
    bounds.extend(new maps.LatLng(cy + MIN_SPAN, cx + MIN_SPAN))
    const height = el.clientHeight
    const bottom = visibleBottom ? Math.max(0, height - visibleBottom) : 0
    map.setBounds(bounds, visibleTop + 24, 40, bottom + 24, 40)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, geometryKey, focusKey, myKey])

  return (
    <div className="absolute inset-0 bg-[#f6f5f1]">
      <div ref={containerRef} className="absolute inset-0" aria-label="경로 지도" role="region" />
      {status === 'error' && (
        <p
          role="status"
          style={{ top: visibleTop + 16 }}
          className="text-note text-text-tertiary absolute inset-x-0 text-center"
        >
          지도를 불러오지 못했어요
        </p>
      )}
    </div>
  )
}

// ── 지도 위 표시 (카카오 CustomOverlay에 넣는 DOM) ─────────────────────
// 글자는 textContent로만 넣어서 장소 이름에 HTML이 섞여도 실행되지 않게 함

function circle(size: number, fill: string, border: string, borderWidth: number) {
  const el = document.createElement('div')
  Object.assign(el.style, {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    background: fill,
    border: `${borderWidth}px solid ${border}`,
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
  })
  return el
}

function stopElement(stop: MapStop): HTMLElement {
  let el: HTMLElement
  switch (stop.kind) {
    case 'board':
      el = circle(20, '#FFFFFF', COLORS.red, 3)
      break
    case 'moveTo':
      el = circle(20, COLORS.brand, '#FFFFFF', 3)
      break
    case 'destination':
      el = circle(18, COLORS.text, '#FFFFFF', 3)
      break
    default:
      el = circle(14, '#FFFFFF', COLORS.gray, 3)
  }
  // 카카오가 오버레이 상자에 위치 스타일을 직접 넣어서, 원 자체를 넘기면 크기·테두리 계산이 틀어짐.
  // 바깥 상자로 감싸서 넘김 (내 위치·이름표와 같은 방식)
  const wrap = document.createElement('div')
  wrap.title = stop.name
  wrap.appendChild(el)
  return wrap
}

function myLocationElement(): HTMLElement {
  const halo = document.createElement('div')
  Object.assign(halo.style, {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(76,178,130,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })
  halo.appendChild(circle(17, COLORS.brand, '#FFFFFF', 3))
  return halo
}

function labelElement(label: MapLabel): HTMLElement {
  const wrap = document.createElement('div')
  wrap.style.paddingLeft = '16px'
  const pill = document.createElement('div')
  Object.assign(pill.style, {
    background: '#FFFFFF',
    borderRadius: '8px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: '500',
    lineHeight: '1.4',
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
    color: label.tone === 'brand' ? COLORS.brandText : COLORS.text,
    boxShadow: '0 0 1px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.08)',
  })
  pill.textContent = label.text
  wrap.appendChild(pill)
  return wrap
}
