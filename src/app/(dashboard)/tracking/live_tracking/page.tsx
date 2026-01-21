"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export default function LiveTracking() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-150px)]">
      <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl mb-6">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            <Icon icon="gis:map-poi" className="inline mr-2" />
            Live Tracking
          </h1>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              En ligne
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-md h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Icon icon="gis:map-poi" className="text-6xl mx-auto mb-4 text-yellow-300" />
          <p className="text-lg font-medium">Carte de suivi en temps reel</p>
          <p className="text-sm text-gray-400 mt-2">
            Integrez Google Maps pour afficher la position des vehicules
          </p>
        </div>
      </div>
    </div>
  );
}
