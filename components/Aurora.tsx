/**
 * Fixed, animated color-cloud backdrop that the glass surfaces blur over.
 * Purely decorative — sits behind all content.
 */
export default function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -left-32 -top-40 h-[42rem] w-[42rem] rounded-full bg-brand-purple/30 blur-[130px] animate-float-slow" />
      <div className="absolute right-[-10rem] top-1/4 h-[38rem] w-[38rem] rounded-full bg-brand-green/25 blur-[130px] animate-float" />
      <div
        className="absolute bottom-[-12rem] left-1/3 h-[36rem] w-[36rem] rounded-full bg-brand-lilac/30 blur-[130px] animate-float-slow"
        style={{ animationDelay: "3s" }}
      />
      {/* subtle wash to keep text legible over the brightest blobs */}
      <div className="absolute inset-0 bg-brand-bg/40" />
    </div>
  );
}
