"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Icon } from "@iconify/react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import { SERVICE_CHAUFFEUR, TrackingDriver, ConnectionQuality } from "@/services/chauffeur-service";

const GOOGLE_MAPS_API_KEY = "AIzaSyD-IBc7SfwgdU8AYQPePiNa0Byd3JNXkzQ";
const POLLING_INTERVAL = 3000; // 3 secondes

const defaultCenter = {
  lat: 14.749400000938664,
  lng: -17.459984044033966,
};

const containerStyle = {
  height: "100%",
  width: "100%",
  borderRadius: "12px",
};

const CONNECTION_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; text: string; dot: string; markerColor: string }
> = {
  GOOD: {
    label: "Bonne",
    color: "#22c55e",
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
    markerColor: "#16a34a",
  },
  POOR: {
    label: "Mauvaise",
    color: "#f97316",
    bg: "bg-orange-100",
    text: "text-orange-700",
    dot: "bg-orange-500",
    markerColor: "#ea580c",
  },
  DISCONNECTED: {
    label: "Deconnecte",
    color: "#ef4444",
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
    markerColor: "#dc2626",
  },
};

function getConnectionConfig(quality: ConnectionQuality | null | undefined) {
  if (!quality || !CONNECTION_CONFIG[quality]) {
    // Fallback GOOD car les chauffeurs du live_tracking sont en ligne
    return CONNECTION_CONFIG.GOOD;
  }
  return CONNECTION_CONFIG[quality];
}

// Crée une icône SVG de taxi colorée selon la qualité de connexion
function createColoredMarkerIcon(quality: ConnectionQuality | null | undefined) {
  const config = getConnectionConfig(quality);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <defs>
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <!-- Pin shape -->
      <path d="M20 47 C20 47 36 30 36 18 C36 9.2 28.8 2 20 2 C11.2 2 4 9.2 4 18 C4 30 20 47 20 47Z"
            fill="${config.markerColor}" filter="url(#shadow)" stroke="white" stroke-width="2"/>
      <!-- Car icon -->
      <g transform="translate(10, 8)">
        <rect x="2" y="6" width="16" height="10" rx="3" fill="white"/>
        <rect x="4" y="3" width="12" height="6" rx="2" fill="white"/>
        <circle cx="6" cy="17" r="2" fill="${config.markerColor}"/>
        <circle cx="14" cy="17" r="2" fill="${config.markerColor}"/>
      </g>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const customMapStyles = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#F5DF4D" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#82CEF9" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#eaeaea" }],
  },
];

