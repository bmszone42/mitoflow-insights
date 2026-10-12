// In-memory limits. Per server instance and reset on restart; good against casual abuse only.
const SHORT_WINDOW = 10 * 60_000;
const SHORT_MAX = 10;
const DAY = 24 * 60 * 60_000;
const DAY_MAX = 40;
const GLOBAL_DAY_MAX = 300;

const hits = new Map<string, number[]>();
let global: number[] = [];

export function clientKey(request: Request) {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function checkLimit(key: string) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < DAY);
  global = global.filter((t) => now - t < DAY);
  const recent = list.filter((t) => now - t < SHORT_WINDOW);

  const deny = (retryMs: number, why: string) => ({
    ok: false as const,
    remaining: 0,
    message: `${why} Try again in ${Math.max(1, Math.ceil(retryMs / 60_000))} minute(s).`,
  });
  if (global.length >= GLOBAL_DAY_MAX)
    return deny(DAY - (now - global[0]!), "Daily AI capacity for this app is used up.");
  if (list.length >= DAY_MAX) return deny(DAY - (now - list[0]!), "Daily limit reached.");
  if (recent.length >= SHORT_MAX)
    return deny(SHORT_WINDOW - (now - recent[0]!), "Limit of 10 requests per 10 minutes reached.");

  list.push(now);
  global.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.delete(hits.keys().next().value!);
  return { ok: true as const, remaining: SHORT_MAX - recent.length - 1, message: "" };
}

export async function readLimitedJson(request: Request, maxBytes = 16_384) {
  const text = await request.text();
  if (text.length > maxBytes) return { tooLarge: true as const };
  try {
    return { tooLarge: false as const, json: JSON.parse(text) as unknown };
  } catch {
    return { tooLarge: false as const, json: null };
  }
}
