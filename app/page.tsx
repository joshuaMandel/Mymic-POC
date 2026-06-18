import Link from "next/link";
import Logo from "@/components/Logo";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40">
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-5 py-3 glass-strong">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-brand-text/70 sm:flex">
            <a href="#how" className="transition-colors hover:text-brand-purple">
              How it works
            </a>
            <a
              href="#example"
              className="transition-colors hover:text-brand-purple"
            >
              Why MyMik
            </a>
            <Link
              href="/match"
              className="btn-gradient !px-4 !py-2 text-sm shadow-soft"
            >
              Start matching
            </Link>
          </nav>
          <Link href="/match" className="btn-gradient !px-4 !py-2 text-sm sm:hidden">
            Start
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-14 md:grid-cols-2 md:py-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-semibold text-brand-green shadow-sm backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-green" />
            Relocation, decoded
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-brand-text sm:text-6xl">
            Find where your life fits in a{" "}
            <span className="text-gradient bg-[length:200%_auto] animate-gradient">
              new city
            </span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-brand-text/70">
            MyMik translates the neighborhoods you know into the city you&apos;re
            moving to — familiar names, on an unfamiliar map.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/match" className="btn-gradient text-base">
              Start matching
              <span className="ml-2">→</span>
            </Link>
            <a
              href="#how"
              className="rounded-xl border border-white/60 bg-white/50 px-5 py-3 text-sm font-semibold text-brand-text/70 backdrop-blur transition-colors hover:text-brand-purple"
            >
              See how it works
            </a>
          </div>

          <dl className="mt-12 flex gap-8">
            {[
              { k: "3", v: "demo city pairs" },
              { k: "25+", v: "neighborhoods mapped" },
              { k: "<10s", v: "to your matches" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="text-2xl font-extrabold text-brand-text">{s.k}</dt>
                <dd className="text-xs font-medium text-brand-text/50">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Floating glass preview card */}
        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="absolute -left-6 -top-8 h-40 w-40 rounded-full bg-brand-purple/30 blur-2xl" />
          <div className="absolute -bottom-10 -right-6 h-48 w-48 rounded-full bg-brand-green/30 blur-2xl" />
          <div className="relative animate-float glass-strong p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/40">
              Your match preview
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex-1 rounded-2xl border border-white/60 bg-white/70 p-4 text-center backdrop-blur">
                <p className="text-xs font-medium text-brand-text/50">You know</p>
                <p className="mt-1 text-lg font-bold text-brand-text">Kirkwood</p>
                <p className="text-xs text-brand-text/50">St. Louis</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-sheen text-white shadow-glow">
                →
              </div>
              <div className="flex-1 rounded-2xl border border-brand-purple/20 bg-brand-purple/10 p-4 text-center backdrop-blur">
                <p className="text-xs font-medium text-brand-text/50">Feels like</p>
                <p className="mt-1 text-lg font-bold text-brand-purple">
                  Wheat Ridge
                </p>
                <p className="text-xs text-brand-text/50">Denver</p>
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/60 bg-white/60 px-4 py-3 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-text">
                  Match score
                </span>
                <span className="text-lg font-extrabold text-brand-green">
                  87
                  <span className="text-sm font-semibold text-brand-text/40">
                    /100
                  </span>
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brand-bg">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-green to-brand-purple"
                  style={{ width: "87%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            How MyMik works
          </h2>
          <p className="mt-3 text-brand-text/60">
            Three steps from a city you know to one you&apos;ll understand.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Tell us where you're from",
              body: "Your current city, destination, and the neighborhood you call home today.",
            },
            {
              step: "2",
              title: "Rank what matters",
              body: "Nightlife, outdoors, schools, faith communities — weight the things you care about.",
            },
            {
              step: "3",
              title: "See familiar names on a new map",
              body: "We label your destination with neighborhoods you already understand.",
            },
          ].map((item, i) => (
            <div
              key={item.step}
              className="group glass animate-fade-up p-7 transition-transform duration-200 hover:-translate-y-1"
              style={{ animationDelay: `${i * 110}ms` }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-sheen text-lg font-bold text-white shadow-glow">
                {item.step}
              </span>
              <h3 className="mt-5 text-lg font-bold text-brand-text">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-text/60">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section id="example" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl p-10 text-center shadow-glow md:p-16">
          <div className="absolute inset-0 bg-brand-sheen bg-[length:200%_auto] animate-gradient" />
          <div className="absolute -left-10 top-0 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-brand-green/30 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Moving shouldn&apos;t feel like starting over.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Translate the neighborhoods you love into your next home town in
              seconds.
            </p>
            <Link
              href="/match"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-brand-purple shadow-soft transition-transform hover:scale-[1.03]"
            >
              Start matching →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/40 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-brand-text/50">
          <Logo />
          <p>© {new Date().getFullYear()} MyMik · Demo</p>
        </div>
      </footer>
    </main>
  );
}
