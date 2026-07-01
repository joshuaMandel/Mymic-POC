"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import CityTypeahead from "@/components/CityTypeahead";
import { usCities, LIVE_CITIES } from "@/lib/us-cities";
import { neighborhoodsForOrigin } from "@/lib/neighborhoods";

type Metric = { name: string; importance: number };

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
                placeholder="Search any US city…"
              />
              <CityTypeahead
                label="Destination city"
                value={destination}
                onChange={setDestination}
                options={usCities}
                liveSet={LIVE_CITIES}
                placeholder="Search any US city…"
              />
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
