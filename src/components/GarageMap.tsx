"use client";

import { useCallback, useState, memo } from "react";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { GaragesProps } from "@/services/garage-service";
import { Icon } from "@iconify/react";

const containerStyle = {
  height: "500px",
  width: "100%",
  borderRadius: "12px",
  border: "1px solid #E5E7EB",
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

const defaultCenter = {
  lat: 14.749400000938664,
  lng: -17.459984044033966,
};

type GarageMapProps = {
  garages: GaragesProps[];
  onEdit: (code: string) => void;
};

const GarageMap: React.FC<GarageMapProps> = ({ garages, onEdit }) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyD-IBc7SfwgdU8AYQPePiNa0Byd3JNXkzQ",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedGarage, setSelectedGarage] = useState<GaragesProps | null>(null);
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);

  const onLoad = useCallback((map: google.maps.Map) => {
    map.setCenter(defaultCenter);
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleGarageClick = (garage: GaragesProps) => {
    setSelectedGarage(garage);
    setIsInfoWindowOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  if (garages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-gray-50 rounded-xl border border-gray-200">
        <Icon icon="mdi:map-marker-off" className="text-6xl text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg font-medium">Aucun garage a afficher sur la carte</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={12}
      onLoad={onLoad}
      options={{ styles: customMapStyles }}
      onUnmount={onUnmount}
    >
      {garages.map((garage) => (
        <Marker
          key={garage.id}
          title={garage.name}
          position={{ lat: garage.latitude, lng: garage.longitude }}
          onClick={() => handleGarageClick(garage)}
          label={{
            text: garage.name,
            color: "black",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        />
      ))}

      {isInfoWindowOpen && selectedGarage && (
        <InfoWindow
          position={{
            lat: selectedGarage.latitude,
            lng: selectedGarage.longitude,
          }}
          onCloseClick={() => setIsInfoWindowOpen(false)}
        >
          <div className="p-2">
            <h3 className="text-lg font-bold mb-2">{selectedGarage.name}</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Responsable:</span> {selectedGarage.responsiblePerson}
              </p>
              <p>
                <span className="font-medium">Contact:</span> {selectedGarage.phoneNumber}
              </p>
              <p>
                <span className="font-medium">Adresse:</span> {selectedGarage.address}
              </p>
            </div>
            <button
              onClick={() => onEdit(selectedGarage.code)}
              className="mt-3 w-full px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:pencil" />
              Modifier
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default memo(GarageMap);
