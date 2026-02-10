"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_COURSE, CourseProps } from "@/services/course-service";
import { SERVICE_CHAUFFEUR, ChauffeurProps } from "@/services/chauffeur-service";

export default function CourseDetails() {
  const params = useParams();
  const router = useRouter();
  const codeBooking = params.code_booking as string;

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseProps | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<ChauffeurProps[]>([]);

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_COURSE.getOne(codeBooking);

      if (res.status === 200) {
        setCourse(res.data);
      } else {
        toast.error("Course non trouvee");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des donnees");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await SERVICE_CHAUFFEUR.getAll();
      const activeDrivers = (response.data || []).filter(
        (d) => d.status === "ACTIVE" && d.isOnline
      );
      setAvailableDrivers(activeDrivers);
    } catch (error) {
      console.error("Erreur chargement chauffeurs:", error);
    }
  };

  useEffect(() => {
    if (codeBooking) {
      loadCourse();
      loadDrivers();
    }
  }, [codeBooking]);

  const executeCancelCourse = async () => {
    if (!course || !cancelReason.trim()) {
      toast.error("Veuillez indiquer une raison d'annulation");
      return;
    }

    setActionLoading(true);
    try {
      const res = await SERVICE_COURSE.cancel(course.code_booking, cancelReason);
      if (res.status === 200 || res.status === 201) {
        toast.success("Course annulee avec succes");
        setShowCancelModal(false);
        setCancelReason("");
        loadCourse();
      } else {
        toast.error(res.message || "Erreur lors de l'annulation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setActionLoading(false);
    }
  };

  const executeAssignDriver = async () => {
    if (!course || !selectedDriver) {
      toast.error("Veuillez selectionner un chauffeur");
      return;
    }

    setActionLoading(true);
    try {
      const res = await SERVICE_COURSE.assignDriver(course.code_booking, selectedDriver);
      if (res.status === 200 || res.status === 201) {
        toast.success("Chauffeur assigne avec succes");
        setShowAssignModal(false);
        setSelectedDriver("");
        loadCourse();
      } else {
        toast.error(res.message || "Erreur lors de l'assignation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'assignation");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
      DONE: { bg: "bg-green-100", text: "text-green-700", label: "Terminee", icon: "mdi:check-circle" },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En attente", icon: "mdi:clock-outline" },
      IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700", label: "En cours", icon: "mdi:car-clock" },
      CANCELED: { bg: "bg-red-100", text: "text-red-700", label: "Annulee", icon: "mdi:close-circle" },
      CANCELED_BY_CUSTOMER: { bg: "bg-orange-100", text: "text-orange-700", label: "Annulee par client", icon: "mdi:account-cancel" },
      CANCELED_BY_DRIVER: { bg: "bg-purple-100", text: "text-purple-700", label: "Annulee par chauffeur", icon: "mdi:account-cancel" },
    };
    const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status, icon: "mdi:help-circle" };
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon icon={config.icon} />
        {config.label}
      </span>
    );
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:car-off" className="text-6xl mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-600">Course non trouvee</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-yellow-300 text-black rounded-lg hover:bg-yellow-400"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md mb-6">
        <div className="p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <Icon icon="mdi:arrow-left" />
            Retour a la liste
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">Course #{course.code_booking}</h1>
                {getStatusBadge(course.status)}
              </div>
              <p className="text-gray-500">
                Creee le {new Date(course.created_at).toLocaleDateString("fr-FR")} a{" "}
                {new Date(course.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              {!course.driver && course.status === "PENDING" && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2 font-medium"
                >
                  <Icon icon="mdi:account-plus" />
                  Assigner chauffeur
                </button>
              )}
              {(course.status === "PENDING" || course.status === "IN_PROGRESS") && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2 font-medium"
                >
                  <Icon icon="mdi:close-circle" />
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trajet */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:map-marker-path" className="text-yellow-500" />
              Trajet
            </h3>

            <div className="space-y-4">
              {/* Depart */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:map-marker" className="text-green-600 text-xl" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase font-medium">Point de depart</p>
                  <p className="font-medium text-gray-800">{course.pickup_location.address}</p>
                  <p className="text-xs text-gray-400">
                    {course.pickup_location.latitude}, {course.pickup_location.longitude}
                  </p>
                </div>
              </div>

              {/* Line */}
              <div className="ml-5 border-l-2 border-dashed border-gray-200 h-8"></div>

              {/* Arrivee */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:map-marker" className="text-red-600 text-xl" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase font-medium">Point d'arrivee</p>
                  <p className="font-medium text-gray-800">{course.dropoff_location.address}</p>
                  <p className="text-xs text-gray-400">
                    {course.dropoff_location.latitude}, {course.dropoff_location.longitude}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Icon icon="mdi:map-marker-distance" className="text-2xl text-gray-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-800">{formatDistance(course.distance)}</p>
                <p className="text-xs text-gray-500">Distance</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Icon icon="mdi:clock-outline" className="text-2xl text-gray-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-800">{formatDuration(course.duration)}</p>
                <p className="text-xs text-gray-500">Duree estimee</p>
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:account" className="text-yellow-500" />
              Client
            </h3>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-600 text-2xl font-bold">
                {course.customer.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-800">{course.customer.name}</p>
                <p className="text-gray-500">{course.customer.phone}</p>
                <p className="text-xs text-gray-400">Matricule: {course.customer.matricule}</p>
              </div>
              <button
                onClick={() => router.push(`/parametres/clients/${course.customer.matricule}`)}
                className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center gap-2"
              >
                <Icon icon="mdi:eye" />
                Voir profil
              </button>
            </div>
          </div>

          {/* Chauffeur */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:account-tie" className="text-yellow-500" />
              Chauffeur
            </h3>

            {course.driver ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 text-2xl font-bold">
                  {course.driver.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-800">{course.driver.name}</p>
                  <p className="text-gray-500">{course.driver.phone}</p>
                  <p className="text-xs text-gray-400">Matricule: {course.driver.matricule}</p>
                </div>
                <button
                  onClick={() => router.push(`/parametres/chauffeurs/${course.driver!.matricule}`)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
                >
                  <Icon icon="mdi:eye" />
                  Voir profil
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon icon="mdi:account-question" className="text-5xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun chauffeur assigne</p>
                {course.status === "PENDING" && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="mt-4 px-4 py-2 bg-yellow-300 text-black rounded-lg hover:bg-yellow-400 flex items-center gap-2 mx-auto"
                  >
                    <Icon icon="mdi:account-plus" />
                    Assigner un chauffeur
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Rating & Review */}
          {course.status === "DONE" && course.rating && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Icon icon="mdi:star" className="text-yellow-500" />
                Evaluation
              </h3>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                      key={star}
                      icon="mdi:star"
                      className={`text-2xl ${star <= (course.rating || 0) ? "text-yellow-400" : "text-gray-200"}`}
                    />
                  ))}
                </div>
                <span className="text-2xl font-bold text-gray-800">{course.rating}/5</span>
              </div>

              {course.review && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-600 italic">"{course.review}"</p>
                </div>
              )}
            </div>
          )}

          {/* Cancel Reason */}
          {(course.status === "CANCELED" || course.status === "CANCELED_BY_CUSTOMER" || course.status === "CANCELED_BY_DRIVER") && course.cancel_reason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
                <Icon icon="mdi:alert-circle" />
                Raison de l'annulation
              </h3>
              <p className="text-red-700">{course.cancel_reason}</p>
            </div>
          )}
        </div>

        {/* Right Column - Payment & Timeline */}
        <div className="space-y-6">
          {/* Payment */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:credit-card" className="text-yellow-500" />
              Paiement
            </h3>

            <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-xl p-6 text-black mb-4">
              <p className="text-sm opacity-80">Montant total</p>
              <p className="text-3xl font-bold">{course.price.toLocaleString()} CFA</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Mode de paiement</span>
                <span className="font-medium">{course.payment_method?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Commission</span>
                <span className="font-medium">{course.commission.toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500">Statut paiement</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  course.payment_status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {course.payment_status === "PAID" ? "Paye" : "En attente"}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:timeline" className="text-yellow-500" />
              Chronologie
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:plus" className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Course creee</p>
                  <p className="text-sm text-gray-500">
                    {new Date(course.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>

              {course.driver && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon icon="mdi:account-check" className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Chauffeur assigne</p>
                    <p className="text-sm text-gray-500">{course.driver.name}</p>
                  </div>
                </div>
              )}

              {course.started_at && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <Icon icon="mdi:car" className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Course demarree</p>
                    <p className="text-sm text-gray-500">
                      {new Date(course.started_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              )}

              {course.completed_at && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Icon icon="mdi:check-circle" className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Course terminee</p>
                    <p className="text-sm text-gray-500">
                      {new Date(course.completed_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              )}

              {(course.status === "CANCELED" || course.status === "CANCELED_BY_CUSTOMER" || course.status === "CANCELED_BY_DRIVER") && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Icon icon="mdi:close-circle" className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Course annulee</p>
                    <p className="text-sm text-gray-500">
                      {new Date(course.updated_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCancelModal(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-red-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Annuler la course</h2>
                <button onClick={() => setShowCancelModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <Icon icon="mdi:close" className="text-xl text-white" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Vous etes sur le point d'annuler la course <strong>{course.code_booking}</strong>.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison de l'annulation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Indiquez la raison de l'annulation..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  onClick={executeCancelCourse}
                  disabled={actionLoading || !cancelReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Icon icon="mdi:close-circle" />
                      Annuler
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAssignModal(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-yellow-300 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-black">Assigner un chauffeur</h2>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <Icon icon="mdi:close" className="text-xl text-black" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Selectionner un chauffeur pour cette course.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chauffeur disponible <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                >
                  <option value="">Selectionner un chauffeur</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver.matricule} value={driver.matricule}>
                      {driver.name} - {driver.phone}
                    </option>
                  ))}
                </select>
                {availableDrivers.length === 0 && (
                  <p className="text-sm text-orange-500 mt-1">Aucun chauffeur disponible en ligne</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={executeAssignDriver}
                  disabled={actionLoading || !selectedDriver}
                  className="flex-1 px-4 py-2.5 bg-yellow-300 text-black rounded-xl hover:bg-yellow-400 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                  ) : (
                    <>
                      <Icon icon="mdi:account-check" />
                      Assigner
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
