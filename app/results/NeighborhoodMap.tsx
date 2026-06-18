"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ScoredMatch } from "@/lib/data";

type Props = {
  matches: ScoredMatch[];
  selectedId: string;
  topId: string;
  onSelect: (id: string) => void;
};

function markerIcon(match: ScoredMatch, active: boolean, isTop: boolean) {
  const bg = match.color;
  return L.divIcon({
    className: "mymik-marker",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `
      <div style="transform: translate(-50%, -100%); text-align: center; cursor: pointer;">
        <div style="
          display: inline-flex; align-items: center; gap: 6px;
          background: ${bg}; color: #fff; border-radius: 9999px;
          padding: 6px 10px; white-space: nowrap;
          font-family: Inter, system-ui, sans-serif;
          border: 2px solid ${active ? "#ffffff" : "transparent"};
          box-shadow: 0 6px 16px rgba(31,41,55,${active ? "0.45" : "0.3"});
          transform: scale(${active ? 1.08 : 1}); transform-origin: bottom center;
          transition: transform 120ms ease;
        ">
          ${isTop ? '<span style="font-size:12px;">★</span>' : ""}
          <span style="font-weight:700; font-size:13px; line-height:1;">${match.familiar}</span>
          <span style="
            background: rgba(255,255,255,0.28); border-radius:9999px;
            padding:2px 6px; font-size:11px; font-weight:700; line-height:1;
          ">${match.personalizedScore}</span>
        </div>
        <div style="
          width:0; height:0; margin:-1px auto 0;
          border-left:6px solid transparent; border-right:6px solid transparent;
          border-top:7px solid ${bg};
        "></div>
      </div>
    `,
  });
}

/** Fit the map to show every marker once, on mount. */
function FitToMatches({ matches }: { matches: ScoredMatch[] }) {
  const map = useMap();
  useEffect(() => {
    if (matches.length === 0) return;
    const bounds = L.latLngBounds(
      matches.map((m) => [m.coords.lat, m.coords.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [map, matches]);
  return null;
}

/** Gently pan to the selected marker when it changes. */
function PanToSelected({
  matches,
  selectedId,
}: {
  matches: ScoredMatch[];
  selectedId: string;
}) {
  const map = useMap();
  useEffect(() => {
    const m = matches.find((x) => x.id === selectedId);
    if (m) map.panTo([m.coords.lat, m.coords.lng], { animate: true });
  }, [map, matches, selectedId]);
  return null;
}

export default function NeighborhoodMap({
  matches,
  selectedId,
  topId,
  onSelect,
}: Props) {
  return (
    <MapContainer
      center={[39.7392, -104.9903]}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "#EAEEF3" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitToMatches matches={matches} />
      <PanToSelected matches={matches} selectedId={selectedId} />
      {matches.map((m) => (
        <Marker
          key={m.id}
          position={[m.coords.lat, m.coords.lng]}
          icon={markerIcon(m, m.id === selectedId, m.id === topId)}
          zIndexOffset={m.id === selectedId ? 1000 : m.id === topId ? 500 : 0}
          eventHandlers={{ click: () => onSelect(m.id) }}
        />
      ))}
    </MapContainer>
  );
}
