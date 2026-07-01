"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import CityTypeahead from "@/components/CityTypeahead";
import { usCities, LIVE_CITIES } from "@/lib/us-cities";
import { neighborhoodsForOrigin } from "@/lib/neighborhoods";
import type { ZipDetection } from "@/scripts/lib/zip-lookup.mjs";

type Metric = { name: string; importance: number };

// Kept local so the client bundle doesn't pull in the lookup module's runtime.
const ZIP_RE = /^\d{5}$/;
type ZipStatus = "idle" | "looking" | "found" | "error";

const IMPORTANCE_LABELS: Record<number, string> = {
  1: "1 · Low",
  2: "2 · Some",
  3: "3 · High",
  4: "4 · Essential",
};

export default function MatchPage() {
  const router = useRouter();

  const [origin, setOrigin] = useState("St. Louis, MO");
  const [destination, setDestination] = useState("Denver, CO");
  const neighborhoods = neighborhoodsForOrigin(origin);
  const [currentNeighborhood, setCurrentNeighborhood] = useState(
    neighborhoods[0] ?? ""
  );

  const [metrics, setMetrics] = useState<Metric[]>([
    { name: "Nightlife", importance: 2 },
    { name: "Outdoors", importance: 4 },
    { name: "Schools", importance: 3 },
    { name: "Churches/Temples", importance: 2 },
  ]);

  // Smart origin field: typing a 5-digit ZIP looks up "you're in <neighborhood>".
  const [zipStatus, setZipStatus] = useState<ZipStatus>("idle");
  const [zipResult, setZipResult] = useState<ZipDetection | null>(null);
  const lookupSeq = useRef(0); // discards stale debounced responses

  useEffect(() => {
    const value = origin.trim();
    if (!ZIP_RE.test(value)) {
      // Feedback-loop guard: a successful lookup sets `origin` to the detected
      // city (a non-ZIP value) — don't clear the card for that very value.
      const detectedCity = zipResult
        ? zipResult.matchable?.city ?? zipResult.detected.city
        : null;
      if (value !== detectedCity) {
        lookupSeq.current++;
        setZipStatus("idle");
        setZipResult(null);
      }
      return;
    }
    const seq = ++lookupSeq.current;
    setZipStatus("looking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/zip-lookup?zip=${value}`);
        const data = await res.json();
        if (seq !== lookupSeq.current) return; // stale: user typed more / picked a city
        if (data.ok) {
          setZipResult(data);
          setZipStatus("found");
          const city = data.matchable?.city ?? data.detected.city;
          // setOrigin directly (NOT selectOrigin): keep the nearest-detected
          // neighborhood instead of resetting to the city's first one.
          setOrigin(city);
          setCurrentNeighborhood(data.matchable?.neighborhood ?? "");
        } else {
          setZipResult(null);
          setZipStatus(data.error === "invalid_zip" ? "idle" : "error");
        }
      } catch {
        if (seq === lookupSeq.current) {
          setZipResult(null);
          setZipStatus("error");
        }
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zipResult is read
    // for the feedback-loop guard only; making it a dep would re-run the effect
    // on every detection and race the guard.
  }, [origin]);

  function dismissZipCard() {
    lookupSeq.current++;
    setZipStatus("idle");
    setZipResult(null);
  }

  function selectOrigin(next: string) {
    setOrigin(next);
    // Reset to a neighborhood that exists in the new origin city (if it's live).
    setCurrentNeighborhood(neighborhoodsForOrigin(next)[0] ?? "");
  }

  function updateMetric(index: number, patch: Partial<Metric>) {
    setMetrics((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      from: origin,
      to: destination,
      neighborhood: currentNeighborhood,
      metrics: metrics
        .filter((m) => m.name.trim().length > 0)
        .map((m) => `${m.name}:${m.importance}`)
        .join(","),
    });
    router.push(`/results?${params.toString()}`);
  }

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Logo />
        <span className="rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-medium text-brand-text/50 backdrop-blur">
          Step 1 of 1
        </span>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-6 md:py-10">
        <div className="animate-fade-up">
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-text md:text-5xl">
            Let&apos;s map your{" "}
            <span className="text-gradient bg-[length:200%_auto] animate-gradient">
              move
            </span>
          </h1>
          <p className="mt-3 text-brand-text/60">
            Tell us where you&apos;re coming from and what makes a neighborhood feel
            like home.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-7">
          {/* Relocation details */}
          <div className="glass-strong animate-fade-up p-6 md:p-8 [animation-delay:80ms]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-text">
                Relocation details
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/10 px-2.5 py-1 text-[11px] font-semibold text-brand-green">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                live = real data
              </span>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <CityTypeahead
                label="Current city"
                value={origin}
                onChange={selectOrigin}
                options={usCities}
                liveSet={LIVE_CITIES}
                placeholder="City name… or your 5-digit ZIP"
              />
              <CityTypeahead
                label="Destination city"
                value={destination}
                onChange={setDestination}
                options={usCities}
                liveSet={LIVE_CITIES}
                placeholder="Search any US city…"
              />
              {zipStatus !== "idle" && (
                <div className="sm:col-span-2">
                  {zipStatus === "looking" && (
                    <p className="flex items-center gap-2 rounded-xl border border-white/50 bg-white/40 px-3.5 py-2.5 text-xs text-brand-text/60 backdrop-blur">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-purple" />
                      Looking up your ZIP…
                    </p>
                  )}
                  {zipStatus === "found" && zipResult && (
                    <div className="flex items-start justify-between gap-3 rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-3.5 py-2.5 backdrop-blur">
                      <div className="text-xs text-brand-text/70">
                        <p>
                          📍 You&apos;re in{" "}
                          <span className="font-semibold text-brand-text">
                            {zipResult.detected.name}
                          </span>{" "}
                          — {zipResult.detected.city}
                          {zipResult.matchable ? (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-2 py-0.5 text-[10px] font-semibold text-brand-green">
                              <span className="h-1 w-1 rounded-full bg-brand-green" />
                              live
                            </span>
                          ) : (
                            <span className="ml-2 rounded-full bg-brand-text/10 px-2 py-0.5 text-[10px] font-semibold text-brand-text/50">
                              preview
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[11px] text-brand-text/45">
                          Detected from ZIP {zipResult.zip}
                          {zipResult.matchable &&
                            zipResult.matchable.neighborhood !==
                              zipResult.detected.name && (
                              <>
                                {" · "}matching from{" "}
                                <span className="font-medium text-brand-text/70">
                                  {zipResult.matchable.neighborhood}
                                </span>{" "}
                                below
                              </>
                            )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={dismissZipCard}
                        aria-label="Dismiss ZIP detection"
                        className="text-brand-text/40 transition hover:text-brand-text"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {zipStatus === "error" && (
                    <p className="rounded-xl border border-white/50 bg-white/40 px-3.5 py-2.5 text-xs text-brand-text/60 backdrop-blur">
                      Couldn&apos;t look up that ZIP — try typing your city name
                      instead.
                    </p>
                  )}
                </div>
              )}
              <div className="sm:col-span-2">
                {neighborhoods.length > 0 ? (
                  <>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-brand-text">
                        Current neighborhood
                      </span>
                      <select
                        value={currentNeighborhood}
                        onChange={(e) => setCurrentNeighborhood(e.target.value)}
                        className="input"
                      >
                        {neighborhoods.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="mt-2 text-xs text-brand-text/50">
                      Pick the {origin.split(",")[0]} neighborhood you know best —
                      we&apos;ll find its match in {destination.split(",")[0]}.
                    </p>
                  </>
                ) : (
                  <p className="rounded-xl border border-white/50 bg-white/40 px-3.5 py-2.5 text-xs text-brand-text/60 backdrop-blur">
                    Neighborhood-level data for{" "}
                    <span className="font-semibold text-brand-text">
                      {origin.split(",")[0]}
                    </span>{" "}
                    is rolling out. Pick a city marked{" "}
                    <span className="font-semibold text-brand-green">● live</span>{" "}
                    for full matches, or continue for a preview.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preference metrics */}
          <div className="glass-strong animate-fade-up p-6 md:p-8 [animation-delay:160ms]">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-brand-text">
                  What matters to you
                </h2>
                <p className="mt-1 text-sm text-brand-text/60">
                  Name up to four things, then rank how essential each one is.
                </p>
              </div>
              <span className="hidden text-xs font-medium text-brand-text/40 sm:block">
                1 = Low · 4 = Essential
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {metrics.map((metric, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-3 rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur sm:flex-row sm:items-center"
                >
                  <input
                    value={metric.name}
                    onChange={(e) => updateMetric(i, { name: e.target.value })}
                    placeholder={`Metric ${i + 1}`}
                    className="input flex-1"
                  />
                  <select
                    value={metric.importance}
                    onChange={(e) =>
                      updateMetric(i, { importance: Number(e.target.value) })
                    }
                    className="input w-full sm:w-44"
                    aria-label={`Importance for ${metric.name || `metric ${i + 1}`}`}
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {IMPORTANCE_LABELS[n]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-gradient w-full animate-fade-up py-4 text-lg tracking-wide [animation-delay:220ms]"
          >
            MYMIK
          </button>
        </form>
      </section>
    </main>
  );
}
