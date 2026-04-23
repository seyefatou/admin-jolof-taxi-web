"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { HeatmapPoint } from "@/services/analytics-service";

type HeatmapCanvasProps = {
  points: HeatmapPoint[];
  type: "pickup" | "dropoff";
};

const DAKAR_CENTER: [number, number] = [14.6928, -17.4467];

export default function HeatmapCanvas({ points, type }: HeatmapCanvasProps) {
  const normalized = useMemo(() => {
    return points
      .map((p) => {
        const lat = Number(p.latitude ?? p.lat);
        const lng = Number(p.longitude ?? p.lng);
        const count = Number(p.count ?? p.weight ?? 1);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng, count };
      })
      .filter((p): p is { lat: number; lng: number; count: number } => p !== null);
  }, [points]);

  const maxCount = useMemo(
    () => normalized.reduce((acc, p) => Math.max(acc, p.count), 1),
    [normalized]
  );

  const color = type === "pickup" ? "#eab308" : "#3b82f6";

  return (
    <MapContainer
      center={DAKAR_CENTER}
      zoom={12}
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {normalized.map((p, i) => {
        const ratio = p.count / maxCount;
        const radius = 8 + ratio * 22;
        const opacity = 0.3 + ratio * 0.5;
        return (
          <CircleMarker
            key={i}
            center={[p.lat, p.lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: opacity,
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">
                  {type === "pickup" ? "Point de depart" : "Point d'arrivee"}
                </p>
                <p>Courses: <strong>{p.count}</strong></p>
                <p className="text-gray-500">
                  {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
