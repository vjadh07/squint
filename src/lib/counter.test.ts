import { describe, expect, test, vi } from "vitest";
import { hashPayload, hitCount, readCount, recordExport, subscribeCount, COUNTER_BASE, NAMESPACE } from "./counter";

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

const memoryStorage = () => {
  const map = new Map<string, string>();
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
};

describe("readCount / hitCount", () => {
  test("reads the value from the api", async () => {
    const fetchImpl = vi.fn(() => json({ value: 42 }));
    expect(await readCount("codes", fetchImpl as unknown as typeof fetch)).toBe(42);
    expect(fetchImpl).toHaveBeenCalledWith(`${COUNTER_BASE}/get/${NAMESPACE}/codes`, expect.anything());
  });

  test("a missing key means zero so far", async () => {
    const fetchImpl = vi.fn(() => json({ error: "Key not found" }, 404));
    expect(await readCount("people", fetchImpl as unknown as typeof fetch)).toBe(0);
  });

  test("bad responses and network errors return null", async () => {
    expect(await hitCount("codes", (() => json({ value: "lots" })) as unknown as typeof fetch)).toBeNull();
    expect(await hitCount("codes", (() => json({ value: 1 }, 500)) as unknown as typeof fetch)).toBeNull();
    expect(await hitCount("codes", (() => Promise.reject(new Error("offline"))) as unknown as typeof fetch)).toBeNull();
  });
});

describe("recordExport", () => {
  test("counts a new code and a new person once", async () => {
    const fetchImpl = vi.fn((u: string) => json({ value: u.endsWith("codes") ? 10 : 3 }));
    const session = memoryStorage();
    const local = memoryStorage();
    const deps = { fetchImpl: fetchImpl as unknown as typeof fetch, session, local };

    expect(await recordExport("https://a.co", deps)).toEqual({ codes: 10, people: 3 });
    expect(await recordExport("https://a.co", deps)).toEqual({ codes: null, people: null });
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    expect(await recordExport("https://b.co", deps)).toEqual({ codes: 10, people: null });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  test("never sends the payload itself", async () => {
    const fetchImpl = vi.fn(() => json({ value: 1 }));
    await recordExport("secret-wifi-password", {
      fetchImpl: fetchImpl as unknown as typeof fetch, session: memoryStorage(), local: memoryStorage(),
    });
    for (const [u] of fetchImpl.mock.calls as unknown as Array<[string]>) expect(u).not.toMatch(/secret/);
  });

  test("works without storage", async () => {
    const fetchImpl = vi.fn(() => json({ value: 5 }));
    const out = await recordExport("x", { fetchImpl: fetchImpl as unknown as typeof fetch, session: null, local: null });
    expect(out).toEqual({ codes: 5, people: 5 });
  });

  test("a failed hit does not mark the code as counted", async () => {
    const session = memoryStorage();
    const failing = (() => Promise.reject(new Error("down"))) as unknown as typeof fetch;
    await recordExport("x", { fetchImpl: failing, session, local: memoryStorage() });
    expect(session.getItem("squint-counted-codes")).toBeNull();
  });
});

describe("hashPayload", () => {
  test("is stable and differs between inputs", () => {
    expect(hashPayload("abc")).toBe(hashPayload("abc"));
    expect(hashPayload("abc")).not.toBe(hashPayload("abd"));
  });
});

describe("subscribeCount", () => {
  class FakeSource {
    static last: FakeSource | null = null;
    onmessage: ((e: MessageEvent<string>) => void) | null = null;
    onerror: (() => void) | null = null;
    closed = false;
    constructor(public url: string) { FakeSource.last = this; }
    close() { this.closed = true; }
  }

  test("pushes streamed values and falls back to polling on error", async () => {
    const fetchImpl = vi.fn(() => json({ value: 7 }));
    const seen: number[] = [];
    const setIntervalImpl = vi.fn(() => 1 as unknown as ReturnType<typeof setInterval>);
    const clearIntervalImpl = vi.fn();
    const stop = subscribeCount("codes", (v) => seen.push(v), {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      EventSourceImpl: FakeSource as unknown as typeof EventSource,
      setIntervalImpl: setIntervalImpl as unknown as typeof setInterval,
      clearIntervalImpl: clearIntervalImpl as unknown as typeof clearInterval,
    });
    await vi.waitFor(() => expect(seen).toContain(7));

    FakeSource.last!.onmessage!({ data: '{"value":8}' } as MessageEvent<string>);
    FakeSource.last!.onmessage!({ data: "garbage" } as MessageEvent<string>);
    expect(seen).toContain(8);

    FakeSource.last!.onerror!();
    expect(FakeSource.last!.closed).toBe(true);
    expect(setIntervalImpl).toHaveBeenCalled();

    stop();
    expect(clearIntervalImpl).toHaveBeenCalled();
  });

  test("polls when EventSource is not available", async () => {
    const fetchImpl = vi.fn(() => json({ value: 2 }));
    const seen: number[] = [];
    const stop = subscribeCount("people", (v) => seen.push(v), {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      EventSourceImpl: undefined,
      setIntervalImpl: (() => 1) as unknown as typeof setInterval,
      clearIntervalImpl: (() => undefined) as unknown as typeof clearInterval,
    });
    await vi.waitFor(() => expect(seen).toContain(2));
    stop();
  });
});
