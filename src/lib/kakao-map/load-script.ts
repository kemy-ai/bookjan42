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

  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수 없음"));
  }

  isLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    // 이미 스크립트가 로드된 경우
    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(() => {
        isLoaded = true;
        isLoading = false;
        resolve();
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=clusterer`;
    script.async = true;

    script.onload = () => {
      if (!window.kakao?.maps?.load) {
        isLoading = false;
        loadPromise = null;
        reject(new Error("카카오 SDK 로드됐지만 maps 객체 없음"));
        return;
      }
      window.kakao.maps.load(() => {
        isLoaded = true;
        isLoading = false;
        resolve();
      });
    };

    script.onerror = (e) => {
      isLoading = false;
      loadPromise = null;
      console.error("카카오맵 스크립트 로드 에러:", e);
      reject(new Error("카카오맵 SDK 스크립트 로드 실패 — 네트워크 또는 API 키 확인"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
