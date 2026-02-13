"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  SERVICE_VEHICULES,
  VehiculeTypeResp,
} from "@/services/vehicule-service";
import { SERVICE_CONFIG, ConfigProps } from "@/services/config-service";
import { SERVICE_PAIEMENT, PaiementProps } from "@/services/paiement-service";
import {
  SERVICE_ROLE,
  RoleProps,
  PermissionProps,
} from "@/services/role-service";
import {
  SERVICE_ADMINISTRATEUR,
  AdminProps,
} from "@/services/administrateur-service";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  AddButton,
  AnimatedTableRow,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableCell,
  EmptyState,
} from "@/components/ui/AnimatedTable";

// ─── Types ──────────────────────────────────────────────
type TabId = "config" | "vehicule" | "paiement" | "roles" | "admins" | "notification";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

const TABS: Tab[] = [
  {
    id: "config",
    label: "Configuration",
    icon: "mdi:cog",
    description: "Parametres du systeme",
  },
  {
    id: "vehicule",
    label: "Vehicule",
    icon: "mdi:car-multiple",
    description: "Types et tarification",
  },
  {
    id: "paiement",
    label: "Paiement",
    icon: "mdi:credit-card-outline",
    description: "Methodes de paiement",
  },
  {
    id: "roles",
    label: "Roles & Permissions",
    icon: "mdi:shield-account-outline",
    description: "Gestion des acces",
  },
  {
    id: "admins",
    label: "Administrateurs",
    icon: "mdi:account-tie",
    description: "Gestion des admins",
  },
  {
    id: "notification",
    label: "Notifications",
    icon: "mdi:bell-outline",
    description: "Alertes et communications",
  },
];

