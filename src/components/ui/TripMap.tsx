"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SERVICE_COURSE, TripLocation } from "@/services/course-service";
import { LocationInfo } from "@/services/course-service";

const getStartIcon = () =>
  new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const getEndIcon = () =>
  new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, bounds]);
  return null;
}

// Recuperer l'itineraire routier via OSRM (gratuit, pas de cle API)
async function fetchRoute(
  pickup: [number, number],
  dropoff: [number, number]
): Promise<[number, number][]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${dropoff[1]},${dropoff[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.routes && data.routes.length > 0) {
    // OSRM retourne [lng, lat], on convertit en [lat, lng]
    return data.routes[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    );
  }
  return [];
}

type TripMapProps = {
  bookingId: string;
  pickup: LocationInfo;
  dropoff: LocationInfo;
};

export default function TripMap({ bookingId, pickup, dropoff }: TripMapProps) {
  const [locations, setLocations] = useState<TripLocation[]>([]);
  const [routePositions, setRoutePositions] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [hasGpsTrace, setHasGpsTrace] = useState(false);

  const pickupPos: [number, number] = [pickup.latitude, pickup.longitude];
  const dropoffPos: [number, number] = [dropoff.latitude, dropoff.longitude];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // 1. Essayer de recuperer la trace GPS
        let gpsPoints: TripLocation[] = [];
        try {
          const res = await SERVICE_COURSE.getTripLocations(bookingId);
          gpsPoints = res.data || [];
        } catch {
          // pas de trace GPS disponible
        }

        if (gpsPoints.length > 1) {
          setLocations(gpsPoints);
          setHasGpsTrace(true);
        } else {
          // 2. Pas de trace GPS -> recuperer l'itineraire routier via OSRM
          setHasGpsTrace(false);
          try {
            const route = await fetchRoute(pickupPos, dropoffPos);
            setRoutePositions(route);
          } catch {
            // fallback: ligne droite
            setRoutePositions([pickupPos, dropoffPos]);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  // Polyline: trace GPS ou itineraire routier
  const polylinePositions: [number, number][] = hasGpsTrace
    ? locations
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((loc) => [loc.latitude, loc.longitude])
    : routePositions.length > 0
      ? routePositions
      : [pickupPos, dropoffPos];

  // Bounds
  const allPoints: [number, number][] = [pickupPos, dropoffPos, ...polylinePositions];
  const bounds = L.latLngBounds(allPoints.map(([lat, lng]) => L.latLng(lat, lng)));

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:map-marker-path" className="text-yellow-500" />
          Itineraire
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-300"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Icon icon="mdi:map-marker-path" className="text-yellow-500" />
        Itineraire
        {hasGpsTrace ? (
          <span className="text-xs font-normal bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full ml-2">
            Trace GPS - {locations.length} points
          </span>
        ) : (
          <span className="text-xs font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2">
            Itineraire estime
          </span>
        )}
      </h3>

      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 400 }}>
        <MapContainer
          center={pickupPos}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds bounds={bounds} />

          {/* Route line */}
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: hasGpsTrace ? "#2563eb" : "#f59e0b",
              weight: 5,
              opacity: 0.85,
            }}
          />

          {/* Pickup marker */}
          <Marker position={pickupPos} icon={getStartIcon()}>
            <Popup>
              <strong>Depart</strong>
              <br />
              {pickup.address}
            </Popup>
          </Marker>

          {/* Dropoff marker */}
          <Marker position={dropoffPos} icon={getEndIcon()}>
            <Popup>
              <strong>Arrivee</strong>
              <br />
              {dropoff.address}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