export default function LiveTracking() {
  const [drivers, setDrivers] = useState<TrackingDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<TrackingDriver | null>(null);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterQuality, setFilterQuality] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await SERVICE_CHAUFFEUR.getLiveTracking();
      if (res.status === 200 && res.data) {
        setDrivers(res.data.drivers || []);
        setTotalDrivers(res.data.total || 0);
      }
    } catch (error) {
      console.error("Erreur live tracking:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
    const intervalId = setInterval(fetchDrivers, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchDrivers]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleDriverClick = (driver: TrackingDriver) => {
    setSelectedDriver(driver);
    if (mapRef.current && driver.latitude && driver.longitude) {
      mapRef.current.panTo({ lat: driver.latitude, lng: driver.longitude });
      mapRef.current.setZoom(15);
    }
  };

  const driversWithLocation = drivers.filter(
    (d) => d.latitude !== null && d.longitude !== null
  );

  // Compteurs par qualité de connexion
  const connectionCounts = useMemo(() => {
    const counts = { GOOD: 0, POOR: 0, DISCONNECTED: 0 };
    driversWithLocation.forEach((d) => {
      const q = d.connectionQuality;
      if (q && counts[q] !== undefined) {
        counts[q]++;
      } else {
        counts.GOOD++;
      }
    });
    return counts;
  }, [driversWithLocation]);

  const filteredDriversList = drivers.filter((d) => {
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !search ||
      d.name?.toLowerCase().includes(search) ||
      d.phone?.toLowerCase().includes(search) ||
      d.matricule?.toLowerCase().includes(search);

    const matchesFilter =
      !filterQuality ||
      (d.connectionQuality || "GOOD") === filterQuality;

    return matchesSearch && matchesFilter;
  });

  const filteredDriversOnMap = filterQuality
    ? driversWithLocation.filter(
        (d) => (d.connectionQuality || "GOOD") === filterQuality
      )
    : driversWithLocation;

  if (loading && !isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl mb-4">
        <div className="p-4 flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-semibold text-gray-800">
            <Icon icon="gis:map-poi" className="inline mr-2" />
            Live Tracking
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Compteur total en ligne */}
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <Icon icon="mdi:circle" className="inline mr-1 text-xs animate-pulse" />
              {driversWithLocation.length} en ligne
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              {totalDrivers} total
            </span>
            {/* Séparateur */}
            <div className="w-px h-6 bg-gray-300 mx-1" />
            {/* Compteurs par qualité de connexion */}
            {(["GOOD", "POOR", "DISCONNECTED"] as const).map((quality) => {
              const config = CONNECTION_CONFIG[quality];
              const count = connectionCounts[quality];
              const isActive = filterQuality === quality;
              return (
                <button
                  key={quality}
                  onClick={() =>
                    setFilterQuality(isActive ? null : quality)
                  }
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? `${config.bg} ${config.text} ring-2 ring-offset-1 ring-current`
                      : `${config.bg} ${config.text} opacity-80 hover:opacity-100`
                  }`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${config.dot} mr-1.5`}
                  />
                  {count} {config.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar - Liste des chauffeurs */}
        <div className="w-80 bg-white border border-gray-200 rounded-xl shadow-md flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher un chauffeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none"
              />
            </div>
          </div>

          {/* Driver list */}
          <div className="flex-1 overflow-y-auto">
            {filteredDriversList.length > 0 ? (
              filteredDriversList.map((driver) => {
                const connConfig = getConnectionConfig(driver.connectionQuality);
                const hasLocation = driver.latitude && driver.longitude;
                return (
                  <button
                    key={driver.matricule}
                    onClick={() => handleDriverClick(driver)}
                    className={`w-full text-left p-3 border-b border-gray-50 hover:bg-yellow-50 transition-colors ${
                      selectedDriver?.matricule === driver.matricule
                        ? "bg-yellow-50 border-l-4 border-l-yellow-400"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Icon icon="mdi:account" className="text-xl text-gray-500" />
                        </div>
                        {/* Indicateur de connexion coloré */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            hasLocation ? connConfig.dot : "bg-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {driver.name}
                        </p>
                        <p className="text-xs text-gray-500">{driver.phone}</p>
                        {driver.vehicule && driver.vehicule.length > 0 && (
                          <p className="text-xs text-gray-400">
                            {driver.vehicule[0].brand} {driver.vehicule[0].model}
                          </p>
                        )}
                      </div>
                      {/* Badge qualité connexion */}
                      {hasLocation ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${connConfig.bg} ${connConfig.text}`}
                        >
                          {connConfig.label}
                        </span>
                      ) : (
                        <Icon icon="mdi:map-marker-off" className="text-gray-300" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-gray-400">
                <Icon icon="mdi:account-search" className="text-3xl mx-auto mb-2" />
                <p className="text-sm">Aucun chauffeur trouve</p>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden relative">
          {isLoaded ? (
            <>
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={12}
                onLoad={onMapLoad}
                options={{ styles: customMapStyles }}
              >
                {filteredDriversOnMap.map((driver) => (
                  <Marker
                    key={driver.matricule}
                    position={{
                      lat: driver.latitude!,
                      lng: driver.longitude!,
                    }}
                    title={`${driver.name} - Connexion: ${getConnectionConfig(driver.connectionQuality).label}`}
                    icon={{
                      url: createColoredMarkerIcon(driver.connectionQuality),
                      scaledSize: new google.maps.Size(40, 48),
                      anchor: new google.maps.Point(20, 48),
                    }}
                    onClick={() => setSelectedDriver(driver)}
                  />
                ))}

                {selectedDriver &&
                  selectedDriver.latitude &&
                  selectedDriver.longitude && (
                    <InfoWindow
                      position={{
                        lat: selectedDriver.latitude,
                        lng: selectedDriver.longitude,
                      }}
                      onCloseClick={() => setSelectedDriver(null)}
                    >
                      <div className="p-2 min-w-[220px]">
                        <h3 className="text-base font-bold mb-2">
                          {selectedDriver.name}
                        </h3>
                        <div className="space-y-1.5 text-sm">
                          <p>
                            <span className="font-medium">Tel:</span>{" "}
                            {selectedDriver.phone}
                          </p>
                          <p>
                            <span className="font-medium">Matricule:</span>{" "}
                            {selectedDriver.matricule}
                          </p>
                          {selectedDriver.vehicule &&
                            selectedDriver.vehicule.length > 0 && (
                              <>
                                <p>
                                  <span className="font-medium">Vehicule:</span>{" "}
                                  {selectedDriver.vehicule[0].brand}{" "}
                                  {selectedDriver.vehicule[0].model}
                                </p>
                                <p>
                                  <span className="font-medium">Annee:</span>{" "}
                                  {selectedDriver.vehicule[0].year}
                                </p>
                              </>
                            )}
                          {/* Qualité de connexion dans l'infobulle */}
                          <div className="pt-1.5 mt-1.5 border-t border-gray-200">
                            <span className="font-medium">Connexion:</span>{" "}
                            <span
                              className="inline-flex items-center gap-1 font-semibold"
                              style={{
                                color: getConnectionConfig(
                                  selectedDriver.connectionQuality
                                ).color,
                              }}
                            >
                              <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: getConnectionConfig(
                                    selectedDriver.connectionQuality
                                  ).color,
                                }}
                              />
                              {getConnectionConfig(selectedDriver.connectionQuality).label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
              </GoogleMap>

              {/* Légende sur la carte */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">Qualite de connexion</p>
                <div className="space-y-1.5">
                  {(["GOOD", "POOR", "DISCONNECTED"] as const).map((q) => {
                    const cfg = CONNECTION_CONFIG[q];
                    return (
                      <div key={q} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span className="text-gray-700">{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
