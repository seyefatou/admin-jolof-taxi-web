"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  SERVICE_ANALYTICS,
  AnalyticsPeriod,
  HeatmapType,
  HeatmapPoint,
} from "@/services/analytics-service";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const HeatmapCanvas = dynamic(() => import("@/components/analytics/HeatmapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-2xl">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-yellow-400" />
    </div>
  ),
});

const PERIODS: { value: AnalyticsPeriod; label: string; icon: string }[] = [
  { value: "today", label: "Aujourd'hui", icon: "mdi:calendar-today" },
  { value: "week", label: "Cette semaine", icon: "mdi:calendar-week" },
  { value: "month", label: "Ce mois", icon: "mdi:calendar-month" },
];

const pickNumber = (obj: unknown, ...keys: string[]): number => {
  if (!obj || typeof obj !== "object") return 0;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v !== "" && Number.isFinite(Number(v))) return Number(v);
  }
  return 0;
};

const formatPct = (n: number) => {
  if (!Number.isFinite(n)) return "0%";
  const val = n > 1 ? n : n * 100;
  return `${val.toFixed(1)}%`;
};

type KpiCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: "yellow" | "green" | "blue" | "red" | "indigo" | "orange";
  loading?: boolean;
};

const COLOR_MAP: Record<KpiCardProps["color"], { bg: string; text: string; border: string; iconBg: string }> = {
  yellow: { bg: "from-yellow-50 to-amber-50", text: "text-yellow-700", border: "border-yellow-200", iconBg: "bg-yellow-100" },
  green: { bg: "from-green-50 to-emerald-50", text: "text-green-700", border: "border-green-200", iconBg: "bg-green-100" },
  blue: { bg: "from-blue-50 to-sky-50", text: "text-blue-700", border: "border-blue-200", iconBg: "bg-blue-100" },
  red: { bg: "from-red-50 to-rose-50", text: "text-red-700", border: "border-red-200", iconBg: "bg-red-100" },
  indigo: { bg: "from-indigo-50 to-purple-50", text: "text-indigo-700", border: "border-indigo-200", iconBg: "bg-indigo-100" },
  orange: { bg: "from-orange-50 to-amber-50", text: "text-orange-700", border: "border-orange-200", iconBg: "bg-orange-100" },
};

