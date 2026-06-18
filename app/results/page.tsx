"use client";

import { Suspense, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import {
  rankMatches,
  preferenceToFactor,
  DESTINATION_CITY,
  ORIGIN_CITY,
  type ScoredMatch,
  type Preference,
} from "@/lib/data";

// Leaflet touches `window`, so load the map only in the browser.
const NeighborhoodMap = dynamic(() => import("./NeighborhoodMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-brand-text/40">
      Loading map…
    </div>
  ),
});

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

  const metrics = useMemo<Preference[]>(() => {
    const raw = params.get("metrics");
    if (!raw) return [];
    return raw
      .split(",")
      .map((pair) => {
        const [name, importance] = pair.split(":");
        return { name, importance: Number(importance) || 1 };
      })
      .filter((m) => m.name);
  }, [params]);

  // Re-score and re-rank the matches against this user's weighted priorities.
  const ranked = useMemo(() => rankMatches(metrics), [metrics]);

  // Which factors the user actually prioritized (for highlighting).
  const prioritizedFactors = useMemo(() => {
    const set = new Set<string>();
    for (const m of metrics) {
      const f = preferenceToFactor(m.name);
      if (f) set.add(f);
    }
    return set;
  }, [metrics]);

  const personalized = ranked.some((m) => m.personalized);

  const [selectedId, setSelectedId] = useState(ranked[0].id);
  const selected = ranked.find((m) => m.id === selectedId) ?? ranked[0];
  const topId = ranked[0].id;

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
                {metrics.map((m, i) => {
                  const scored = preferenceToFactor(m.name) !== null;
                  return (
                    <li key={i}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-medium text-brand-text">
                          {m.name}
                          {!scored && (
                            <span
                              title="No neighborhood data for this yet — it won't affect scores."
                              className="rounded bg-brand-text/5 px-1.5 py-0.5 text-[10px] font-semibold text-brand-text/40"
                            >
                              no data
                            </span>
                          )}
                        </span>
                        <span className="text-xs font-semibold text-brand-text/50">
                          {m.importance}/4
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-brand-bg">
                        <div
                          className={`h-full rounded-full ${
                            scored ? "bg-brand-gradient" : "bg-brand-text/15"
                          }`}
                          style={{ width: `${(m.importance / 4) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="rounded-2xl bg-brand-green/10 p-5">
            <p className="text-sm font-semibold text-brand-text">
              {ranked.length} familiar matches
            </p>
            <p className="mt-1 text-xs text-brand-text/60">
              {personalized
                ? "Ranked and scored by your priorities. Tap a pin to see why."
                : "Tap a pin on the map to see why it fits."}
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

          <div className="relative mt-2 h-[440px] w-full overflow-hidden rounded-xl">
            <NeighborhoodMap
              matches={ranked}
              selectedId={selectedId}
              topId={topId}
              onSelect={setSelectedId}
            />
          </div>
        </section>

        {/* Right — selected detail */}
        <aside>
          <DetailPanel
            match={selected}
            originCity={from}
            destCity={to}
            isTop={selected.id === topId}
            prioritizedFactors={prioritizedFactors}
          />
        </aside>
      </div>
    </main>
  );
}

function DetailPanel({
  match,
  originCity,
  destCity,
  isTop,
  prioritizedFactors,
}: {
  match: ScoredMatch;
  originCity: string;
  destCity: string;
  isTop: boolean;
  prioritizedFactors: Set<string>;
}) {
  const showBaseline =
    match.personalized && match.personalizedScore !== match.score;

  return (
    <div className="card sticky top-6 overflow-hidden">
      <div className="bg-brand-gradient p-6 text-white">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">
            Feels like home
          </p>
          {isTop && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              ★ Top match
            </span>
          )}
        </div>
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
          <span className="text-sm font-semibold">
            {match.personalized ? "Your match score" : "Match score"}
          </span>
          <span className="text-2xl font-extrabold">
            {match.personalizedScore}
            <span className="text-sm font-semibold text-white/60">/100</span>
          </span>
        </div>
        {showBaseline && (
          <p className="mt-2 text-center text-xs text-white/70">
            Overall similarity {match.score}/100 · re-scored for your priorities
          </p>
        )}
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
          {match.factors.map((f) => {
            const prioritized = prioritizedFactors.has(f.label);
            return (
              <li key={f.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-brand-text">
                    {f.label}
                    {prioritized && (
                      <span className="rounded bg-brand-purple/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-purple">
                        Priority
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-semibold text-brand-text/50">
                    {f.value}
                  </span>
                </div>
                <div
                  className={`mt-1.5 h-2 w-full rounded-full bg-brand-bg ${
                    prioritized ? "ring-1 ring-brand-purple/30" : ""
                  }`}
                >
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
            );
          })}
        </ul>
      </div>
    </div>
  );
}