// ─── Main Page ──────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("config");

  return (
    <div className="w-full">
      <ToastContainer position="bottom-right" />

      <PageHeader title="Parametres" icon="mdi:cog" />

      {/* Tabs Navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3 px-6 py-4 min-w-fit transition-all duration-300 group ${
                activeTab === tab.id
                  ? "bg-gradient-to-b from-yellow-50 to-white text-gray-900"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div
                className={`p-2 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-yellow-400 text-white shadow-md"
                    : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600"
                }`}
              >
                <Icon icon={tab.icon} className="text-lg" />
              </div>
              <div className="text-left">
                <span
                  className={`block text-sm font-semibold ${
                    activeTab === tab.id ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  {tab.label}
                </span>
                <span className="block text-xs text-gray-400 hidden md:block">
                  {tab.description}
                </span>
              </div>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === "config" && <ConfigTab />}
        {activeTab === "vehicule" && <VehiculeTab />}
        {activeTab === "paiement" && <PaiementTab />}
        {activeTab === "roles" && <RolesTab />}
        {activeTab === "admins" && <AdminsTab />}
        {activeTab === "notification" && <ComingSoonTab tab={TABS[5]} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── Config Tab (System Configuration) ───────────────────
// ═══════════════════════════════════════════════════════════
function ConfigTab() {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<ConfigProps[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerKey, setDatePickerKey] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_CONFIG.getAll();
      if (res.data) setConfigs(res.data);
    } catch {
      toast.error("Erreur lors de la recuperation des configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleEdit = (config: ConfigProps) => {
    setEditingKey(config.key);
    setEditValue(config.value);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const isDateField = (key: string) => {
    const k = key.toLowerCase();
    return k.includes("date") || k.includes("expir") || k.includes("deadline");
  };

  const parseConfigDate = (value: string): Date => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const formatDateDisplay = (value: string) => {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  };

  const formatDateToISO = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const openDatePicker = (config: ConfigProps) => {
    const d = parseConfigDate(config.value);
    setSelectedDate(d);
    setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setDatePickerKey(config.key);
    setShowDatePicker(true);
  };

  const handleDateConfirm = async () => {
    if (!datePickerKey) return;
    const value = formatDateToISO(selectedDate);
    try {
      setSaving(true);
      const res = await SERVICE_CONFIG.update(datePickerKey, value);
      if (res.status >= 400) {
        toast.error(res.message || "Erreur lors de la modification");
        return;
      }
      toast.success("Date mise a jour avec succes");
      setShowDatePicker(false);
      setDatePickerKey(null);
      await loadConfigs();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Lundi = 0
  };

  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const isToday = (date: Date) => isSameDay(date, new Date());

  const handleSave = async (key: string) => {
    try {
      setSaving(true);
      const res = await SERVICE_CONFIG.update(key, editValue);
      if (res.status >= 400) {
        toast.error(res.message || "Erreur lors de la modification");
        return;
      }
      toast.success("Configuration mise a jour avec succes");
      setEditingKey(null);
      setEditValue("");
      await loadConfigs();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await SERVICE_CONFIG.seed();
      toast.success("Configurations par defaut initialisees avec succes");
      await loadConfigs();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de l'initialisation");
    } finally {
      setSeeding(false);
    }
  };

  const getConfigIcon = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes("commission")) return "mdi:percent-outline";
    if (k.includes("price") || k.includes("prix") || k.includes("rate") || k.includes("tarif")) return "mdi:currency-usd";
    if (k.includes("time") || k.includes("temps") || k.includes("duration") || k.includes("delay")) return "mdi:clock-outline";
    if (k.includes("distance") || k.includes("km") || k.includes("radius")) return "mdi:map-marker-distance";
    if (k.includes("max") || k.includes("limit")) return "mdi:arrow-up-bold";
    if (k.includes("min")) return "mdi:arrow-down-bold";
    if (k.includes("sms") || k.includes("notif")) return "mdi:bell-outline";
    if (k.includes("driver") || k.includes("chauffeur")) return "mdi:steering";
    if (k.includes("booking") || k.includes("reservation")) return "mdi:calendar-check";
    return "mdi:tune-variant";
  };

  const getConfigColor = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes("commission")) return { bg: "from-emerald-50 to-green-50", icon: "bg-emerald-500", border: "border-emerald-200" };
    if (k.includes("price") || k.includes("prix") || k.includes("rate")) return { bg: "from-yellow-50 to-amber-50", icon: "bg-yellow-500", border: "border-yellow-200" };
    if (k.includes("time") || k.includes("temps") || k.includes("duration")) return { bg: "from-blue-50 to-sky-50", icon: "bg-blue-500", border: "border-blue-200" };
    if (k.includes("distance") || k.includes("km") || k.includes("radius")) return { bg: "from-purple-50 to-violet-50", icon: "bg-purple-500", border: "border-purple-200" };
    return { bg: "from-gray-50 to-slate-50", icon: "bg-gray-500", border: "border-gray-200" };
  };

  const configLabels: Record<string, string> = {
    // Commission
    free_commission_end_date: "Date de fin commission gratuite",
    gie_commission_rate: "Taux de commission GIE",
    platform_commission_rate: "Taux de commission plateforme",
    commission_rate: "Taux de commission",
    commission_percentage: "Pourcentage de commission",
    commission: "Commission",
    driver_commission: "Commission chauffeur",
    driver_commission_rate: "Taux de commission chauffeur",
    // Prix / Tarifs
    min_fare: "Tarif minimum",
    max_fare: "Tarif maximum",
    price_rounding: "Arrondi du prix",
    base_price: "Prix de base",
    base_fare: "Tarif de base",
    price_per_km: "Prix par kilometre",
    price_per_mn: "Prix par minute",
    rate_price: "Tarif de base",
    min_price: "Prix minimum",
    max_price: "Prix maximum",
    surge_multiplier: "Multiplicateur heure de pointe",
    surge_pricing: "Tarification dynamique",
    cancellation_fee: "Frais d'annulation",
    cancellation_charge: "Frais d'annulation",
    waiting_fee: "Frais d'attente",
    waiting_charge: "Frais d'attente",
    night_fare_multiplier: "Multiplicateur tarif nuit",
    // Temps / Duree
    max_wait_time: "Temps d'attente maximum",
    driver_timeout: "Delai d'expiration chauffeur",
    booking_timeout: "Delai d'expiration reservation",
    request_timeout: "Delai d'expiration requete",
    timeout: "Delai d'expiration",
    delay: "Delai",
    estimated_time: "Temps estime",
    free_waiting_time: "Temps d'attente gratuit",
    // Distance
    max_distance: "Distance maximale",
    min_distance: "Distance minimale",
    search_radius: "Rayon de recherche",
    driver_search_radius: "Rayon de recherche chauffeur",
    radius: "Rayon",
    max_ride_distance: "Distance maximale de course",
    // Booking / Reservation
    max_active_bookings: "Reservations actives max",
    booking_limit: "Limite de reservations",
    max_active_rides: "Courses actives max",
    // Chauffeur
    max_drivers: "Nombre max de chauffeurs",
    driver_auto_assign: "Attribution auto chauffeur",
    // Notifications
    sms_enabled: "SMS active",
    notification_enabled: "Notifications activees",
    push_notification: "Notification push",
    // General
    app_name: "Nom de l'application",
    app_version: "Version de l'application",
    currency: "Devise",
    country: "Pays",
    language: "Langue",
    maintenance_mode: "Mode maintenance",
    version: "Version",
    tax_rate: "Taux de taxe",
    tax_percentage: "Pourcentage de taxe",
    referral_bonus: "Bonus de parrainage",
    referral_reward_amount: "Montant recompense parrainage",
    loyalty_points: "Points de fidelite",
    // Vehicule / Majoration
    vehicle_markup: "Majoration vehicule",
    // Trafic
    traffic_surcharge_moderate: "Surcharge trafic modere",
    traffic_surcharge_heavy: "Surcharge trafic eleve",
    traffic_surcharge: "Surcharge trafic",
  };

  const formatConfigLabel = (key: string) => {
    const lower = key.toLowerCase();
    if (configLabels[lower]) return configLabels[lower];
    // Fallback: traduire les mots anglais courants
    const wordMap: Record<string, string> = {
      commission: "commission", rate: "taux", price: "prix", min: "min",
      max: "max", fare: "tarif", driver: "chauffeur", booking: "reservation",
      time: "temps", wait: "attente", distance: "distance", search: "recherche",
      radius: "rayon", free: "gratuit", end: "fin", date: "date",
      platform: "plateforme", rounding: "arrondi", surge: "pointe",
      cancellation: "annulation", fee: "frais", charge: "frais",
      night: "nuit", waiting: "attente", active: "actif", limit: "limite",
      enabled: "active", notification: "notification", sms: "SMS",
      auto: "auto", assign: "attribution", mode: "mode", tax: "taxe",
      percentage: "pourcentage", bonus: "bonus", referral: "parrainage",
      loyalty: "fidelite", points: "points", multiplier: "multiplicateur",
      ride: "course", request: "requete", timeout: "expiration",
      estimated: "estime", country: "pays", currency: "devise",
      language: "langue", version: "version", app: "application",
      name: "nom", gie: "GIE", push: "push",
      reward: "recompense", amount: "montant", vehicle: "vehicule",
      markup: "majoration", traffic: "trafic", surcharge: "surcharge",
      moderate: "modere", heavy: "eleve", light: "leger",
      type: "type", status: "statut", code: "code",
      discount: "reduction", promo: "promo", default: "defaut",
      minimum: "minimum", maximum: "maximum", total: "total",
      count: "nombre", number: "numero", start: "debut",
      stop: "arret", duration: "duree", hour: "heure",
      day: "jour", week: "semaine", month: "mois", year: "annee",
      peak: "pointe", off: "hors", base: "base", fixed: "fixe",
      per: "par", km: "km", mn: "min", service: "service",
      customer: "client", user: "utilisateur", payment: "paiement",
      cash: "especes", card: "carte", balance: "solde",
      config: "configuration", setting: "parametre", option: "option",
      speed: "vitesse", zone: "zone", area: "zone", region: "region",
    };
    return lower
      .split("_")
      .map((w) => wordMap[w] || w)
      .join(" ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  };

  if (loading) return <LoadingSpinner icon="mdi:cog" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total configurations" value={configs.length} icon="mdi:cog" color="gray" index={0} />
        <StatCard title="Parametres actifs" value={configs.length} icon="mdi:check-decagram" color="green" index={1} />
        <StatCard title="Service" value={1} icon="mdi:server" color="yellow" index={2} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Configurations du systeme</h2>
          <p className="text-sm text-gray-500">Parametres generaux du service de reservation</p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-semibold text-sm hover:from-gray-800 hover:to-gray-900 transition-all shadow-md disabled:opacity-50"
        >
          {seeding ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              Initialisation...
            </>
          ) : (
            <>
              <Icon icon="mdi:database-refresh" className="text-lg" />
              Reinitialiser par defaut
            </>
          )}
        </button>
      </div>

      {configs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configs.map((config, index) => {
            const colors = getConfigColor(config.key);
            const isEditing = editingKey === config.key;
            return (
              <div
                key={config.key}
                className={`relative bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300`}
                style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.06}s both` }}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${colors.icon} rounded-xl shadow-md flex-shrink-0`}>
                      <Icon icon={getConfigIcon(config.key)} className="text-xl text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-800 truncate">{formatConfigLabel(config.key)}</h3>
                      </div>
                      <p className="text-xs text-gray-400 font-mono mb-3">{config.key}</p>

                      {isDateField(config.key) ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon icon="mdi:calendar" className="text-gray-400" />
                            <span className="px-4 py-2 bg-white/80 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 shadow-sm">
                              {formatDateDisplay(config.value)}
                            </span>
                          </div>
                          <button
                            onClick={() => openDatePicker(config)}
                            className="p-2.5 bg-white/80 text-gray-600 rounded-xl hover:bg-yellow-100 hover:text-yellow-700 transition-all hover:scale-110 shadow-sm"
                          >
                            <Icon icon="mdi:calendar-edit" className="text-lg" />
                          </button>
                        </div>
                      ) : isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-4 py-2.5 border-2 border-yellow-300 rounded-xl focus:ring-4 focus:ring-yellow-100 outline-none text-sm font-semibold bg-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSave(config.key)}
                            disabled={saving}
                            className="p-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-md disabled:opacity-50"
                          >
                            {saving ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                            ) : (
                              <Icon icon="mdi:check" className="text-lg" />
                            )}
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2.5 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-all"
                          >
                            <Icon icon="mdi:close" className="text-lg" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-4 py-2 bg-white/80 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 shadow-sm">
                              {config.value}
                            </span>
                          </div>
                          <button
                            onClick={() => handleEdit(config)}
                            className="p-2.5 bg-white/80 text-gray-600 rounded-xl hover:bg-yellow-100 hover:text-yellow-700 transition-all hover:scale-110 shadow-sm"
                          >
                            <Icon icon="mdi:pencil" className="text-lg" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:cog-off" className="text-4xl text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Aucune configuration</p>
          <p className="text-sm text-gray-400 mt-1">Initialisez les configurations par defaut pour commencer</p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="mt-4 px-5 py-2.5 bg-gradient-to-r from-yellow-300 to-yellow-400 text-black font-semibold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all inline-flex items-center gap-2 shadow-md"
          >
            {seeding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/20 border-t-black"></div>
                Initialisation...
              </>
            ) : (
              <>
                <Icon icon="mdi:database-plus" /> Initialiser par defaut
              </>
            )}
          </button>
        </div>
      )}

      {/* Calendrier Modal */}
      {showDatePicker && datePickerKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowDatePicker(false); setDatePickerKey(null); }} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-amber-400 p-6 text-black">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium opacity-80">Modifier la date</span>
                <button onClick={() => { setShowDatePicker(false); setDatePickerKey(null); }} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors">
                  <Icon icon="mdi:close" className="text-xl" />
                </button>
              </div>
              <h2 className="text-sm font-medium opacity-70 mb-1">{formatConfigLabel(datePickerKey)}</h2>
              <p className="text-3xl font-bold">
                {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="text-lg font-semibold opacity-80 mt-1">{selectedDate.getFullYear()}</p>
            </div>

            {/* Navigation mois */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Icon icon="mdi:chevron-left" className="text-xl text-gray-600" />
              </button>
              <h3 className="text-base font-bold text-gray-800 capitalize">
                {calendarMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </h3>
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Icon icon="mdi:chevron-right" className="text-xl text-gray-600" />
              </button>
            </div>

            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 px-5 mb-2">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((j) => (
                <div key={j} className="text-center text-xs font-bold text-gray-400 py-2">{j}</div>
              ))}
            </div>

            {/* Grille des jours */}
            <div className="grid grid-cols-7 gap-1 px-5 pb-4">
              {(() => {
                const daysInMonth = getDaysInMonth(calendarMonth);
                const firstDay = getFirstDayOfMonth(calendarMonth);
                const cells = [];

                // Cases vides avant le 1er
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`empty-${i}`} />);
                }

                // Jours du mois
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                  const selected = isSameDay(date, selectedDate);
                  const today = isToday(date);

                  cells.push(
                    <button
                      key={day}
                      onClick={() => setSelectedDate(date)}
                      className={`relative w-10 h-10 mx-auto rounded-xl text-sm font-semibold transition-all duration-200 ${
                        selected
                          ? "bg-gradient-to-br from-yellow-400 to-amber-400 text-black shadow-lg scale-110"
                          : today
                          ? "bg-yellow-50 text-yellow-700 border-2 border-yellow-300"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {day}
                      {today && !selected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full" />
                      )}
                    </button>
                  );
                }

                return cells;
              })()}
            </div>

            {/* Raccourcis rapides */}
            <div className="flex gap-2 px-5 pb-4">
              <button
                onClick={() => { const d = new Date(); setSelectedDate(d); setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}
                className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => { const d = new Date(); d.setMonth(d.getMonth() + 1); setSelectedDate(d); setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}
                className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                +1 mois
              </button>
              <button
                onClick={() => { const d = new Date(); d.setMonth(d.getMonth() + 3); setSelectedDate(d); setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}
                className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                +3 mois
              </button>
              <button
                onClick={() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); setSelectedDate(d); setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}
                className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                +1 an
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { setShowDatePicker(false); setDatePickerKey(null); }}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-white transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleDateConfirm}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-xl font-semibold text-black hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-black/20 border-t-black"></div> Enregistrement...</>
                ) : (
                  <><Icon icon="mdi:calendar-check" className="text-lg" /> Confirmer</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── Vehicule Tab ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function VehiculeTab() {
  const [loading, setLoading] = useState(true);
  const [vehicleTypes, setVehicleTypes] = useState<VehiculeTypeResp[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<VehiculeTypeResp | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    type: "",
    priceKm: "",
    ratePrice: "",
    priceMn: "",
    status: true,
    image: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const loadTypes = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_VEHICULES.getTypeList();
      if (res.data) setVehicleTypes(res.data);
    } catch {
      toast.error("Erreur lors de la recuperation des types de vehicules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const resetForm = () => {
    setFormData({ type: "", priceKm: "", ratePrice: "", priceMn: "", status: true, image: null });
    setImagePreview(null);
    setEditingType(null);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = (vt: VehiculeTypeResp) => {
    setEditingType(vt);
    setFormData({
      type: vt.type,
      priceKm: String(vt.priceKm || ""),
      ratePrice: String(vt.ratePrice),
      priceMn: String(vt.priceMn),
      status: vt.status,
      image: null,
    });
    setImagePreview(vt.image || null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type.trim()) { toast.error("Le nom du type est requis"); return; }
    if (!formData.ratePrice || !formData.priceMn) { toast.error("Les tarifs sont requis"); return; }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("type", formData.type);
      fd.append("priceKm", formData.priceKm || "0");
      fd.append("ratePrice", formData.ratePrice);
      fd.append("priceMn", formData.priceMn);
      fd.append("status", String(formData.status));
      if (formData.image) fd.append("image", formData.image);

      let res;
      if (editingType) {
        res = await SERVICE_VEHICULES.updateType(fd, editingType.id);
      } else {
        res = await SERVICE_VEHICULES.createType(fd);
      }

      if (res.status >= 400) { toast.error(res.message || "Erreur lors de l'enregistrement"); return; }

      toast.success(editingType ? "Type mis a jour avec succes" : "Type cree avec succes");
      setShowModal(false);
      resetForm();
      await loadTypes();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (vt: VehiculeTypeResp) => {
    try {
      const fd = new FormData();
      fd.append("type", vt.type);
      fd.append("priceKm", String(vt.priceKm || 0));
      fd.append("ratePrice", String(vt.ratePrice));
      fd.append("priceMn", String(vt.priceMn));
      fd.append("status", String(!vt.status));
      const res = await SERVICE_VEHICULES.updateType(fd, vt.id);
      if (res.status >= 400) { toast.error(res.message || "Erreur lors du changement de statut"); return; }
      toast.success(`Type "${vt.type}" ${!vt.status ? "active" : "desactive"} avec succes`);
      await loadTypes();
    } catch {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const activeTypes = vehicleTypes.filter((vt) => vt.status).length;
  const inactiveTypes = vehicleTypes.filter((vt) => !vt.status).length;
  const avgPriceKm = vehicleTypes.length > 0
    ? Math.round(vehicleTypes.reduce((sum, vt) => sum + (vt.priceKm || 0), 0) / vehicleTypes.length)
    : 0;

  if (loading) return <LoadingSpinner icon="mdi:cog" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total types" value={vehicleTypes.length} icon="mdi:car-multiple" color="gray" index={0} />
        <StatCard title="Types actifs" value={activeTypes} icon="mdi:check-circle" color="green" index={1} />
        <StatCard title="Types inactifs" value={inactiveTypes} icon="mdi:close-circle" color="red" index={2} />
        <StatCard title="Prix moyen/km" value={avgPriceKm} icon="mdi:currency-usd" color="yellow" index={3} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Types de vehicules</h2>
          <p className="text-sm text-gray-500">Configurez les types de service et leur tarification</p>
        </div>
        <AddButton onClick={openAddModal} label="Ajouter un type" />
      </div>

      {vehicleTypes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicleTypes.map((vt, index) => (
            <VehicleTypeCard key={vt.id} vehicleType={vt} index={index} onEdit={() => openEditModal(vt)} onToggleStatus={() => handleToggleStatus(vt)} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:car-cog" className="text-4xl text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Aucun type de vehicule</p>
          <p className="text-sm text-gray-400 mt-1">Commencez par ajouter un type de vehicule</p>
          <button onClick={openAddModal} className="mt-4 px-5 py-2.5 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-500 transition-all inline-flex items-center gap-2">
            <Icon icon="mdi:plus" /> Ajouter un type
          </button>
        </div>
      )}

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-400 rounded-xl shadow-md">
                    <Icon icon={editingType ? "mdi:pencil" : "mdi:plus"} className="text-xl text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{editingType ? "Modifier le type" : "Nouveau type de vehicule"}</h3>
                    <p className="text-sm text-gray-500">{editingType ? `Modification de "${editingType.type}"` : "Definissez le type et sa tarification"}</p>
                  </div>
                </div>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                  <Icon icon="mdi:close" className="text-xl text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du type</label>
                <div className="relative">
                  <Icon icon="mdi:car" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} placeholder="Ex: Confort, Standard, VIP..." className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image du vehicule</label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setImagePreview(null); setFormData({ ...formData, image: null }); }} className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full">
                        <Icon icon="mdi:close" className="text-xs" />
                      </button>
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all">
                      <Icon icon="mdi:cloud-upload" className="text-2xl text-gray-400" />
                      <span className="text-sm text-gray-500">{imagePreview ? "Changer l'image" : "Cliquez pour uploader"}</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Icon icon="mdi:cash" className="inline mr-1 text-yellow-500" /> Tarification
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Prix de base (CFA)</label>
                    <input type="number" value={formData.ratePrice} onChange={(e) => setFormData({ ...formData, ratePrice: e.target.value })} placeholder="500" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all text-center font-semibold" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Prix/km (CFA)</label>
                    <input type="number" value={formData.priceKm} onChange={(e) => setFormData({ ...formData, priceKm: e.target.value })} placeholder="100" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all text-center font-semibold" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Prix/min (CFA)</label>
                    <input type="number" value={formData.priceMn} onChange={(e) => setFormData({ ...formData, priceMn: e.target.value })} placeholder="50" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all text-center font-semibold" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <Icon icon={formData.status ? "mdi:check-circle" : "mdi:close-circle"} className={`text-xl ${formData.status ? "text-green-500" : "text-gray-400"}`} />
                  <div>
                    <span className="block text-sm font-semibold text-gray-700">Statut</span>
                    <span className="text-xs text-gray-500">{formData.status ? "Visible par les clients" : "Masque"}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setFormData({ ...formData, status: !formData.status })} className={`relative w-12 h-6 rounded-full transition-all duration-300 ${formData.status ? "bg-green-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${formData.status ? "left-6" : "left-0.5"}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-xl font-semibold text-black hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-black/20 border-t-black"></div>Enregistrement...</>) : (<><Icon icon={editingType ? "mdi:check" : "mdi:plus"} className="text-lg" />{editingType ? "Mettre a jour" : "Creer le type"}</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vehicle Type Card ──────────────────────────────────
function VehicleTypeCard({ vehicleType: vt, index, onEdit, onToggleStatus }: { vehicleType: VehiculeTypeResp; index: number; onEdit: () => void; onToggleStatus: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const handleToggle = async () => { setTogglingStatus(true); await onToggleStatus(); setTogglingStatus(false); };

  return (
    <div className={`relative bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-500 hover:scale-[1.01] hover:-translate-y-0.5 group ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${!vt.status ? "opacity-80" : ""}`} style={{ transitionDelay: `${index * 60}ms` }}>
      <div className={`h-1 transition-all duration-300 ${vt.status ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gradient-to-r from-gray-300 to-gray-400"}`} />
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-shrink-0">
            {vt.image ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm group-hover:border-yellow-200 transition-all">
                <img src={vt.image} alt={vt.type} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 border-2 border-yellow-200 flex items-center justify-center shadow-sm">
                <Icon icon="mdi:car" className="text-2xl text-yellow-600" />
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${vt.status ? "bg-green-500" : "bg-gray-400"}`}>
              <Icon icon={vt.status ? "mdi:check" : "mdi:minus"} className="text-[10px] text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate capitalize">{vt.type}</h3>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mt-1 ${vt.status ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${vt.status ? "bg-green-500" : "bg-gray-400"}`} />
              {vt.status ? "Actif" : "Inactif"}
            </span>
          </div>
          <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">#{vt.id}</span>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 mb-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="mdi:tag-outline" className="text-yellow-500" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Tarification</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Base</p>
              <p className="text-lg font-bold text-gray-800">{vt.ratePrice.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 font-medium">CFA</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Par km</p>
              <p className="text-lg font-bold text-yellow-600">{(vt.priceKm || 0).toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 font-medium">CFA/km</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Par min</p>
              <p className="text-lg font-bold text-gray-800">{vt.priceMn.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 font-medium">CFA/min</p>
            </div>
          </div>
        </div>

        {vt.tarifs && vt.tarifs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="mdi:chart-line" className="text-blue-500 text-sm" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Grille tarifaire</span>
            </div>
            <div className="space-y-1.5">
              {vt.tarifs.map((tarif, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-blue-50 rounded-lg text-xs">
                  <span className="text-gray-600">{tarif.minKm} - {tarif.maxKm} km</span>
                  <span className="font-bold text-blue-700">{tarif.pricePerKm} CFA/km</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-100 text-yellow-700 rounded-xl font-semibold text-sm hover:bg-yellow-200 transition-all duration-200">
            <Icon icon="mdi:pencil" className="text-base" /> Modifier
          </button>
          <button onClick={handleToggle} disabled={togglingStatus} className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${vt.status ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"} disabled:opacity-50`}>
            {togglingStatus ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-current/20 border-t-current"></div> : <Icon icon={vt.status ? "mdi:eye-off" : "mdi:eye"} className="text-base" />}
            {vt.status ? "Desactiver" : "Activer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── Paiement Tab ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function PaiementTab() {
  const [loading, setLoading] = useState(true);
  const [paiements, setPaiements] = useState<PaiementProps[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nomPaiement, setNomPaiement] = useState("");
  const [editId, setEditId] = useState(0);
  const [editStatus, setEditStatus] = useState(true);
  const [uploadingImageId, setUploadingImageId] = useState<number | null>(null);

  const loadPaiements = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_PAIEMENT.getAll();
      setPaiements(res.data);
    } catch {
      toast.error("Erreur lors de la recuperation des paiements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPaiements(); }, []);

  const resetForm = () => { setNomPaiement(""); setEditId(0); setEditStatus(true); setIsEdit(false); };

  const handleAdd = () => { resetForm(); setShowModal(true); };

  const handleEdit = (p: PaiementProps) => {
    setNomPaiement(p.name);
    setEditId(p.id);
    setEditStatus(p.status);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleSubmitPaiement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomPaiement.trim()) { toast.error("Le nom du mode de paiement est requis"); return; }
    try {
      setSubmitting(true);
      if (isEdit) {
        const res = await SERVICE_PAIEMENT.update(nomPaiement, editId, editStatus);
        if (res.status === 200) toast.success("Mode de paiement modifie avec succes");
      } else {
        const res = await SERVICE_PAIEMENT.create(nomPaiement);
        if (res.status === 201) toast.success("Mode de paiement ajoute avec succes");
      }
      setShowModal(false);
      resetForm();
      loadPaiements();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (id: number, file: File) => {
    try {
      setUploadingImageId(id);
      const fd = new FormData();
      fd.append("image", file);
      await SERVICE_PAIEMENT.uploadImage(id, fd);
      toast.success("Image mise a jour avec succes");
      await loadPaiements();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de l'upload de l'image");
    } finally {
      setUploadingImageId(null);
    }
  };

  const getPaymentIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("orange")) return "mdi:cellphone-wireless";
    if (n.includes("wave")) return "mdi:wave";
    if (n.includes("cash") || n.includes("espece")) return "mdi:cash";
    if (n.includes("card") || n.includes("carte")) return "mdi:credit-card";
    if (n.includes("free")) return "mdi:phone";
    return "mdi:credit-card-outline";
  };

  const getPaymentColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("orange")) return { bg: "from-orange-100 to-orange-200", icon: "bg-orange-500", text: "text-orange-600" };
    if (n.includes("wave")) return { bg: "from-blue-100 to-cyan-200", icon: "bg-blue-500", text: "text-blue-600" };
    if (n.includes("cash") || n.includes("espece")) return { bg: "from-green-100 to-emerald-200", icon: "bg-green-500", text: "text-green-600" };
    if (n.includes("free")) return { bg: "from-red-100 to-rose-200", icon: "bg-red-500", text: "text-red-600" };
    return { bg: "from-purple-100 to-indigo-200", icon: "bg-purple-500", text: "text-purple-600" };
  };

  const stats = {
    total: paiements.length,
    active: paiements.filter((p) => p.status).length,
    inactive: paiements.filter((p) => !p.status).length,
  };

  if (loading) return <LoadingSpinner icon="mdi:credit-card" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total" value={stats.total} icon="mdi:credit-card-multiple" color="gray" index={0} />
        <StatCard title="Actifs" value={stats.active} icon="mdi:check-circle" color="green" index={1} />
        <StatCard title="Inactifs" value={stats.inactive} icon="mdi:close-circle" color="red" index={2} />
      </div>

      <button onClick={handleAdd} className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-dashed border-yellow-300 rounded-2xl cursor-pointer hover:from-yellow-100 hover:to-amber-100 hover:border-yellow-400 transition-all duration-300 group">
        <div className="p-2 bg-yellow-200 rounded-xl group-hover:scale-110 transition-transform">
          <Icon icon="mdi:plus" className="text-xl text-yellow-700" />
        </div>
        <span className="text-gray-700 font-medium">Ajouter un nouveau mode de paiement</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {paiements.length > 0 ? (
          paiements.map((p, index) => {
            const colors = getPaymentColor(p.name);
            const isUploading = uploadingImageId === p.id;
            return (
              <div key={p.id} className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`} style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.1}s both` }}>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full"></div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
                <div className="relative p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Image ou icone */}
                      <div className="relative group/img">
                        {p.image ? (
                          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-14 h-14 ${colors.icon} rounded-2xl flex items-center justify-center shadow-lg`}>
                            <Icon icon={getPaymentIcon(p.name)} className="text-2xl text-white" />
                          </div>
                        )}
                        {/* Overlay upload */}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                          {isUploading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                          ) : (
                            <Icon icon="mdi:camera-plus" className="text-xl text-white" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(p.id, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{p.name}</h3>
                        {p.status ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
                            <span className="h-2 w-2 rounded-full bg-red-500"></span> Inactif
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleEdit(p)} className="p-3 bg-white/80 backdrop-blur text-gray-700 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 hover:scale-110">
                      <Icon icon="mdi:pencil" className="text-lg" />
                    </button>
                  </div>
                </div>
                <div className={`h-1 ${colors.icon}`}></div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-lg">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:credit-card-off" className="text-4xl text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-700">Aucun mode de paiement disponible</p>
            <p className="text-sm text-gray-400 mt-1">Cliquez sur le bouton ci-dessus pour en ajouter un</p>
          </div>
        )}
      </div>

      {/* Modal Paiement */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 border-b border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-200 rounded-xl">
                  <Icon icon={isEdit ? "mdi:pencil" : "mdi:credit-card-plus"} className="text-2xl text-yellow-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{isEdit ? "Modifier le mode de paiement" : "Nouveau mode de paiement"}</h2>
                  <p className="text-sm text-gray-500">{isEdit ? "Modifiez les informations" : "Ajoutez un nouveau mode de paiement"}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmitPaiement} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Icon icon="mdi:tag" className="inline mr-2 text-yellow-500" /> Nom du mode de paiement
                </label>
                <input type="text" value={nomPaiement} onChange={(e) => setNomPaiement(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all" placeholder="Ex: Orange Money, Wave, etc." />
              </div>
              {isEdit && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Icon icon="mdi:toggle-switch" className="inline mr-2 text-yellow-500" /> Statut
                  </label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setEditStatus(true)} className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${editStatus ? "border-green-400 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
                      <Icon icon="mdi:check-circle" className={editStatus ? "text-green-500" : "text-gray-400"} /> Actif
                    </button>
                    <button type="button" onClick={() => setEditStatus(false)} className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${!editStatus ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
                      <Icon icon="mdi:close-circle" className={!editStatus ? "text-red-500" : "text-gray-400"} /> Inactif
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors">Fermer</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-300 to-yellow-400 text-black font-semibold rounded-xl hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md">
                  {submitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>Chargement...</>) : (<><Icon icon={isEdit ? "mdi:check" : "mdi:plus"} />{isEdit ? "Modifier" : "Ajouter"}</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── Roles & Permissions Tab ──────────────────────────────
// ═══════════════════════════════════════════════════════════
type GroupedPermissions = { [key: string]: PermissionProps[] };

const refactorPermissionName = (groupe: string, name: string) => {
  const mapping: Record<string, Record<string, string>> = {
    booking: { "CREATE_BOOKING": "Creer une reservation", "READ_BOOKING": "Voir les reservations", "UPDATE_BOOKING": "Modifier une reservation", "DELETE_BOOKING": "Supprimer une reservation" },
    user: { "CREATE_USER": "Creer un utilisateur", "READ_USER": "Voir les utilisateurs", "UPDATE_USER": "Modifier un utilisateur", "DELETE_USER": "Supprimer un utilisateur" },
  };
  return mapping[groupe]?.[name] || name;
};

const permissionColors = [
  { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
];

function RolesTab() {
  const [loading, setLoading] = useState(true);
  const [roleList, setRoleList] = useState<RoleProps[]>([]);
  const [permissions, setPermissions] = useState<GroupedPermissions>({});
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nomRole, setNomRole] = useState("");
  const [codeRole, setCodeRole] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([SERVICE_ROLE.getAll(), SERVICE_ROLE.getPermissions()]);
      setRoleList(rolesRes.data);
      const grouped = permissionsRes.data.reduce((acc: GroupedPermissions, perm: PermissionProps) => {
        if (!acc[perm.groupe]) acc[perm.groupe] = [];
        acc[perm.groupe].push(perm);
        return acc;
      }, {});
      setPermissions(grouped);
    } catch {
      toast.error("Erreur lors de la recuperation des roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); }, []);

  const resetForm = () => { setNomRole(""); setCodeRole(""); setSelectedPermissions([]); setIsEdit(false); };

  const handleAddRole = () => { resetForm(); setShowModal(true); };

  const handleEditRole = (role: RoleProps) => {
    setNomRole(role.nom);
    setCodeRole(role.code);
    setSelectedPermissions(role.permissions);
    setIsEdit(true);
    setShowModal(true);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomRole || selectedPermissions.length === 0) { toast.error("Nom et au moins une permission requis"); return; }
    try {
      setSubmitting(true);
      if (isEdit) {
        const res = await SERVICE_ROLE.update(nomRole, selectedPermissions, codeRole);
        if (res.status === 200) toast.success("Role modifie avec succes");
      } else {
        const res = await SERVICE_ROLE.create(nomRole, selectedPermissions);
        if (res.status === 201) toast.success("Role cree avec succes");
      }
      setShowModal(false);
      resetForm();
      loadRoles();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: roleList.length,
    totalPermissions: Object.values(permissions).flat().length,
    categories: Object.keys(permissions).length,
  };

  if (loading) return <LoadingSpinner icon="mdi:shield-account" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Roles" value={stats.total} icon="mdi:shield-account" color="yellow" index={0} />
        <StatCard title="Permissions" value={stats.totalPermissions} icon="mdi:key" color="blue" index={1} />
        <StatCard title="Categories" value={stats.categories} icon="mdi:folder-multiple" color="purple" index={2} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Gestion des roles</h2>
          <p className="text-sm text-gray-500">Definissez les roles et attribuez les permissions</p>
        </div>
        <AddButton onClick={handleAddRole} label="Nouveau Role" />
      </div>

      <TableContainer>
        <table className="w-full">
          <TableHeader>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Permissions</TableHeaderCell>
            <TableHeaderCell className="text-center">Actions</TableHeaderCell>
          </TableHeader>
          <tbody>
            {roleList.length > 0 ? (
              roleList.map((role, index) => (
                <AnimatedTableRow key={role.code} index={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Icon icon="mdi:shield-account" className="text-xl text-yellow-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">{role.nom}</span>
                        <p className="text-xs text-gray-400 font-mono">{role.code}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.slice(0, 3).map((perm, idx) => {
                        const c = permissionColors[idx % permissionColors.length];
                        return (
                          <span key={idx} className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full ${c.bg} ${c.text} border ${c.border} shadow-sm`}>
                            <Icon icon="mdi:check-circle" className="text-xs" /> {perm}
                          </span>
                        );
                      })}
                      {role.permissions.length > 3 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full border border-yellow-200 shadow-sm">
                          <Icon icon="mdi:plus-circle" className="text-xs" /> +{role.permissions.length - 3} autres
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => handleEditRole(role)} className="p-2.5 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 rounded-xl hover:from-yellow-200 hover:to-yellow-300 transition-all hover:scale-110 shadow-sm">
                      <Icon icon="mdi:pencil" className="text-lg" />
                    </button>
                  </TableCell>
                </AnimatedTableRow>
              ))
            ) : (
              <EmptyState icon="mdi:shield-off" title="Aucun role disponible" description="Les roles apparaitront ici une fois ajoutes" />
            )}
          </tbody>
        </table>
      </TableContainer>

      {/* Modal Role */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 border-b border-yellow-200 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-200 rounded-xl">
                    <Icon icon={isEdit ? "mdi:pencil" : "mdi:shield-plus"} className="text-2xl text-yellow-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{isEdit ? `Modifier le role ${nomRole}` : "Nouveau role"}</h2>
                    <p className="text-sm text-gray-500">{isEdit ? "Modifiez les permissions du role" : "Definissez un nouveau role avec ses permissions"}</p>
                  </div>
                </div>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                  <Icon icon="mdi:close" className="text-xl text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitRole} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Icon icon="mdi:tag" className="inline mr-2 text-yellow-500" /> Nom du role
                </label>
                <input type="text" value={nomRole} onChange={(e) => setNomRole(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all" placeholder="Nom du role" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon="mdi:shield-check" className="text-yellow-600 text-xl" />
                  <h3 className="text-lg font-semibold text-gray-800">Liste des autorisations</h3>
                  <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                    {selectedPermissions.length} selectionnee(s)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(permissions).map((groupe) => (
                    <div key={groupe} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-gradient-to-r from-yellow-100 to-amber-100 px-4 py-3 border-b border-yellow-200">
                        <div className="flex items-center gap-2">
                          <Icon icon="mdi:folder-key" className="text-yellow-600" />
                          <span className="font-semibold text-gray-800">{groupe.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        {permissions[groupe].map((perm) => (
                          <label key={perm.codePermission} className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-all ${selectedPermissions.includes(perm.namePermission) ? "bg-yellow-50 border border-yellow-200" : "hover:bg-gray-50"}`}>
                            <input type="checkbox" checked={selectedPermissions.includes(perm.namePermission)} onChange={() => togglePermission(perm.namePermission)} className="w-5 h-5 accent-yellow-400 rounded" />
                            <span className="text-sm font-medium text-gray-700">{refactorPermissionName(groupe, perm.namePermission)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors">Fermer</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-300 to-yellow-400 text-black font-semibold rounded-xl hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md">
                  {submitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>Chargement...</>) : (<><Icon icon={isEdit ? "mdi:check" : "mdi:plus"} />{isEdit ? "Modifier" : "Enregistrer"}</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── Administrateurs Tab ─────────────────────────────────
// ═══════════════════════════════════════════════════════════
function AdminsTab() {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminProps[]>([]);
  const [allAdmins, setAllAdmins] = useState<AdminProps[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [matricule, setMatricule] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [statusAction, setStatusAction] = useState<"ACTIVE" | "DEACTIVATED" | "BANNED">("ACTIVE");
  const [confirmText, setConfirmText] = useState("");

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_ADMINISTRATEUR.getAll("");
      setAllAdmins(res.data);
      setAdmins(res.data);
    } catch {
      toast.error("Erreur lors de la recuperation des administrateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  useEffect(() => {
    let filtered = [...allAdmins];
    if (searchTerm) {
      filtered = filtered.filter((a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.phone.includes(searchTerm)
      );
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    setAdmins(filtered);
  }, [searchTerm, statusFilter, allAdmins]);

  const resetForm = () => { setMatricule(""); setNom(""); setEmail(""); setTelephone(""); setAdresse(""); setConfirmText(""); setIsEdit(false); };

  const handleAdd = () => { resetForm(); setShowModal(true); };

  const handleEdit = (admin: AdminProps) => {
    setMatricule(admin.matricule);
    setNom(admin.name);
    setEmail(admin.email);
    setTelephone(admin.phone.replace("+221", ""));
    setAdresse(admin.address);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleStatusChange = (admin: AdminProps, action: "ACTIVE" | "DEACTIVATED" | "BANNED") => {
    setMatricule(admin.matricule);
    setStatusAction(action);
    setConfirmText("");
    setShowStatusModal(true);
  };

  const handleSubmitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !email || !telephone || !adresse) { toast.error("Veuillez remplir tous les champs"); return; }
    try {
      setSubmitting(true);
      const phone = telephone.startsWith("+221") ? telephone : `+221${telephone}`;
      if (isEdit) {
        const res = await SERVICE_ADMINISTRATEUR.update(matricule, nom, email, phone, adresse);
        if (res.status === 200) toast.success("Administrateur modifie avec succes");
      } else {
        const res = await SERVICE_ADMINISTRATEUR.create(nom, email, phone, adresse);
        if (res.status === 200) toast.success(`Administrateur cree. Un email a ete envoye a ${email}.`);
      }
      setShowModal(false);
      resetForm();
      loadAdmins();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmWord = statusAction === "ACTIVE" ? "ACTIVER" : statusAction === "BANNED" ? "BANNIR" : "DESACTIVER";
    if (confirmText !== confirmWord) { toast.error(`Tapez "${confirmWord}" pour confirmer`); return; }
    try {
      setSubmitting(true);
      const res = await SERVICE_ADMINISTRATEUR.updateStatus(matricule, statusAction);
      if (res.status === 200) toast.success("Statut modifie avec succes");
      setShowStatusModal(false);
      resetForm();
      loadAdmins();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors du changement de statut");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: allAdmins.length,
    active: allAdmins.filter((a) => a.status === "ACTIVE").length,
    deactivated: allAdmins.filter((a) => a.status === "DEACTIVATED").length,
    banned: allAdmins.filter((a) => a.status === "BANNED").length,
  };

  if (loading) return <LoadingSpinner icon="mdi:account-tie" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={stats.total} icon="mdi:account-group" color="gray" index={0} />
        <StatCard title="Actifs" value={stats.active} icon="mdi:check-circle" color="green" index={1} />
        <StatCard title="Desactives" value={stats.deactivated} icon="mdi:account-off" color="yellow" index={2} />
        <StatCard title="Bannis" value={stats.banned} icon="mdi:account-cancel" color="red" index={3} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Liste des administrateurs</h2>
          <p className="text-sm text-gray-500">Gerez les comptes administrateurs</p>
        </div>
        <AddButton onClick={handleAdd} label="Nouveau Admin" />
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-2">
          {[
            { value: "ALL", label: "Tous", icon: "mdi:format-list-bulleted" },
            { value: "ACTIVE", label: "Actifs", icon: "mdi:check-circle" },
            { value: "DEACTIVATED", label: "Desactives", icon: "mdi:account-off" },
            { value: "BANNED", label: "Bannis", icon: "mdi:account-cancel" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === opt.value
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon icon={opt.icon} className="text-sm" />
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou telephone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Icon icon="mdi:close-circle" />
            </button>
          )}
        </div>
      </div>

      {/* Tableau */}
      <TableContainer>
        <table className="w-full">
          <TableHeader>
            <TableHeaderCell>Administrateur</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Telephone</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Statut</TableHeaderCell>
            <TableHeaderCell className="text-center">Actions</TableHeaderCell>
          </TableHeader>
          <tbody>
            {admins.length > 0 ? (
              admins.map((admin, index) => (
                <AnimatedTableRow key={admin.matricule} index={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=FEF08A&color=713F12&bold=true`}
                          alt={admin.name}
                          className="w-11 h-11 rounded-full ring-2 ring-yellow-200"
                        />
                        {admin.status === "ACTIVE" && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full">
                            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{admin.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{admin.matricule}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:email" className="text-gray-400" />
                      <span className="text-gray-600">{admin.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:phone" className="text-gray-400" />
                      <span className="font-medium">{admin.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full border border-blue-200 shadow-sm">
                      <Icon icon="mdi:shield-account" className="text-sm" />
                      {admin.role?.nameRole || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={admin.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(admin)} className="p-2.5 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 rounded-xl hover:from-yellow-200 hover:to-yellow-300 transition-all hover:scale-110 shadow-sm" title="Modifier">
                        <Icon icon="mdi:pencil" />
                      </button>
                      {admin.status !== "ACTIVE" && (
                        <button onClick={() => handleStatusChange(admin, "ACTIVE")} className="p-2.5 bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 rounded-xl hover:from-green-200 hover:to-emerald-300 transition-all hover:scale-110 shadow-sm" title="Activer">
                          <Icon icon="mdi:check" />
                        </button>
                      )}
                      {admin.status === "ACTIVE" && (
                        <button onClick={() => handleStatusChange(admin, "DEACTIVATED")} className="p-2.5 bg-gradient-to-r from-gray-100 to-slate-200 text-gray-600 rounded-xl hover:from-gray-200 hover:to-slate-300 transition-all hover:scale-110 shadow-sm" title="Desactiver">
                          <Icon icon="mdi:lock" />
                        </button>
                      )}
                      {admin.status !== "BANNED" && (
                        <button onClick={() => handleStatusChange(admin, "BANNED")} className="p-2.5 bg-gradient-to-r from-red-100 to-rose-200 text-red-600 rounded-xl hover:from-red-200 hover:to-rose-300 transition-all hover:scale-110 shadow-sm" title="Bannir">
                          <Icon icon="mdi:block-helper" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </AnimatedTableRow>
              ))
            ) : (
              <EmptyState icon="mdi:account-off" title="Aucun administrateur" description="Les administrateurs apparaitront ici une fois ajoutes" />
            )}
          </tbody>
        </table>
      </TableContainer>

      {/* Modal Add/Edit Admin */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-400 rounded-xl shadow-md">
                    <Icon icon={isEdit ? "mdi:pencil" : "mdi:account-plus"} className="text-xl text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{isEdit ? "Modifier l'administrateur" : "Nouvel administrateur"}</h3>
                    <p className="text-sm text-gray-500">{isEdit ? "Modifiez les informations" : "Ajoutez un nouvel administrateur"}</p>
                  </div>
                </div>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                  <Icon icon="mdi:close" className="text-xl text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmitAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2"><Icon icon="mdi:account" className="inline mr-1 text-yellow-500" /> Nom & Prenom</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom complet" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2"><Icon icon="mdi:email" className="inline mr-1 text-yellow-500" /> Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2"><Icon icon="mdi:phone" className="inline mr-1 text-yellow-500" /> Telephone</label>
                <div className="flex">
                  <span className="px-4 py-3 bg-gray-100 border-2 border-r-0 border-gray-200 rounded-l-xl font-medium text-gray-600">+221</span>
                  <input type="text" value={telephone} onChange={(e) => setTelephone(e.target.value.replace(/\D/g, ""))} placeholder="77 123 45 67" maxLength={9} className="w-full px-4 py-3 border-2 border-gray-200 rounded-r-xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2"><Icon icon="mdi:map-marker" className="inline mr-1 text-yellow-500" /> Adresse</label>
                <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Adresse" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all">Annuler</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-xl font-semibold text-black hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-black/20 border-t-black"></div>Enregistrement...</>) : (<><Icon icon={isEdit ? "mdi:check" : "mdi:plus"} className="text-lg" />{isEdit ? "Modifier" : "Creer"}</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Status */}
      {showStatusModal && (() => {
        const confirmWord = statusAction === "ACTIVE" ? "ACTIVER" : statusAction === "BANNED" ? "BANNIR" : "DESACTIVER";
        const colorClass = statusAction === "ACTIVE" ? "green" : statusAction === "BANNED" ? "red" : "gray";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStatusModal(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className={`bg-gradient-to-r ${colorClass === "green" ? "from-green-50 to-emerald-100 border-green-200" : colorClass === "red" ? "from-red-50 to-rose-100 border-red-200" : "from-gray-50 to-slate-100 border-gray-200"} p-6 border-b`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 ${colorClass === "green" ? "bg-green-200" : colorClass === "red" ? "bg-red-200" : "bg-gray-200"} rounded-xl`}>
                    <Icon icon={statusAction === "ACTIVE" ? "mdi:check-circle" : statusAction === "BANNED" ? "mdi:block-helper" : "mdi:lock"} className={`text-2xl ${colorClass === "green" ? "text-green-700" : colorClass === "red" ? "text-red-700" : "text-gray-700"}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Modifier le statut</h2>
                    <p className="text-sm text-gray-500">Cette action necessite une confirmation</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSubmitStatus} className="p-6">
                <p className="text-gray-600 mb-4">Tapez <strong className={colorClass === "green" ? "text-green-600" : colorClass === "red" ? "text-red-600" : "text-gray-600"}>"{confirmWord}"</strong> pour confirmer</p>
                <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={confirmWord} className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all ${confirmText === confirmWord ? (colorClass === "green" ? "border-green-400 focus:ring-green-200" : colorClass === "red" ? "border-red-400 focus:ring-red-200" : "border-gray-400 focus:ring-gray-200") : "border-gray-200 focus:border-gray-400 focus:ring-gray-100"}`} />
                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => setShowStatusModal(false)} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors">Annuler</button>
                  <button type="submit" disabled={submitting || confirmText !== confirmWord} className={`flex-1 px-4 py-3 font-semibold rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md ${colorClass === "green" ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white" : colorClass === "red" ? "bg-gradient-to-r from-red-400 to-rose-500 text-white" : "bg-gradient-to-r from-gray-400 to-slate-500 text-white"}`}>
                    {submitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Chargement...</>) : (<><Icon icon="mdi:check" />Confirmer</>)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── Shared Components ────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function LoadingSpinner({ icon }: { icon: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-yellow-400"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon icon={icon} className="text-yellow-500 text-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ComingSoonTab({ tab }: { tab: Tab }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-16 text-center">
      <div className="max-w-sm mx-auto">
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Icon icon={tab.icon} className="text-5xl text-yellow-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md mx-auto" style={{ left: "calc(50% + 20px)" }}>
            <Icon icon="mdi:clock-outline" className="text-white text-sm" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{tab.label}</h3>
        <p className="text-gray-500 mb-1">{tab.description}</p>
        <p className="text-sm text-gray-400">Cette section sera disponible prochainement.</p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium border border-yellow-200">
          <Icon icon="mdi:wrench" className="animate-pulse" /> En cours de developpement
        </div>
      </div>
    </div>
  );
}
