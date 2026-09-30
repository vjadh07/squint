// Public usage counter backed by Abacus (free, no account, CORS enabled).
// Only ever sends a +1. What's inside a code never leaves the browser;
// the de-dupe hash below is stored locally and never sent.

export const COUNTER_BASE = "https://abacus.jasoncameron.dev";
export const NAMESPACE = "squint-vjadh07";
export type CounterKey = "codes" | "people";

const PEOPLE_FLAG = "squint-counted-person";
const CODES_SEEN = "squint-counted-codes";
const MAX_SEEN = 200;
const POLL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 8_000;

type FetchLike = typeof fetch;
type StorageLike = Pick<Storage, "getItem" | "setItem">;

const url = (action: "get" | "hit" | "stream", key: CounterKey) => `${COUNTER_BASE}/${action}/${NAMESPACE}/${key}`;

function parseValue(body: unknown): number | null {
  if (typeof body !== "object" || body === null) return null;
  const value = (body as { value?: unknown }).value;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

async function request(action: "get" | "hit", key: CounterKey, fetchImpl: FetchLike): Promise<number | null> {
  try {
    const res = await fetchImpl(url(action, key), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    // A key that was never hit is a 404, which just means zero so far.
    if (action === "get" && res.status === 404) return 0;
    if (!res.ok) return null;
    return parseValue(await res.json());
  } catch {
    return null;
  }
}

export const readCount = (key: CounterKey, fetchImpl: FetchLike = fetch) => request("get", key, fetchImpl);
export const hitCount = (key: CounterKey, fetchImpl: FetchLike = fetch) => request("hit", key, fetchImpl);

// FNV-1a, only used locally to avoid counting the same code twice.
export function hashPayload(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function readSeen(storage: StorageLike): string[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(CODES_SEEN) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

type RecordDeps = { fetchImpl?: FetchLike; session?: StorageLike | null; local?: StorageLike | null };

export type RecordResult = { codes: number | null; people: number | null };

// Called when someone downloads, copies or shares a code.
export async function recordExport(payload: string, deps: RecordDeps = {}): Promise<RecordResult> {
  const { fetchImpl = fetch, session = safeStorage("session"), local = safeStorage("local") } = deps;
  const result: RecordResult = { codes: null, people: null };

  const hash = hashPayload(payload);
  const seen = session ? readSeen(session) : [];
  if (!seen.includes(hash)) {
    result.codes = await hitCount("codes", fetchImpl);
    if (result.codes !== null && session) {
      try {
        session.setItem(CODES_SEEN, JSON.stringify([...seen, hash].slice(-MAX_SEEN)));
      } catch {
        /* storage full or blocked: worst case we count a repeat */
      }
    }
  }

  const alreadyCounted = local?.getItem(PEOPLE_FLAG) === "1";
  if (!alreadyCounted) {
    result.people = await hitCount("people", fetchImpl);
    if (result.people !== null && local) {
      try {
        local.setItem(PEOPLE_FLAG, "1");
      } catch {
        /* same as above */
      }
    }
  }
  return result;
}

export function safeStorage(kind: "session" | "local"): StorageLike | null {
  try {
    const s = kind === "session" ? window.sessionStorage : window.localStorage;
    const probe = "__squint_probe__";
    s.setItem(probe, "1");
    s.getItem(probe);
    return s;
  } catch {
    return null;
  }
}

type SubscribeDeps = {
  fetchImpl?: FetchLike;
  EventSourceImpl?: typeof EventSource | undefined;
  setIntervalImpl?: typeof setInterval;
  clearIntervalImpl?: typeof clearInterval;
};

// Live updates: server-sent events when available, polling otherwise.
export function subscribeCount(key: CounterKey, onValue: (value: number) => void, deps: SubscribeDeps = {}): () => void {
  const {
    fetchImpl = fetch,
    EventSourceImpl = typeof EventSource === "undefined" ? undefined : EventSource,
    setIntervalImpl = setInterval,
    clearIntervalImpl = clearInterval,
  } = deps;

  let stopped = false;
  let source: EventSource | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;

  const poll = () => {
    readCount(key, fetchImpl).then((v) => {
      if (!stopped && v !== null) onValue(v);
    });
  };
  const startPolling = () => {
    if (timer || stopped) return;
    poll();
    timer = setIntervalImpl(poll, POLL_MS);
  };

  poll();
  if (EventSourceImpl) {
    source = new EventSourceImpl(url("stream", key));
    source.onmessage = (event: MessageEvent<string>) => {
      try {
        const value = parseValue(JSON.parse(event.data));
        if (!stopped && value !== null) onValue(value);
      } catch {
        /* ignore malformed frames */
      }
    };
    source.onerror = () => {
      source?.close();
      source = null;
      startPolling();
    };
  } else {
    startPolling();
  }

  return () => {
    stopped = true;
    source?.close();
    if (timer) clearIntervalImpl(timer);
  };
}
