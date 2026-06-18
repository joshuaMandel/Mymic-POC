"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import {
  matches,
  DESTINATION_CITY,
  ORIGIN_CITY,
  type NeighborhoodMatch,
} from "@/lib/data";

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsFallback />}>
      <ResultsView />
    </Suspense>
  );
}

function ResultsFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-brand-text/50">
      Loading your matches…
    </div>
  );
}

function ResultsView() {
  const params = useSearchParams();

  const from = params.get("from") || ORIGIN_CITY;
  const to = params.get("to") || DESTINATION_CITY;
  const neighborhood = params.get("neighborhood") || "Kirkwood";

  const metrics = useMemo(() => {
    const raw = params.get("metrics");
    if (!raw) return [] as { name: string; importance: number }[];
    return raw
      .split(",")
      .map((pair) => {
        const [name, importance] = pair.split(":");
        return { name, importance: Number(importance) || 1 };
      })
      .filter((m) => m.name);
  }, [params]);

  const [selectedId, setSelectedId] = useState(matches[0].id);
  const selected =
    matches.find((m) => m.id === selectedId) ?? matches[0];

  return (
    <main className="min-h-screen">
      <header className="border-b border-brand-text/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <Link
            href="/match"
            className="rounded-lg border border-brand-text/10 px-4 py-2 text-sm font-semibold text-brand-text/70 transition-colors hover:border-brand-purple hover:text-brand-purple"
          >
            ← Edit search
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr_340px]">
        {/* Left sidebar — inputs summary */}
        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-text/40">
              Your move
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-brand-text/50">From</dt>
                <dd className="font-semibold text-brand-text">{from}</dd>
              </div>
              <div>
                <dt className="text-brand-text/50">To</dt>
                <dd className="font-semibold text-brand-text">{to}</dd>
              </div>
              <div>
                <dt className="text-brand-text/50">Home neighborhood</dt>
                <dd className="font-semibold text-brand-purple">{neighborhood}</dd>
              </div>
            </dl>
          </div>

          {metrics.length > 0 && (
            <div className="card p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-text/40">
                Priorities
              </h2>
              <ul className="mt-4 space-y-3">
                {metrics.map((m, i) => (
                  <li key={i}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-brand-text">{m.name}</span>
                      <span className="text-xs font-semibold text-brand-text/50">
                        {m.importance}/4
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-brand-bg">
                      <div
                        className="h-full rounded-full bg-brand-gradient"
                        style={{ width: `${(m.importance / 4) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl bg-brand-green/10 p-5">
            <p className="text-sm font-semibold text-brand-text">
              {matches.length} familiar matches
            </p>
            <p className="mt-1 text-xs text-brand-text/60">
              Tap a blob on the map to see why it fits.
            </p>
          </div>
        </aside>

        {/* Center — stylized map */}
        <section className="card relative overflow-hidden p-2">
          <div className="flex items-center justify-between px-4 pt-3">
            <h2 className="text-sm font-bold text-brand-text">
              {to.split(",")[0]} · translated for you
            </h2>
            <span className="text-xs text-brand-text/40">
              Labels show {from.split(",")[0]} equivalents
            </span>
          </div>

          <div className="relative mt-2 h-[440px] w-full overflow-hidden rounded-xl bg-[radial-gradient(circle_at_30%_20%,#EEF0FF,transparent_55%),radial-gradient(circle_at_75%_75%,#E6F7EE,transparent_50%)]">
            {/* faux map grid */}
            <div
              className="absolute inset-0 opacity-[0.5]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(31,41,55,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(31,41,55,0.05) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
            {/* faux river */}
            <svg
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <path
                d="M-5,35 C20,45 30,20 50,30 C70,40 80,70 105,60"
                fill="none"
                stroke="#BFD4F2"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>

            {matches.map((m) => (
              <Blob
                key={m.id}
                match={m}
                active={m.id === selectedId}
                onSelect={() => setSelectedId(m.id)}
              />
            ))}
          </div>
        </section>

        {/* Right — selected detail */}
        <aside>
          <DetailPanel match={selected} originCity={from} destCity={to} />
        </aside>
      </div>
    </main>
  );
}

function Blob({
  match,
  active,
  onSelect,
}: {
  match: NeighborhoodMatch;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{ top: `${match.position.top}%`, left: `${match.position.left}%` }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl px-4 py-3 text-left shadow-card transition-all duration-200 ${
        active
          ? "z-20 scale-110 ring-2 ring-offset-2"
          : "z-10 hover:scale-105"
      }`}
    >
      <span
        className="absolute inset-0 rounded-2xl opacity-90"
        style={{
          background: active
            ? match.color
            : `${match.color}E6`,
        }}
      />
      <span
        className="absolute inset-0 rounded-2xl ring-2"
        style={{ boxShadow: active ? `0 0 0 2px ${match.color}` : undefined }}
      />
      <span className="relative block">
        <span className="block text-xs font-medium text-white/70">
          {match.actual}
        </span>
        <span className="block text-sm font-bold text-white">
          {match.familiar}
        </span>
        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {match.score}
        </span>
      </span>
    </button>
  );
}

function DetailPanel({
  match,
  originCity,
  destCity,
}: {
  match: NeighborhoodMatch;
  originCity: string;
  destCity: string;
}) {
  return (
    <div className="card sticky top-6 overflow-hidden">
      <div className="bg-brand-gradient p-6 text-white">
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">
          Feels like home
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <h3 className="text-2xl font-extrabold">{match.familiar}</h3>
          <span className="text-sm text-white/70">
            {originCity.split(",")[0]}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-white/70">Really:</span>
          <span className="font-semibold">{match.actual}</span>
          <span className="text-white/70">· {destCity.split(",")[0]}</span>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-white/15 px-4 py-3">
          <span className="text-sm font-semibold">Match score</span>
          <span className="text-2xl font-extrabold">
            {match.score}
            <span className="text-sm font-semibold text-white/60">/100</span>
          </span>
        </div>
      </div>

      <div className="p-6">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-text/40">
          Why it matches
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-brand-text/80">
          {match.explanation}
        </p>

        <h4 className="mt-6 text-xs font-semibold uppercase tracking-wide text-brand-text/40">
          Matching factors
        </h4>
        <ul className="mt-3 space-y-3">
          {match.factors.map((f) => (
            <li key={f.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-brand-text">{f.label}</span>
                <span className="text-xs font-semibold text-brand-text/50">
                  {f.value}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-brand-bg">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${f.value}%`,
                    background:
                      f.value >= 80
                        ? "#2FBF71"
                        : f.value >= 65
                          ? "#6C3CF0"
                          : "#9B7BF5",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
