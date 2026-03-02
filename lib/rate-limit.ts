const windows = new Map<string, number[]>();

export function checkRateLimit(key: string, max = 12, windowMs = 60_000) {
  const now = Date.now();
  const list = windows.get(key) || [];
  const recent = list.filter((x) => now - x < windowMs);

  if (recent.length >= max) {
    const retryAfterMs = windowMs - (now - recent[0]);
    return { allowed: false, retryAfterMs };
  }

  recent.push(now);
  windows.set(key, recent);
  return { allowed: true, retryAfterMs: 0 };
}
