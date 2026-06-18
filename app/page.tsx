import Link from "next/link";
import Logo from "@/components/Logo";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-brand-text/70 sm:flex">
          <a href="#how" className="transition-colors hover:text-brand-purple">
            How it works
          </a>
          <a href="#example" className="transition-colors hover:text-brand-purple">
            Example
          </a>
          <Link
            href="/match"
            className="rounded-lg px-4 py-2 text-brand-purple transition-colors hover:bg-brand-purple/10"
          >
            Start matching
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 md:grid-cols-2 md:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-green">
            <span className="h-2 w-2 rounded-full bg-brand-green" />
            Relocation, decoded
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-brand-text sm:text-5xl lg:text-6xl">
            Find where your life fits in a{" "}
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              new city
            </span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-brand-text/70">
            MyMik translates the neighborhoods you know into the city you&apos;re
            moving to.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/match" className="btn-gradient text-base">
              Start matching
            </Link>
            <a
              href="#how"
              className="text-sm font-semibold text-brand-text/70 transition-colors hover:text-brand-purple"
            >
              See how it works →
            </a>
          </div>
        </div>

        {/* Mock visual card */}
        <div className="relative">
          <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-brand-purple/20 blur-2xl" />
          <div className="absolute -bottom-8 -right-4 h-40 w-40 rounded-full bg-brand-green/20 blur-2xl" />
          <div className="card relative p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/40">
              Your match preview
            </p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex-1 rounded-xl bg-brand-bg p-4 text-center">
                <p className="text-xs font-medium text-brand-text/50">You know</p>
                <p className="mt-1 text-lg font-bold text-brand-text">Kirkwood</p>
                <p className="text-xs text-brand-text/50">St. Louis</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-soft">
                →
              </div>
              <div className="flex-1 rounded-xl bg-brand-purple/5 p-4 text-center ring-1 ring-brand-purple/20">
                <p className="text-xs font-medium text-brand-text/50">Feels like</p>
                <p className="mt-1 text-lg font-bold text-brand-purple">
                  Wheat Ridge
                </p>
                <p className="text-xs text-brand-text/50">Denver</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-brand-green/10 px-4 py-3">
              <span className="text-sm font-semibold text-brand-text">
                Match score
              </span>
              <span className="text-lg font-extrabold text-brand-green">
                87<span className="text-sm font-semibold text-brand-text/40">/100</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight text-brand-text">
          How MyMik works
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
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
          ].map((item) => (
            <div key={item.step} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10 text-lg font-bold text-brand-purple">
                {item.step}
              </span>
              <h3 className="mt-4 text-lg font-bold text-brand-text">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-brand-text/60">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example CTA strip */}
      <section id="example" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-3xl bg-brand-gradient p-10 text-center shadow-soft md:p-16">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Moving to a new city shouldn&apos;t feel like starting over.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Translate the neighborhoods you love into your next home town in
            seconds.
          </p>
          <Link
            href="/match"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-brand-purple shadow-soft transition-transform hover:scale-[1.02]"
          >
            Start matching
          </Link>
        </div>
      </section>

      <footer className="border-t border-brand-text/5 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-brand-text/50">
          <Logo />
          <p>© {new Date().getFullYear()} MyMik · Demo</p>
        </div>
      </footer>
    </main>
  );
}
