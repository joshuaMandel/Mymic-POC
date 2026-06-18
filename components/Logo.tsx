import Link from "next/link";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-sheen text-sm font-bold text-white shadow-glow transition-transform duration-200 group-hover:scale-105">
        M
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/40" />
      </span>
      <span
        className={`text-lg font-extrabold tracking-tight ${
          light ? "text-white" : "text-brand-text"
        }`}
      >
        MyMik
      </span>
    </Link>
  );
}
