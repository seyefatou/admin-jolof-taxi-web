"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_PAIEMENT, PaiementProps } from "@/services/paiement-service";
import ErrorPopup from "@/components/ErrorPopup";
import { useErrorPopup } from "@/hooks/useErrorPopup";
import {
  StatCard,
  PageHeader,
} from "@/components/ui/AnimatedTable";

export default function PaiementsPage() {
  const [loading, setLoading] = useState(true);
  const [paiements, setPaiements] = useState<PaiementProps[]>([]);
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [nomPaiement, setNomPaiement] = useState("");
  const [editId, setEditId] = useState<number>(0);
  const [editStatus, setEditStatus] = useState(true);
  const [uploadingImageId, setUploadingImageId] = useState<number | null>(null);

  // Hook pour les popups d'erreur
  const { errorPopup, showWarning, closePopup, handleApiError } = useErrorPopup();

  const loadPaiements = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_PAIEMENT.getAll();
      setPaiements(res.data);
    } catch (error) {
      toast.error("Erreur lors de la recuperation des paiements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaiements();
  }, []);

  const resetForm = () => {
    setNomPaiement("");
    setEditId(0);
    setEditStatus(true);
  };

  const handleAdd = () => {
    resetForm();
    setModalAdd(true);
  };

  const handleEdit = (paiement: PaiementProps) => {
    setNomPaiement(paiement.name);
    setEditId(paiement.id);
    setEditStatus(paiement.status);
    setModalEdit(true);
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomPaiement) {
      showWarning("Veuillez remplir le nom du mode de paiement", "Champ requis");
      return;
    }

    try {
      setSubmitting(true);
      const res = await SERVICE_PAIEMENT.create(nomPaiement);
      if (res.status === 201) {
        toast.success("Mode de paiement ajoute avec succes");
        setModalAdd(false);
        resetForm();
        loadPaiements();
      }
    } catch (error: any) {
      handleApiError(error, "Erreur lors de l'ajout du mode de paiement");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomPaiement) {
      showWarning("Veuillez remplir le nom du mode de paiement", "Champ requis");
      return;
    }

    try {
      setSubmitting(true);
      const res = await SERVICE_PAIEMENT.update(nomPaiement, editId, editStatus);
      if (res.status === 200) {
        toast.success("Mode de paiement modifie avec succes");
        setModalEdit(false);
        resetForm();
        loadPaiements();
      }
    } catch (error: any) {
      handleApiError(error, "Erreur lors de la modification du mode de paiement");
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

  // Stats
  const stats = {
    total: paiements.length,
    active: paiements.filter((p) => p.status).length,
    inactive: paiements.filter((p) => !p.status).length,
  };

  // Payment method icons
  const getPaymentIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("orange")) return "mdi:cellphone-wireless";
    if (lowerName.includes("wave")) return "mdi:wave";
    if (lowerName.includes("cash") || lowerName.includes("espece")) return "mdi:cash";
    if (lowerName.includes("card") || lowerName.includes("carte")) return "mdi:credit-card";
    if (lowerName.includes("free")) return "mdi:phone";
    return "mdi:credit-card-outline";
  };

  const getPaymentColor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("orange")) return { bg: "from-orange-100 to-orange-200", icon: "bg-orange-500", text: "text-orange-600" };
    if (lowerName.includes("wave")) return { bg: "from-blue-100 to-cyan-200", icon: "bg-blue-500", text: "text-blue-600" };
    if (lowerName.includes("cash") || lowerName.includes("espece")) return { bg: "from-green-100 to-emerald-200", icon: "bg-green-500", text: "text-green-600" };
    if (lowerName.includes("free")) return { bg: "from-red-100 to-rose-200", icon: "bg-red-500", text: "text-red-600" };
    return { bg: "from-purple-100 to-indigo-200", icon: "bg-purple-500", text: "text-purple-600" };
  };

  const renderModal = (isEdit: boolean) => {
    const title = isEdit ? "Modifier le mode de paiement" : "Ajouter un nouveau mode de paiement";
    const submitHandler = isEdit ? submitEdit : submitAdd;
    const closeHandler = () => {
      isEdit ? setModalEdit(false) : setModalAdd(false);
      resetForm();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 animate-fadeIn">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 border-b border-yellow-200 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-200 rounded-xl">
                <Icon icon={isEdit ? "mdi:pencil" : "mdi:credit-card-plus"} className="text-2xl text-yellow-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-500">
                  {isEdit ? "Modifiez les informations" : "Ajoutez un nouveau mode de paiement"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={submitHandler} className="p-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Icon icon="mdi:tag" className="inline mr-2 text-yellow-500" />
                  Nom du mode de paiement
                </label>
                <input
                  type="text"
                  value={nomPaiement}
                  onChange={(e) => setNomPaiement(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
                  placeholder="Ex: Orange Money, Wave, etc."
                />
              </div>
              {isEdit && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Icon icon="mdi:toggle-switch" className="inline mr-2 text-yellow-500" />
                    Statut
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setEditStatus(true)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                        editStatus
                          ? "border-green-400 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <Icon icon="mdi:check-circle" className={editStatus ? "text-green-500" : "text-gray-400"} />
                      Actif
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatus(false)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                        !editStatus
                          ? "border-red-400 bg-red-50 text-red-700"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <Icon icon="mdi:close-circle" className={!editStatus ? "text-red-500" : "text-gray-400"} />
                      Inactif
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={closeHandler}
                className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors duration-200"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-yellow-300 to-yellow-400 text-black font-semibold rounded-xl hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                    Chargement...
                  </>
                ) : (
                  <>
                    <Icon icon={isEdit ? "mdi:check" : "mdi:plus"} />
                    {isEdit ? "Modifier" : "Ajouter"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-400 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ToastContainer position="bottom-right" />
      {modalAdd && renderModal(false)}
      {modalEdit && renderModal(true)}

      {/* Popup d'erreur */}
      <ErrorPopup
        isOpen={errorPopup.isOpen}
        onClose={closePopup}
        title={errorPopup.title}
        message={errorPopup.message}
        type={errorPopup.type}
      />

      {/* Header */}
      <PageHeader
        title="Modes de Paiement"
        icon="mdi:credit-card"
        count={paiements.length}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total" value={stats.total} icon="mdi:credit-card-multiple" color="gray" index={0} />
        <StatCard title="Actifs" value={stats.active} icon="mdi:check-circle" color="green" index={1} />
        <StatCard title="Inactifs" value={stats.inactive} icon="mdi:close-circle" color="red" index={2} />
      </div>

      {/* Add Button */}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-3 px-6 py-5 mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-dashed border-yellow-300 rounded-2xl cursor-pointer hover:from-yellow-100 hover:to-amber-100 hover:border-yellow-400 transition-all duration-300 group"
      >
        <div className="p-2 bg-yellow-200 rounded-xl group-hover:scale-110 transition-transform">
          <Icon icon="mdi:plus" className="text-xl text-yellow-700" />
        </div>
        <span className="text-gray-700 font-medium">Ajouter un nouveau mode de paiement</span>
      </button>

      {/* Payment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {paiements.length > 0 ? (
          paiements.map((paiement, index) => {
            const colors = getPaymentColor(paiement.name);
            const isUploading = uploadingImageId === paiement.id;
            return (
              <div
                key={paiement.id}
                className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`}
                style={{
                  animation: `fadeInUp 0.3s ease-out ${index * 0.1}s both`,
                }}
              >
                {/* Background decoration */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full"></div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>

                <div className="relative p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Image ou icone avec upload au survol */}
                      <div className="relative group/img">
                        {paiement.image ? (
                          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                            <img src={paiement.image} alt={paiement.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-14 h-14 ${colors.icon} rounded-2xl flex items-center justify-center shadow-lg`}>
                            <Icon icon={getPaymentIcon(paiement.name)} className="text-2xl text-white" />
                          </div>
                        )}
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
                              if (file) handleImageUpload(paiement.id, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{paiement.name}</h3>
                        {paiement.status ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            Inactif
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(paiement)}
                      className="p-3 bg-white/80 backdrop-blur text-gray-700 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 hover:scale-110"
                    >
                      <Icon icon="mdi:pencil" className="text-lg" />
                    </button>
                  </div>
                </div>

                {/* Bottom accent */}
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

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
