"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import { SERVICE_CHAUFFEUR, TrackingDriver } from "@/services/chauffeur-service";

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

  const filteredDriversList = drivers.filter((d) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      d.name?.toLowerCase().includes(search) ||
      d.phone?.toLowerCase().includes(search) ||
      d.matricule?.toLowerCase().includes(search)
    );
  });

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
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            <Icon icon="gis:map-poi" className="inline mr-2" />
            Live Tracking
          </h1>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <Icon icon="mdi:circle" className="inline mr-1 text-xs animate-pulse" />
              {driversWithLocation.length} en ligne
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              {totalDrivers} total
            </span>
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
              filteredDriversList.map((driver) => (
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
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          driver.latitude && driver.longitude
                            ? "bg-green-500"
                            : "bg-gray-400"
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
                    {driver.latitude && driver.longitude ? (
                      <Icon icon="mdi:map-marker" className="text-green-500" />
                    ) : (
                      <Icon icon="mdi:map-marker-off" className="text-gray-300" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-gray-400">
                <Icon icon="mdi:account-search" className="text-3xl mx-auto mb-2" />
                <p className="text-sm">Aucun chauffeur trouve</p>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={defaultCenter}
              zoom={12}
              onLoad={onMapLoad}
              options={{ styles: customMapStyles }}
            >
              {driversWithLocation.map((driver) => (
                <Marker
                  key={driver.matricule}
                  position={{
                    lat: driver.latitude!,
                    lng: driver.longitude!,
                  }}
                  title={driver.name}
                  icon={{
                    url: "/taxi.png",
                    scaledSize: new google.maps.Size(50, 25),
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
                    <div className="p-2 min-w-[200px]">
                      <h3 className="text-base font-bold mb-2">
                        {selectedDriver.name}
                      </h3>
                      <div className="space-y-1 text-sm">
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
                      </div>
                    </div>
                  </InfoWindow>
                )}
            </GoogleMap>
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
