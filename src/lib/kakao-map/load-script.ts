import "@/lib/kakao-map/types";

let isLoaded = false;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

/**
 * 카카오맵 SDK를 동적으로 로드
 * 중복 로드 방지 + Promise 기반
 */
export function loadKakaoMapScript(): Promise<void> {
  if (isLoaded && window.kakao?.maps) {
    return Promise.resolve();
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=clusterer`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        isLoaded = true;
        isLoading = false;
        resolve();
      });
    };

    script.onerror = () => {
      isLoading = false;
      loadPromise = null;
      reject(new Error("카카오맵 SDK 로드 실패"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
