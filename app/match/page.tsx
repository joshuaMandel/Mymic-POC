"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

type Metric = { name: string; importance: number };

const IMPORTANCE_LABELS: Record<number, string> = {
  1: "1 · Low",
  2: "2 · Some",
  3: "3 · High",
  4: "4 · Essential",
};

export default function MatchPage() {
  const router = useRouter();

  const [currentCity, setCurrentCity] = useState("St. Louis, MO");
  const [destinationCity, setDestinationCity] = useState("Denver, CO");
  const [currentNeighborhood, setCurrentNeighborhood] = useState("Kirkwood");

  const [metrics, setMetrics] = useState<Metric[]>([
    { name: "Nightlife", importance: 2 },
    { name: "Outdoors", importance: 4 },
    { name: "Schools", importance: 3 },
    { name: "Churches/Temples", importance: 2 },
  ]);

  function updateMetric(index: number, patch: Partial<Metric>) {
    setMetrics((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      from: currentCity,
      to: destinationCity,
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
        <span className="text-sm font-medium text-brand-text/50">Step 1 of 1</span>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-6 md:py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text md:text-4xl">
          Let&apos;s map your move
        </h1>
        <p className="mt-3 text-brand-text/60">
          Tell us where you&apos;re coming from and what makes a neighborhood feel
          like home.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Relocation details */}
          <div className="card p-6 md:p-8">
            <h2 className="text-lg font-bold text-brand-text">
              Relocation details
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Current city">
                <input
                  required
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  placeholder="e.g. St. Louis, MO"
                  className="input"
                />
              </Field>
              <Field label="Destination city">
                <input
                  required
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  placeholder="e.g. Denver, CO"
                  className="input"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Current neighborhood">
                  <input
                    required
                    value={currentNeighborhood}
                    onChange={(e) => setCurrentNeighborhood(e.target.value)}
                    placeholder="e.g. Kirkwood"
                    className="input"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Preference metrics */}
          <div className="card p-6 md:p-8">
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
                  className="flex flex-col gap-3 rounded-xl bg-brand-bg p-3 sm:flex-row sm:items-center"
                >
                  <input
                    value={metric.name}
                    onChange={(e) => updateMetric(i, { name: e.target.value })}
                    placeholder={`Metric ${i + 1}`}
                    className="input flex-1 bg-white"
                  />
                  <select
                    value={metric.importance}
                    onChange={(e) =>
                      updateMetric(i, { importance: Number(e.target.value) })
                    }
                    className="input w-full bg-white sm:w-44"
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

          <button type="submit" className="btn-gradient w-full text-lg tracking-wide">
            MYMIK
          </button>
        </form>
      </section>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(31, 41, 55, 0.12);
          background: #fff;
          padding: 0.7rem 0.9rem;
          font-size: 0.95rem;
          color: #1f2937;
          outline: none;
          transition: border-color 120ms, box-shadow 120ms;
        }
        .input:focus {
          border-color: #6C3CF0;
          box-shadow: 0 0 0 3px rgba(108, 60, 240, 0.15);
        }
      `}</style>
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
