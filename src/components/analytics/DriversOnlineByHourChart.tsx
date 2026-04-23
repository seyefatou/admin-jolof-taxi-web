"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { SERVICE_ANALYTICS, DriversOnlineByHourEntry } from "@/services/analytics-service";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const formatHourLabel = (h: number) => `${String(h).padStart(2, "0")}h`;

export default function DriversOnlineByHourChart() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<DriversOnlineByHourEntry[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await SERVICE_ANALYTICS.getDriversOnlineByHour();
        if (cancelled) return;
        setEntries(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        console.error("drivers/online-by-hour:", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.hour - b.hour);
    return {
      labels: sorted.map((e) => formatHourLabel(e.hour)),
      datasets: [
        {
          label: "Chauffeurs en ligne",
          data: sorted.map((e) => e.count),
          borderColor: "#eab308",
          backgroundColor: "rgba(250, 204, 21, 0.2)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "#eab308",
        },
      ],
    };
  }, [entries]);

  const peak = useMemo(() => {
    let maxCount = 0;
    let maxHour: number | null = null;
    for (const e of entries) {
      if (e.count > maxCount) {
        maxCount = e.count;
        maxHour = e.hour;
      }
    }
    return { maxCount, maxHour };
  }, [entries]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:chart-line" className="text-xl text-yellow-500" />
          <h3 className="text-base font-bold text-gray-800">Chauffeurs connectes par heure</h3>
        </div>
        <span className="text-xs text-gray-500">24h glissantes</span>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-yellow-400" />
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center text-sm text-red-500">
          <Icon icon="mdi:alert-circle" className="mr-2 text-2xl" />
          Erreur de chargement
        </div>
      ) : entries.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">
          <Icon icon="mdi:chart-line" className="mr-2 text-2xl" />
          Aucune donnee disponible
        </div>
      ) : (
        <>
          <div className="h-64">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => {
                      const y = Number(ctx.parsed.y) || 0;
                      return ` ${y} chauffeur${y > 1 ? "s" : ""}`;
                    },
                    },
                  },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { precision: 0 } },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
          {peak.maxHour !== null && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Icon icon="mdi:arrow-up-bold" className="text-yellow-500" />
              Pic a <strong className="text-gray-700">{formatHourLabel(peak.maxHour)}</strong> avec{" "}
              <strong className="text-gray-700">{peak.maxCount}</strong> chauffeur{peak.maxCount > 1 ? "s" : ""}
            </div>
          )}
        </>
      )}
    </div>
  );
}
