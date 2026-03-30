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
  const labelsRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const infoWindowsRef = useRef<{ marker: kakao.maps.Marker; infoWindow: kakao.maps.InfoWindow; place: Place }[]>([]);
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const activeInfoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);
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

      // 타일 로드 완료 시 처음 2회까지 홍대입구역으로 강제 재설정
      // (1회: 초기 로드, 2회: 마커/클러스터러 추가 후 타일 재로드)
      let tileLoadCount = 0;
      kakao.maps.event.addListener(map, 'tilesloaded', () => {
        if (tileLoadCount >= 2) return;
        tileLoadCount++;
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

    // 기존 마커 + 라벨 + 인포윈도우 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    labelsRef.current.forEach((l) => l.setMap(null));
    labelsRef.current = [];
    infoWindowsRef.current = [];
    clusterer.clear();
    if (activeInfoWindowRef.current) activeInfoWindowRef.current.close();

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

      // 마커 아래 이름 라벨 (확대 시 숨김 — 인포윈도우와 중복 방지)
      const label = new kakao.maps.CustomOverlay({
        position,
        content: `<div style="
          padding:2px 6px;
          font-size:10px;
          font-weight:600;
          font-family:system-ui;
          color:#fff;
          background:rgba(0,0,0,0.75);
          border-radius:3px;
          white-space:nowrap;
          pointer-events:none;
          transform:translateY(4px);
        ">${place.name}</div>`,
        yAnchor: 0,
      });
      label.setMap(map);
      labelsRef.current.push(label);

      // 인포윈도우 (클릭 또는 확대 시 표시)
      const infoWindow = new kakao.maps.InfoWindow({
        content: infoContent,
        removable: true,
      });

      kakao.maps.event.addListener(marker, "click", () => {
        if (activeInfoWindowRef.current) activeInfoWindowRef.current.close();
        infoWindow.open(map, marker);
        activeInfoWindowRef.current = infoWindow;
        onPlaceSelect(place);
      });

      infoWindowsRef.current.push({ marker, infoWindow, place });

      return marker;
    });

    markersRef.current = markers;
    clusterer.addMarkers(markers);

    // 확대 시(레벨 3 이하) 인포윈도우 자동 표시 + 이름 라벨 숨기기
    // 줌 변경 + 드래그 이동 모두에서 동작
    const DETAIL_LEVEL = 3;
    const updateInfoWindows = () => {
      const level = map.getLevel();
      if (level <= DETAIL_LEVEL) {
        labelsRef.current.forEach((l) => l.setMap(null));
        const bounds = map.getBounds();
        infoWindowsRef.current.forEach(({ marker, infoWindow }) => {
          const pos = marker.getPosition();
          if (bounds.contain(pos)) {
            infoWindow.open(map, marker);
          } else {
            infoWindow.close();
          }
        });
      } else {
        infoWindowsRef.current.forEach(({ infoWindow }) => infoWindow.close());
        activeInfoWindowRef.current = null;
        labelsRef.current.forEach((l) => l.setMap(map));
      }
    };
    kakao.maps.event.addListener(map, "zoom_changed", updateInfoWindows);
    kakao.maps.event.addListener(map, "dragend", updateInfoWindows);

    // 마커 추가 후 홍대입구역으로 강제 재설정
    // relayout()은 비동기로 컨테이너를 재계산하므로, 완료 후 setCenter를 호출해야 함
    // 1단계: relayout으로 크기 재계산
    map.relayout();
    // 2단계: relayout 완료 후 center 설정 (requestAnimationFrame으로 렌더링 프레임 대기)
    requestAnimationFrame(() => {
      map.setCenter(new kakao.maps.LatLng(MAPO_CENTER.lat, MAPO_CENTER.lng));
      map.setLevel(DEFAULT_LEVEL);
      // 3단계: 안전장치 — 클러스터러 비동기 동작 완료 후 한 번 더
      setTimeout(() => {
        map.setCenter(new kakao.maps.LatLng(MAPO_CENTER.lat, MAPO_CENTER.lng));
        map.setLevel(DEFAULT_LEVEL);
      }, 300);
    });
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
