import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiError, api } from "./client";

const neverAnswers = (_url: unknown, init?: RequestInit) =>
  new Promise<Response>((_res, rej) => {
    init?.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")));
  });

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("api: limite de 8 s", () => {
  it("leitura sem resposta vira TIMEOUT", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(neverAnswers));
    const p = api("/x", z.unknown()).catch((e) => e);
    await vi.advanceTimersByTimeAsync(8001);
    const e = await p;
    expect(e).toBeInstanceOf(ApiError);
    expect((e as ApiError).code).toBe("TIMEOUT");
  });
  it("escrita não tem limite padrão", async () => {
    vi.useFakeTimers();
    const f = vi.fn(neverAnswers);
    vi.stubGlobal("fetch", f);
    let settled = false;
    void api("/x", z.unknown(), { method: "POST", body: {} }).finally(() => (settled = true));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(settled).toBe(false);
    expect(f.mock.calls[0][1]?.signal).toBeUndefined();
  });
  it("sem internet segue NETWORK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("fail"))),
    );
    const e = await api("/x", z.unknown()).catch((x) => x);
    expect((e as ApiError).code).toBe("NETWORK");
  });
  it("resposta rápida passa", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ a: 1 }), { status: 200 }))),
    );
    await expect(api("/x", z.object({ a: z.number() }))).resolves.toEqual({ a: 1 });
  });
});