function KpiCard({ title, value, subtitle, icon, color, loading }: KpiCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} p-5 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-gray-200" />
          ) : (
            <p className={`mt-2 text-3xl font-bold ${c.text}`}>{value}</p>
          )}
          {subtitle && !loading && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-xl ${c.iconBg} p-3`}>
          <Icon icon={icon} className={`text-2xl ${c.text}`} />
        </div>
      </div>
    </div>
  );
}

type SectionCardProps = {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
};

function SectionCard({ title, icon, children, className = "" }: SectionCardProps) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <Icon icon={icon} className="text-xl text-yellow-500" />
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("today");
  const [heatmapType, setHeatmapType] = useState<HeatmapType>("pickup");
  const [loading, setLoading] = useState(true);
  const [heatmapLoading, setHeatmapLoading] = useState(true);

  const [serviceRate, setServiceRate] = useState<unknown>(null);
  const [acceptanceRate, setAcceptanceRate] = useState<unknown>(null);
  const [cancellationRate, setCancellationRate] = useState<unknown>(null);
  const [waitTime, setWaitTime] = useState<unknown>(null);
  const [clientsData, setClientsData] = useState<unknown>(null);
  const [activeDrivers, setActiveDrivers] = useState<unknown>(null);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [sr, ar, cr, wt, cl, ad] = await Promise.all([
          SERVICE_ANALYTICS.getServiceRate(period).catch((e) => { console.error("service-rate:", e); return null; }),
          SERVICE_ANALYTICS.getAcceptanceRate(period).catch((e) => { console.error("acceptance-rate:", e); return null; }),
          SERVICE_ANALYTICS.getCancellationRate(period).catch((e) => { console.error("cancellation-rate:", e); return null; }),
          SERVICE_ANALYTICS.getWaitTime(period).catch((e) => { console.error("wait-time:", e); return null; }),
          SERVICE_ANALYTICS.getClientsAnalytics(period).catch((e) => { console.error("clients:", e); return null; }),
          SERVICE_ANALYTICS.getActiveDrivers(period).catch((e) => { console.error("active-drivers:", e); return null; }),
        ]);
        if (cancelled) return;

        setServiceRate(sr?.data ?? sr ?? null);
        setAcceptanceRate(ar?.data ?? ar ?? null);
        setCancellationRate(cr?.data ?? cr ?? null);
        setWaitTime(wt?.data ?? wt ?? null);
        setClientsData(cl?.data ?? cl ?? null);
        setActiveDrivers(ad?.data ?? ad ?? null);
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error("Erreur lors du chargement des analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setHeatmapLoading(true);
      try {
        const res = await SERVICE_ANALYTICS.getHeatmap(heatmapType);
        if (cancelled) return;
        const points = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? (res as HeatmapPoint[]) : [];
        setHeatmapPoints(points);
      } catch (e) {
        console.error("heatmap:", e);
        if (!cancelled) {
          setHeatmapPoints([]);
          toast.error("Erreur lors du chargement du heatmap");
        }
      } finally {
        if (!cancelled) setHeatmapLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [heatmapType]);

  // Derivations
  const serviceRateValue = useMemo(() => {
    const completed = pickNumber(serviceRate, "completed", "done");
    const total = pickNumber(serviceRate, "total");
    const rate = pickNumber(serviceRate, "rate");
    return { completed, total, rate: rate || (total ? completed / total : 0) };
  }, [serviceRate]);

  const acceptanceValue = useMemo(() => {
    const accepted = pickNumber(acceptanceRate, "accepted");
    const total = pickNumber(acceptanceRate, "total");
    const rate = pickNumber(acceptanceRate, "rate");
    return { accepted, total, rate: rate || (total ? accepted / total : 0) };
  }, [acceptanceRate]);

  const waitTimeValue = useMemo(() => {
    const minutes = pickNumber(waitTime, "average_minutes", "averageMinutes", "average");
    const sample = pickNumber(waitTime, "sample_size", "sampleSize");
    return { minutes, sample };
  }, [waitTime]);

  const cancellationBreakdown = useMemo(() => {
    const byCustomer = pickNumber(cancellationRate, "cancelled_by_client", "byCustomer");
    const byDriver = pickNumber(cancellationRate, "cancelled_by_driver", "byDriver");
    const bySystem = pickNumber(cancellationRate, "cancelled_by_system", "bySystem");
    const total = pickNumber(cancellationRate, "total") || byCustomer + byDriver + bySystem;
    const rateClient = pickNumber(cancellationRate, "rate_client");
    const rateDriver = pickNumber(cancellationRate, "rate_driver");
    return { byCustomer, byDriver, bySystem, total, rateClient, rateDriver };
  }, [cancellationRate]);

  const clientsBreakdown = useMemo(() => {
    const active = pickNumber(clientsData, "active");
    const recurring = pickNumber(clientsData, "recurring");
    const fresh = pickNumber(clientsData, "new_clients", "new");
    const returning = pickNumber(clientsData, "returning_clients", "returning");
    return { active, recurring, new: fresh, returning };
  }, [clientsData]);

  const driversBreakdown = useMemo(() => {
    const active = pickNumber(activeDrivers, "active");
    const withRide = pickNumber(activeDrivers, "with_completed_ride", "withCompletedRide");
    return { active, withRide };
  }, [activeDrivers]);

  const cancellationChart = {
    labels: ["Client", "Chauffeur", "Systeme"],
    datasets: [
      {
        data: [cancellationBreakdown.byCustomer, cancellationBreakdown.byDriver, cancellationBreakdown.bySystem],
        backgroundColor: ["#f97316", "#a855f7", "#6b7280"],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const clientsChart = {
    labels: ["Nouveaux", "De retour", "Recurrents", "Actifs"],
    datasets: [
      {
        label: "Clients",
        data: [clientsBreakdown.new, clientsBreakdown.returning, clientsBreakdown.recurring, clientsBreakdown.active],
        backgroundColor: ["#10b981", "#6366f1", "#eab308", "#06b6d4"],
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="w-full">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-400 p-3 shadow">
              <Icon icon="mdi:chart-box" className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
              <p className="text-sm text-gray-500">Statistiques avancees de la plateforme</p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  period === p.value
                    ? "bg-yellow-400 text-black shadow"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon icon={p.icon} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Taux de service"
          value={formatPct(serviceRateValue.rate)}
          subtitle={`${serviceRateValue.completed}/${serviceRateValue.total} courses terminees`}
          icon="mdi:check-circle-outline"
          color="green"
          loading={loading}
        />
        <KpiCard
          title="Taux d'acceptation"
          value={formatPct(acceptanceValue.rate)}
          subtitle={`${acceptanceValue.accepted}/${acceptanceValue.total} acceptees`}
          icon="mdi:account-check-outline"
          color="blue"
          loading={loading}
        />
        <KpiCard
          title="Temps d'attente moyen"
          value={`${waitTimeValue.minutes.toFixed(1)} min`}
          subtitle={waitTimeValue.sample > 0 ? `Sur ${waitTimeValue.sample} course${waitTimeValue.sample > 1 ? "s" : ""}` : "Entre commande et prise en charge"}
          icon="mdi:clock-outline"
          color="orange"
          loading={loading}
        />
        <KpiCard
          title="Annulations totales"
          value={String(cancellationBreakdown.total)}
          subtitle={`C:${cancellationBreakdown.byCustomer} · Ch:${cancellationBreakdown.byDriver} · Sys:${cancellationBreakdown.bySystem}`}
          icon="mdi:cancel"
          color="red"
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Repartition des annulations" icon="mdi:chart-donut">
          <div className="relative h-72">
            {cancellationBreakdown.total > 0 ? (
              <Doughnut
                data={cancellationChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const val = Number(ctx.raw) || 0;
                          const pct = cancellationBreakdown.total
                            ? ((val / cancellationBreakdown.total) * 100).toFixed(1)
                            : "0";
                          return ` ${ctx.label}: ${val} (${pct}%)`;
                        },
                      },
                    },
                  },
                  cutout: "65%",
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                <Icon icon="mdi:chart-donut" className="mr-2 text-2xl" />
                Aucune annulation sur la periode
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Segmentation clients" icon="mdi:account-multiple-outline">
          <div className="relative h-72">
            <Bar
              data={clientsChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
              }}
            />
          </div>
        </SectionCard>
      </div>

      {/* Active drivers card */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SectionCard title="Chauffeurs actifs" icon="mdi:account-tie-hat" className="h-full">
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Actifs</p>
                    <p className="mt-1 text-3xl font-bold text-indigo-700">{driversBreakdown.active}</p>
                  </div>
                  <Icon icon="mdi:account-tie-hat" className="text-4xl text-indigo-400" />
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Avec course terminee</p>
                    <p className="mt-1 text-3xl font-bold text-green-700">{driversBreakdown.withRide}</p>
                  </div>
                  <Icon icon="mdi:car-check" className="text-4xl text-green-400" />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title={`Heatmap — ${heatmapType === "pickup" ? "Departs" : "Arrivees"}`} icon="mdi:map-marker-radius" className="h-full">
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => setHeatmapType("pickup")}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  heatmapType === "pickup"
                    ? "bg-yellow-400 text-black shadow"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon icon="mdi:map-marker" />
                Departs
              </button>
              <button
                onClick={() => setHeatmapType("dropoff")}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  heatmapType === "dropoff"
                    ? "bg-blue-400 text-white shadow"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon icon="mdi:map-marker-check" />
                Arrivees
              </button>
              <span className="ml-auto text-xs text-gray-500">
                {heatmapPoints.length} zone{heatmapPoints.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="relative h-80 overflow-hidden rounded-xl border border-gray-200">
              {heatmapLoading ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-50">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-yellow-400" />
                </div>
              ) : heatmapPoints.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm text-gray-400">
                  <Icon icon="mdi:map-marker-off" className="mr-2 text-2xl" />
                  Aucune donnee de localisation
                </div>
              ) : (
                <HeatmapCanvas points={heatmapPoints} type={heatmapType} />
              )}
            </div>
          </SectionCard>
        </div>
      </div>

    </div>
  );
}
