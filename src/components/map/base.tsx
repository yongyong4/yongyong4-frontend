import CurrentLocation from './current-location';
import RouteOverlay from './route-overlay';

interface RoutePoint {
  x: number;
  y: number;
}

interface MapBaseProps {
  // 현재 위치 좌표 (픽셀)
  currentLocation?: { x: number; y: number };
  // 이동 경로 좌표 배열 (픽셀)
  routePoints?: RoutePoint[];
  routeColor?: string;
}

export default function MapBase({
  currentLocation,
  routePoints = [],
  routeColor,
}: MapBaseProps) {
  return (
    <div
      style={{
        width: 390,
        height: 844,
        background: '#F6F5F1',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 지도 타일 영역 */}
      <div
        style={{
          width: 390,
          height: 844,
          position: 'relative',
        }}
      >
        {/* 이동 경로 오버레이 */}
        {routePoints.length >= 2 && (
          <RouteOverlay points={routePoints} color={routeColor} />
        )}

        {/* 현재 위치 마커 */}
        {currentLocation && (
          <CurrentLocation x={currentLocation.x} y={currentLocation.y} />
        )}
      </div>
    </div>
  );
}
