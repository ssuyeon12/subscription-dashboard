/**
 * globalThis 기반 TTL 캐시 (Vercel Serverless warm instance 재사용)
 * cold start 시에는 캐시가 없으므로 README에 명시 필요
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  cachedAt: number;
}

const g = globalThis as typeof globalThis & {
  _ttlCache?: Map<string, CacheEntry<unknown>>;
};

if (!g._ttlCache) {
  g._ttlCache = new Map();
}

const store = g._ttlCache as Map<string, CacheEntry<unknown>>;

export function cacheGet<T>(key: string): { data: T; ttlRemaining: number } | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  const ttlRemaining = entry.expiresAt - Date.now();
  if (ttlRemaining <= 0) {
    store.delete(key);
    return null;
  }
  return { data: entry.data, ttlRemaining: Math.floor(ttlRemaining / 1000) };
}

export function cacheSet<T>(key: string, data: T, ttlSeconds: number): void {
  store.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
    cachedAt: Date.now(),
  });
}

/** API별 TTL (초) */
export const TTL = {
  saleinfo: 15 * 60,      // 분양정보: 15분
  competition: 5 * 60,    // 경쟁률: 5분
  subscription: 60 * 60,  // 신청·당첨자 통계: 60분 (매월 26일 갱신)
} as const;
