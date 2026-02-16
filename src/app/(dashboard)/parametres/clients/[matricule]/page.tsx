"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmModal from "@/components/ConfirmModal";
import { SERVICE_CLIENT, ClientProps } from "@/services/client-service";
import { SERVICE_COURSE, CourseProps } from "@/services/course-service";

export default function ClientDetails() {
  const params = useParams();
  const router = useRouter();
  const matricule = params.matricule as string;

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientProps | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "history">("info");

  // Courses du client
  const [clientCourses, setClientCourses] = useState<CourseProps[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "activate" | "deactivate" | "ban" | "pending";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadClient = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_CLIENT.getOne(matricule);

      if (res.status === 200) {
        setClient(res.data);
      } else {
        toast.error("Client non trouve");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des donnees");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      const res = await SERVICE_COURSE.getByCustomer(matricule);
      setClientCourses(res.data || []);
    } catch (error) {
      console.log("Courses non disponibles:", error);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    if (matricule) {
      loadClient();
      loadCourses();
    }
  }, [matricule]);

  const handleStatusAction = (type: "activate" | "deactivate" | "ban" | "pending") => {
    setConfirmAction({ type });
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    if (!confirmAction || !client) return;

    setActionLoading(true);
    try {
      let res;
      const { type } = confirmAction;

      switch (type) {
        case "activate":
          res = await SERVICE_CLIENT.activate(client.matricule);
          break;
        case "deactivate":
          res = await SERVICE_CLIENT.deactivate(client.matricule);
          break;
        case "ban":
          res = await SERVICE_CLIENT.ban(client.matricule);
          break;
        case "pending":
          res = await SERVICE_CLIENT.setPending(client.matricule);
          break;
      }

      if (res.status === 200 || res.status === 201) {
        const messages = {
          activate: "Client active avec succes",
          deactivate: "Client desactive avec succes",
          ban: "Client banni avec succes",
          pending: "Client mis en attente",
        };
        toast.success(messages[type]);
        setShowConfirmModal(false);
        setConfirmAction(null);
        loadClient();
      } else {
        toast.error(res.message || "Erreur lors de l'operation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'operation");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const getConfirmModalConfig = () => {
    if (!confirmAction || !client) return { title: "", message: "", type: "warning" as const };

    const configs = {
      activate: {
        title: "Activer le client",
        message: `Voulez-vous activer le client ${client.name} ?`,
        type: "success" as const,
        confirmText: "Activer",
      },
      deactivate: {
        title: "Desactiver le client",
        message: `Voulez-vous desactiver le client ${client.name} ?`,
        type: "warning" as const,
        confirmText: "Desactiver",
      },
      ban: {
        title: "Bannir le client",
        message: `Voulez-vous bannir le client ${client.name} ? Cette action est serieuse.`,
        type: "danger" as const,
        confirmText: "Bannir",
      },
      pending: {
        title: "Mettre en attente",
        message: `Voulez-vous mettre le client ${client.name} en attente ?`,
        type: "info" as const,
        confirmText: "Confirmer",
      },
    };

    return configs[confirmAction.type];
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      ACTIVE: { bg: "bg-green-100", text: "text-green-700", label: "Actif" },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En attente" },
      DEACTIVATED: { bg: "bg-gray-100", text: "text-gray-700", label: "Desactive" },
      BANNED: { bg: "bg-red-100", text: "text-red-700", label: "Banni" },
    };
    const c = config[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:account-off" className="text-6xl mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-600">Client non trouve</p>
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

          <div className="flex items-start gap-6">
            <div className="relative">
              {client.avatar ? (
                <img
                  src={client.avatar}
                  alt={client.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-yellow-300"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-600 text-3xl font-bold border-4 border-yellow-300">
                  {client.name?.charAt(0) || "?"}
                </div>
              )}
              {client.isOnline && (
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full"></div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{client.name}</h1>
                {getStatusBadge(client.status)}
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  client.isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${client.isOnline ? "bg-green-500" : "bg-gray-400"}`}></span>
                  {client.isOnline ? "En ligne" : "Hors ligne"}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Matricule</p>
                  <p className="font-medium">{client.matricule}</p>
                </div>
                <div>
                  <p className="text-gray-500">Telephone</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{client.email || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Courses</p>
                  <p className="font-medium">{clientCourses.length || client.totalRides || 0}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2">
              {client.status !== "ACTIVE" && (
                <button
                  onClick={() => handleStatusAction("activate")}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2 text-sm font-medium"
                >
                  <Icon icon="mdi:check-circle" />
                  Activer
                </button>
              )}
              {client.status !== "DEACTIVATED" && (
                <button
                  onClick={() => handleStatusAction("deactivate")}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium"
                >
                  <Icon icon="mdi:account-off" />
                  Desactiver
                </button>
              )}
              {client.status !== "BANNED" && (
                <button
                  onClick={() => handleStatusAction("ban")}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2 text-sm font-medium"
                >
                  <Icon icon="mdi:account-cancel" />
                  Bannir
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "info"
                  ? "border-yellow-400 text-yellow-600 bg-yellow-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon icon="mdi:information" className="inline mr-2" />
              Informations
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "history"
                  ? "border-yellow-400 text-yellow-600 bg-yellow-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon icon="mdi:history" className="inline mr-2" />
              Historique des courses
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations personnelles */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:account" className="text-yellow-500" />
              Informations personnelles
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Nom complet</span>
                <span className="font-medium">{client.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Telephone</span>
                <span className="font-medium">{client.phone}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{client.email || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Matricule</span>
                <span className="font-medium text-xs bg-gray-100 px-2 py-1 rounded">{client.matricule}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500">Date d'inscription</span>
                <span className="font-medium">
                  {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:chart-bar" className="text-yellow-500" />
              Statistiques des courses
            </h3>
            {coursesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <Icon icon="mdi:car-multiple" className="text-3xl text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">{clientCourses.length}</p>
                    <p className="text-xs text-gray-500">Total courses</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <Icon icon="mdi:check-circle" className="text-3xl text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">
                      {clientCourses.filter(c => c.status === "DONE").length}
                    </p>
                    <p className="text-xs text-gray-500">Terminees</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <Icon icon="mdi:close-circle" className="text-3xl text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-700">
                      {clientCourses.filter(c => c.status === "CANCELED" || c.status === "CANCELED_BY_CUSTOMER" || c.status === "CANCELED_BY_DRIVER").length}
                    </p>
                    <p className="text-xs text-gray-500">Annulees</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <Icon icon="mdi:clock-outline" className="text-3xl text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-700">
                      {clientCourses.filter(c => c.status === "PENDING" || c.status === "IN_PROGRESS").length}
                    </p>
                    <p className="text-xs text-gray-500">En cours / Attente</p>
                  </div>
                </div>

                {/* Taux de completion */}
                {clientCourses.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-700">Taux de completion</p>
                      <p className="text-sm font-bold text-green-600">
                        {Math.round((clientCourses.filter(c => c.status === "DONE").length / clientCourses.length) * 100)}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((clientCourses.filter(c => c.status === "DONE").length / clientCourses.length) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Total depense */}
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <Icon icon="mdi:cash-multiple" className="text-2xl text-yellow-600" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Total depense</p>
                      <p className="text-xl font-bold text-gray-800">
                        {clientCourses.filter(c => c.status === "DONE").reduce((sum, c) => sum + c.price, 0).toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Statut du compte */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:shield-account" className="text-yellow-500" />
              Statut du compte
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Statut</span>
                {getStatusBadge(client.status)}
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Connectivite</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  client.isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${client.isOnline ? "bg-green-500" : "bg-gray-400"}`}></span>
                  {client.isOnline ? "En ligne" : "Hors ligne"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:lightning-bolt" className="text-yellow-500" />
              Actions rapides
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="px-4 py-3 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 flex items-center justify-center gap-2 font-medium">
                <Icon icon="mdi:message" />
                Envoyer SMS
              </button>
              <button className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 flex items-center justify-center gap-2 font-medium">
                <Icon icon="mdi:email" />
                Envoyer Email
              </button>
              <button className="px-4 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 flex items-center justify-center gap-2 font-medium">
                <Icon icon="mdi:phone" />
                Appeler
              </button>
              <button className="px-4 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 flex items-center justify-center gap-2 font-medium">
                <Icon icon="mdi:history" />
                Voir activite
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon="mdi:history" className="text-yellow-500" />
            Historique des courses ({clientCourses.length})
          </h3>

          {coursesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-600"></div>
            </div>
          ) : clientCourses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                    <th className="pb-3 pr-4">Course</th>
                    <th className="pb-3 pr-4">Trajet</th>
                    <th className="pb-3 pr-4">Chauffeur</th>
                    <th className="pb-3 pr-4">Statut</th>
                    <th className="pb-3 pr-4">Prix</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientCourses.map((course) => {
                    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                      DONE: { bg: "bg-green-100", text: "text-green-700", label: "Terminee" },
                      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En attente" },
                      ACCEPTED: { bg: "bg-cyan-100", text: "text-cyan-700", label: "Acceptee" },
                      DRIVER_IN_PROGRESS: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Chauffeur en route" },
                      IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700", label: "En cours" },
                      CANCELED: { bg: "bg-red-100", text: "text-red-700", label: "Annulee" },
                      CANCELED_BY_CUSTOMER: { bg: "bg-orange-100", text: "text-orange-700", label: "Annulee client" },
                      CANCELED_BY_DRIVER: { bg: "bg-purple-100", text: "text-purple-700", label: "Annulee chauffeur" },
                    };
                    const sc = statusConfig[course.status] || { bg: "bg-gray-100", text: "text-gray-700", label: course.status };

                    return (
                      <tr
                        key={course.id}
                        onClick={() => router.push(`/reservations/reservations/${course.code_booking}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <p className="text-sm font-semibold text-gray-800">#{course.code_booking}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="text-xs text-gray-600 max-w-[200px]">
                            <p className="truncate flex items-center gap-1">
                              <Icon icon="mdi:map-marker" className="text-green-500 flex-shrink-0" />
                              {course.pickup_location.address || "N/A"}
                            </p>
                            <p className="truncate flex items-center gap-1 mt-0.5">
                              <Icon icon="mdi:map-marker" className="text-red-500 flex-shrink-0" />
                              {course.dropoff_location.address || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="text-sm text-gray-700">{course.driver?.name || "Non assigne"}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="text-sm font-semibold text-gray-800">{course.price.toLocaleString()} FCFA</p>
                        </td>
                        <td className="py-3">
                          <p className="text-xs text-gray-500">
                            {new Date(course.created_at).toLocaleDateString("fr-FR")}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(course.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="mdi:car-clock" className="text-6xl mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Aucune course</p>
              <p className="text-sm text-gray-400 mt-1">
                Ce client n'a pas encore effectue de course
              </p>
            </div>
          )}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        onConfirm={executeAction}
        {...getConfirmModalConfig()}
        loading={actionLoading}
      />
    </div>
  );
}
