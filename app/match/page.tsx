"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { cityPairs } from "@/lib/data";

type Metric = { name: string; importance: number };

const IMPORTANCE_LABELS: Record<number, string> = {
  1: "1 · Low",
  2: "2 · Some",
  3: "3 · High",
  4: "4 · Essential",
};

export default function MatchPage() {
  const router = useRouter();

  const [pairId, setPairId] = useState(cityPairs[0].id);
  const pair = cityPairs.find((p) => p.id === pairId) ?? cityPairs[0];

  const [currentNeighborhood, setCurrentNeighborhood] = useState(
    cityPairs[0].matches[0].familiar
  );

  const [metrics, setMetrics] = useState<Metric[]>([
    { name: "Nightlife", importance: 2 },
    { name: "Outdoors", importance: 4 },
    { name: "Schools", importance: 3 },
    { name: "Churches/Temples", importance: 2 },
  ]);

  function selectPair(id: string) {
    const next = cityPairs.find((p) => p.id === id) ?? cityPairs[0];
    setPairId(next.id);
    // The origin changed, so reset to a neighborhood that exists there.
    setCurrentNeighborhood(next.matches[0].familiar);
  }

  function updateMetric(index: number, patch: Partial<Metric>) {
    setMetrics((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      from: pair.origin,
      to: pair.destination,
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
              <span className="rounded-full bg-brand-purple/10 px-2.5 py-1 text-[11px] font-semibold text-brand-purple">
                {cityPairs.length} demo cities
              </span>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Current city">
                <select
                  value={pair.origin}
                  onChange={(e) => {
                    const p = cityPairs.find((x) => x.origin === e.target.value);
                    if (p) selectPair(p.id);
                  }}
                  className="input"
                >
                  {cityPairs.map((p) => (
                    <option key={p.id} value={p.origin}>
                      {p.origin}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Destination city">
                <select
                  value={pair.destination}
                  onChange={(e) => {
                    const p = cityPairs.find(
                      (x) => x.destination === e.target.value
                    );
                    if (p) selectPair(p.id);
                  }}
                  className="input"
                >
                  {cityPairs.map((p) => (
                    <option key={p.id} value={p.destination}>
                      {p.destination}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Current neighborhood">
                  <select
                    value={currentNeighborhood}
                    onChange={(e) => setCurrentNeighborhood(e.target.value)}
                    className="input"
                  >
                    {pair.matches.map((m) => (
                      <option key={m.id} value={m.familiar}>
                        {m.familiar}
                      </option>
                    ))}
                  </select>
                </Field>
                <p className="mt-2 text-xs text-brand-text/50">
                  Pick the {pair.origin.split(",")[0]} neighborhood you know best —
                  we&apos;ll find its match in {pair.destination.split(",")[0]}.
                </p>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-brand-text">
        {label}
      </span>
      {children}
    </label>
  );
}
