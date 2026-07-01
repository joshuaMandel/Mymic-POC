"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
};

type Suggestion = { city: string; live: boolean };

/**
 * City type-ahead backed by /api/cities (the full ~32k Census Places list
 * stays server-side — it used to ship ~150kB of JSON to every browser).
 * Suggestions are debounced per keystroke; stale responses are discarded.
 */
export default function CityTypeahead({ label, value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => setQuery(value), [value]);

  // Close the suggestion list when clicking outside.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Debounced server-side search; ZIP-like input gets no city suggestions
  // (the match page handles ZIP detection separately).
  useEffect(() => {
    const q = query.trim();
    if (/^\d/.test(q)) {
      setSuggestions([]);
      return;
    }
    const mySeq = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        if (mySeq === seq.current) setSuggestions(data.suggestions ?? []);
      } catch {
        if (mySeq === seq.current) setSuggestions([]);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  function choose(city: string) {
    onChange(city);
    setQuery(city);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-brand-text">
          {label}
        </span>
        <input
          className="input"
          value={query}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open) {
              if (e.key === "ArrowDown") setOpen(true);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              if (suggestions[active]) {
                e.preventDefault();
                choose(suggestions[active].city);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </label>

      {open && suggestions.length > 0 && (
        <ul className="glass-strong absolute z-50 mt-1 max-h-64 w-full overflow-auto py-1 text-sm">
          {suggestions.map((s, i) => (
            <li
              key={s.city}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s.city);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 ${
                i === active ? "bg-brand-purple/10" : ""
              }`}
            >
              <span className="text-brand-text">{s.city}</span>
              {s.live && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                  live
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
