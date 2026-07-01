"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (city: string) => void;
  options: string[];
  liveSet?: Set<string>;
  placeholder?: string;
};

const MAX_SUGGESTIONS = 8;

export default function CityTypeahead({
  label,
  value,
  onChange,
  options,
  liveSet,
  placeholder,
}: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

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

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const isLive = (c: string) => (liveSet?.has(c) ? 1 : 0);
    const pool = q
      ? options.filter((c) => c.toLowerCase().includes(q))
      : options;
    // Rank: live first, then names that start with the query, then alphabetical.
    return [...pool]
      .sort((a, b) => {
        const live = isLive(b) - isLive(a);
        if (live) return live;
        const sa = a.toLowerCase().startsWith(q) ? 1 : 0;
        const sb = b.toLowerCase().startsWith(q) ? 1 : 0;
        if (sb - sa) return sb - sa;
        return a.localeCompare(b);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [query, options, liveSet]);

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
                choose(suggestions[active]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </label>

      {open && suggestions.length > 0 && (
        <ul className="glass-strong absolute z-50 mt-1 max-h-64 w-full overflow-auto py-1 text-sm">
          {suggestions.map((city, i) => {
            const live = liveSet?.has(city);
            return (
              <li
                key={city}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(city);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 ${
                  i === active ? "bg-brand-purple/10" : ""
                }`}
              >
                <span className="text-brand-text">{city}</span>
                {live && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                    live
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
