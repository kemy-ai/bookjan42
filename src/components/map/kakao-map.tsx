"use client";

import { useEffect, useRef, useCallback } from "react";
import { loadKakaoMapScript } from "@/lib/kakao-map/load-script";
import type { Place } from "@/types";

interface KakaoMapProps {
  places: Place[];
  onPlaceSelect: (place: Place) => void;
  selectedPlaceId?: string | null;
}

export default function KakaoMap({
  places,
  onPlaceSelect,
  selectedPlaceId,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);

  const initMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      await loadKakaoMapScript();
    } catch {
      console.error("카카오맵 로드 실패");
      return;
    }

    const center = new kakao.maps.LatLng(37.5536, 126.9253);
    const map = new kakao.maps.Map(mapRef.current, {
      center,
      level: 8,
    });
    mapInstanceRef.current = map;

    const clusterer = new kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: 6,
    });
    clustererRef.current = clusterer;

    updateMarkers(places, map, clusterer);
  }, [places]);

  const updateMarkers = useCallback(
    (
      placesToMark: Place[],
      map: kakao.maps.Map,
      clusterer: kakao.maps.MarkerClusterer
    ) => {
      // 기존 마커 제거
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      clusterer.clear();
      if (infoWindowRef.current) infoWindowRef.current.close();

      const markers = placesToMark.map((place) => {
        const position = new kakao.maps.LatLng(place.lat, place.lng);
        const marker = new kakao.maps.Marker({ position });

        const infoContent = `
          <div style="padding:8px 12px;font-size:13px;color:#1a1a1a;white-space:nowrap;font-family:system-ui;">
            <strong>${place.name}</strong>
            <br/>
            <span style="color:#666;font-size:11px;">${place.conversation ? "💬 대화 가능" : "🤫 정숙"} · ${place.price_range}</span>
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

          map.panTo(position);
          onPlaceSelect(place);
        });

        return marker;
      });

      markersRef.current = markers;
      clusterer.addMarkers(markers);

      // 모든 마커가 보이도록 bounds 설정
      if (markers.length > 0) {
        const bounds = new kakao.maps.LatLngBounds();
        placesToMark.forEach((p) => {
          bounds.extend(new kakao.maps.LatLng(p.lat, p.lng));
        });
        map.setBounds(bounds);
      }
    },
    [onPlaceSelect]
  );

  // 초기 로드
  useEffect(() => {
    initMap();
  }, [initMap]);

  // places 변경 시 마커 업데이트
  useEffect(() => {
    if (mapInstanceRef.current && clustererRef.current) {
      updateMarkers(places, mapInstanceRef.current, clustererRef.current);
    }
  }, [places, updateMarkers]);

  // 선택된 장소로 이동
  useEffect(() => {
    if (!selectedPlaceId || !mapInstanceRef.current) return;
    const place = places.find((p) => p.id === selectedPlaceId);
    if (place) {
      const position = new kakao.maps.LatLng(place.lat, place.lng);
      mapInstanceRef.current.panTo(position);
      mapInstanceRef.current.setLevel(4);
    }
  }, [selectedPlaceId, places]);

  return (
    <div
      ref={mapRef}
      className="h-full min-h-[400px] w-full rounded-lg border border-border"
    />
  );
}
