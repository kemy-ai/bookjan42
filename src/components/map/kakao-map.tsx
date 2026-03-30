"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMapScript } from "@/lib/kakao-map/load-script";
import { AlertCircle } from "lucide-react";
import type { Place } from "@/types";

interface KakaoMapProps {
  places: Place[];
  onPlaceSelect: (place: Place) => void;
}

// 홍대입구역 2호선 (카카오맵 API 기준)
const MAPO_CENTER = { lat: 37.5569, lng: 126.9238 };
const DEFAULT_LEVEL = 5;

export default function KakaoMap({
  places,
  onPlaceSelect,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // 1단계: 맵 초기화 (한 번만)
  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        await loadKakaoMapScript();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "알 수 없는 에러";
        console.error("카카오맵 로드 실패:", msg);
        if (!cancelled) setError(msg);
        return;
      }

      if (cancelled || !mapRef.current) return;

      const map = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(MAPO_CENTER.lat, MAPO_CENTER.lng),
        level: DEFAULT_LEVEL,
      });

      const clusterer = new kakao.maps.MarkerClusterer({
        map,
        minLevel: 6,
      });

      // 타일 로드 완료 후 SDK 내부 캐시/초기화 동작을 덮어씌워 홍대입구역으로 강제 재설정
      let centerFixed = false;
      kakao.maps.event.addListener(map, 'tilesloaded', () => {
        if (centerFixed) return;
        centerFixed = true;
        map.setCenter(new kakao.maps.LatLng(MAPO_CENTER.lat, MAPO_CENTER.lng));
        map.setLevel(DEFAULT_LEVEL);
      });

      mapInstanceRef.current = map;
      clustererRef.current = clusterer;
      setMapReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2단계: 마커 업데이트 (places 또는 맵 준비 시)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterer = clustererRef.current;
    if (!map || !clusterer || !mapReady) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    clusterer.clear();
    if (infoWindowRef.current) infoWindowRef.current.close();

    // SVG 마커 생성 함수
    const createMarkerSvg = (color: string) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
        <circle cx="14" cy="14" r="6" fill="#fff" opacity="0.9"/>
      </svg>`;
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    };

    const talkableImage = new kakao.maps.MarkerImage(
      createMarkerSvg("#4a90d9"),
      new kakao.maps.Size(28, 40),
      { offset: new kakao.maps.Point(14, 40) }
    );
    const quietImage = new kakao.maps.MarkerImage(
      createMarkerSvg("#e67e22"),
      new kakao.maps.Size(28, 40),
      { offset: new kakao.maps.Point(14, 40) }
    );

    const markers = places.map((place) => {
      const position = new kakao.maps.LatLng(place.lat, place.lng);
      const markerImage = place.conversation ? talkableImage : quietImage;
      const marker = new kakao.maps.Marker({ position, image: markerImage });

      const descShort = place.description
        ? place.description.slice(0, 40) + (place.description.length > 40 ? "…" : "")
        : "";
      const hoursText = place.hours || "";
      const closedText = place.closed_days ? `휴무: ${place.closed_days}` : "";

      const infoContent = `
        <div style="padding:10px 14px;font-size:13px;color:#1a1a1a;max-width:280px;font-family:system-ui;line-height:1.5;">
          <strong style="font-size:14px;">${place.name}</strong>
          <span style="margin-left:6px;font-size:11px;color:#888;">${place.conversation ? "💬 대화 가능" : "🤫 정숙"}</span>
          ${descShort ? `<div style="color:#555;font-size:11px;margin-top:4px;">${descShort}</div>` : ""}
          ${hoursText ? `<div style="color:#666;font-size:11px;margin-top:3px;">🕐 ${hoursText}</div>` : ""}
          ${closedText ? `<div style="color:#c44;font-size:11px;">${closedText}</div>` : ""}
          <div style="margin-top:5px;">
            <a href="/place/${place.id}" style="color:#4a7fd7;font-size:11px;text-decoration:none;">상세보기 →</a>
          </div>
        </div>
      `;

      kakao.maps.event.addListener(marker, "click", () => {
        if (infoWindowRef.current) infoWindowRef.current.close();

        const infoWindow = new kakao.maps.InfoWindow({
          content: infoContent,
          removable: true,
        });
        infoWindow.open(map, marker);
        infoWindowRef.current = infoWindow;

        onPlaceSelect(place);
      });

      return marker;
    });

    markersRef.current = markers;
    clusterer.addMarkers(markers);

    // 마커 추가 후 홍대입구역으로 강제 재설정
    // relayout()으로 컨테이너 크기 재계산 후 center 설정 (dynamic import 로딩 후 크기 변경 대응)
    setTimeout(() => {
      map.relayout();
      map.setCenter(new kakao.maps.LatLng(MAPO_CENTER.lat, MAPO_CENTER.lng));
      map.setLevel(DEFAULT_LEVEL);
    }, 500);
  }, [places, mapReady, onPlaceSelect]);

  if (error) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-foreground">지도를 불러올 수 없습니다</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setMapReady(false);
            mapInstanceRef.current = null;
            clustererRef.current = null;
          }}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-xs text-primary-foreground hover:bg-primary/90"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="h-full min-h-[400px] w-full"
    />
  );
}
