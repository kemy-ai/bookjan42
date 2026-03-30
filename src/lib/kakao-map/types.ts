/* eslint-disable @typescript-eslint/no-namespace */
// 카카오맵 SDK 타입 선언
declare global {
  interface Window {
    kakao: typeof kakao;
  }

  namespace kakao {
    namespace maps {
      class LatLng {
        constructor(lat: number, lng: number);
        getLat(): number;
        getLng(): number;
      }

      class Map {
        constructor(container: HTMLElement, options: MapOptions);
        setCenter(latlng: LatLng): void;
        setLevel(level: number): void;
        getLevel(): number;
        getCenter(): LatLng;
        setBounds(bounds: LatLngBounds): void;
        panTo(latlng: LatLng): void;
        relayout(): void;
      }

      class Marker {
        constructor(options: MarkerOptions);
        setMap(map: Map | null): void;
        getPosition(): LatLng;
      }

      class InfoWindow {
        constructor(options: InfoWindowOptions);
        open(map: Map, marker: Marker): void;
        close(): void;
      }

      class LatLngBounds {
        constructor();
        extend(latlng: LatLng): void;
      }

      class MarkerImage {
        constructor(src: string, size: Size, options?: { offset?: Point });
      }

      class Size {
        constructor(width: number, height: number);
      }

      class Point {
        constructor(x: number, y: number);
      }

      class MarkerClusterer {
        constructor(options: MarkerClustererOptions);
        addMarkers(markers: Marker[]): void;
        clear(): void;
      }

      namespace event {
        function addListener(
          target: Marker | Map,
          type: string,
          handler: () => void
        ): void;
      }

      function load(callback: () => void): void;

      interface MapOptions {
        center: LatLng;
        level: number;
      }

      interface MarkerOptions {
        position: LatLng;
        map?: Map;
        image?: MarkerImage;
      }

      interface InfoWindowOptions {
        content: string;
        removable?: boolean;
      }

      interface MarkerClustererOptions {
        map: Map;
        averageCenter?: boolean;
        minLevel?: number;
      }
    }
  }
}

export {};
