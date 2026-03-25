"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { loadKakaoMapScript } from "@/lib/kakao-map/load-script";
import { AlertCircle } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  const initMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      await loadKakaoMapScript();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "알 수 없는 에러";
      console.error("카카오맵 로드 실패:", msg);
      setError(msg);
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

  useEffect(() => {
    initMap();
  }, [initMap]);

  useEffect(() => {
    if (mapInstanceRef.current && clustererRef.current) {
      updateMarkers(places, mapInstanceRef.current, clustererRef.current);
    }
  }, [places, updateMarkers]);

  useEffect(() => {
    if (!selectedPlaceId || !mapInstanceRef.current) return;
    const place = places.find((p) => p.id === selectedPlaceId);
    if (place) {
      const position = new kakao.maps.LatLng(place.lat, place.lng);
      mapInstanceRef.current.panTo(position);
      mapInstanceRef.current.setLevel(4);
    }
  }, [selectedPlaceId, places]);

  if (error) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-foreground">지도를 불러올 수 없습니다</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <button
          onClick={() => {
            setError(null);
            initMap();
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
