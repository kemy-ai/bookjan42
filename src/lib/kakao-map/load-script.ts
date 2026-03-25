import "@/lib/kakao-map/types";

let isLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * 카카오맵 SDK 로드 대기
 * layout.tsx의 next/script로 SDK가 로드되므로, kakao.maps.load()만 호출
 */
export function loadKakaoMapScript(): Promise<void> {
  if (isLoaded && window.kakao?.maps) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const maxAttempts = 50; // 최대 5초 대기
    let attempts = 0;

    const checkKakao = () => {
      attempts++;

      if (window.kakao?.maps) {
        window.kakao.maps.load(() => {
          isLoaded = true;
          resolve();
        });
        return;
      }

      if (attempts >= maxAttempts) {
        loadPromise = null;
        reject(new Error("카카오맵 SDK 로드 시간 초과"));
        return;
      }

      setTimeout(checkKakao, 100);
    };

    checkKakao();
  });

  return loadPromise;
}
