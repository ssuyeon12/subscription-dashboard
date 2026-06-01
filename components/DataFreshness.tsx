"use client";

interface Props {
  cached?: boolean;
  ttlRemaining?: number; // seconds
}

export default function DataFreshness({ cached, ttlRemaining }: Props) {
  if (cached === undefined) return null;

  const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const ttlMin = ttlRemaining ? Math.ceil(ttlRemaining / 60) : null;

  if (cached) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
        캐시됨{ttlMin ? ` · ${ttlMin}분 후 갱신` : ""}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
      신규 호출 · {now}
    </span>
  );
}
