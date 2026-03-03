"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_GARAGES, GaragesProps } from "@/services/garage-service";
import Pagination from "@/components/Pagination";
import ErrorPopup from "@/components/ErrorPopup";
import dynamic from "next/dynamic";
import {
  AnimatedTableRow,
  StatCard,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableCell,
  EmptyState,
  PageHeader,
  AddButton,
} from "@/components/ui/AnimatedTable";

// Import dynamique pour eviter les erreurs SSR avec Google Maps
const GarageMap = dynamic(() => import("@/components/GarageMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200"></div>
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-400 absolute top-0 left-0"></div>
      </div>
    </div>
  ),
});

export default function GaragesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [listGarages, setListGarages] = useState<GaragesProps[]>([]);
  const [modalCreate, setModalCreate] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [modalActivate, setModalActivate] = useState(false);
  const [modalSuccessCreate, setModalSuccessCreate] = useState(false);
  const [createdGarageCode, setCreatedGarageCode] = useState("");
  const [createdGarageName, setCreatedGarageName] = useState("");
  const [activateCode, setActivateCode] = useState("");
  const [activateSender, setActivateSender] = useState<"SMS" | "WHATSAPP">("SMS");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "map">("table");

  // Popup d'erreur
  const [errorPopup, setErrorPopup] = useState({
    isOpen: false,
    message: "",
    title: "",
    type: "error" as "error" | "warning" | "info" | "success",
  });

  const showError = (message: string, title?: string) => {
    setErrorPopup({ isOpen: true, message, title: title || "Erreur", type: "error" });
  };

  const showWarning = (message: string, title?: string) => {
    setErrorPopup({ isOpen: true, message, title: title || "Attention", type: "warning" });
  };

  const closeErrorPopup = () => {
    setErrorPopup({ ...errorPopup, isOpen: false });
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [matricule, setMatricule] = useState("");
  const [nomGarage, setNomGarage] = useState("");
  const [nomResponsable, setNomResponsable] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [city, setCity] = useState("Dakar");
  const [latitude, setLatitude] = useState(14.7494);
  const [longitude, setLongitude] = useState(-17.4599);

  const loadGarages = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_GARAGES.getAll();
      setListGarages(res.data);
    } catch (error) {
      toast.error("Erreur lors de la recuperation des garages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGarages();
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const resetForm = () => {
    setMatricule("");
    setNomGarage("");
    setNomResponsable("");
    setTelephone("");
    setAdresse("");
    setCity("Dakar");
    setLatitude(14.7494);
    setLongitude(-17.4599);
  };

  const handleCreate = () => {
    resetForm();
    setModalCreate(true);
  };

  const handleEdit = async (code: string) => {
    try {
      const res = await SERVICE_GARAGES.getOne(code);
      setMatricule(res.data.code);
      setNomGarage(res.data.name);
      setNomResponsable(res.data.responsiblePerson);
      setTelephone(res.data.phoneNumber.replace("+221", ""));
      setAdresse(res.data.address);
      setCity(res.data.city);
      setLatitude(res.data.latitude);
      setLongitude(res.data.longitude);
      setModalEdit(true);
    } catch (error) {
      toast.error("Erreur lors de la recuperation du garage");
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomGarage || !nomResponsable || !telephone || !adresse) {
      showWarning("Veuillez remplir tous les champs obligatoires", "Champs manquants");
      return;
    }

    try {
      setSubmitting(true);
      const phone = telephone.startsWith("+221") ? telephone : `+221${telephone}`;
      const res = await SERVICE_GARAGES.create(
        nomGarage,
        adresse,
        latitude,
        longitude,
        city,
        nomResponsable,
        true,
        phone
      );

      if (res.status === 201 || res.status === 200) {
        setModalCreate(false);
        resetForm();
        loadGarages();
        setCreatedGarageCode(res.data.code);
        setCreatedGarageName(res.data.name);
        setModalSuccessCreate(true);
      } else if (res.status === 409) {
        showError(res.message, "Garage deja existant");
      } else if (res.status === 400) {
        showWarning(res.message, "Donnees invalides");
      } else if (res.status === 401 || res.status === 403) {
        showError("Vous n'avez pas les permissions necessaires", "Acces refuse");
      } else {
        showError(res.message || "Une erreur est survenue", "Erreur");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors de l'ajout du garage";
      showError(errorMessage, "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomGarage || !nomResponsable || !telephone || !adresse) {
      showWarning("Veuillez remplir tous les champs obligatoires", "Champs manquants");
      return;
    }

    try {
      setSubmitting(true);
      const phone = telephone.startsWith("+221") ? telephone : `+221${telephone}`;
      const res = await SERVICE_GARAGES.update(
        matricule,
        nomGarage,
        adresse,
        latitude,
        longitude,
        city,
        nomResponsable,
        true,
        phone
      );

      if (res.status === 200 || res.status === 201) {
        toast.success("Garage modifie avec succes");
        setModalEdit(false);
        resetForm();
        loadGarages();
      } else if (res.status === 409) {
        showError(res.message, "Conflit de donnees");
      } else if (res.status === 400) {
        showWarning(res.message, "Donnees invalides");
      } else if (res.status === 401 || res.status === 403) {
        showError("Vous n'avez pas les permissions necessaires", "Acces refuse");
      } else if (res.status === 404) {
        showError("Ce garage n'existe plus", "Garage introuvable");
      } else {
        showError(res.message || "Une erreur est survenue", "Erreur");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors de la modification";
      showError(errorMessage, "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = (code: string) => {
    setActivateCode(code);
    setActivateSender("SMS");
    setModalActivate(true);
  };

  const executeActivate = async () => {
    try {
      setSubmitting(true);
      const res = await SERVICE_GARAGES.activate(activateCode, activateSender);
      if (res.status === 200 || res.status === 201) {
        toast.success("Garage active avec succes. Les identifiants ont ete envoyes.");
        setModalActivate(false);
        loadGarages();
      } else if (res.status === 409) {
        setModalActivate(false);
        setErrorPopup({
          isOpen: true,
          message: "Le compte partenaire de ce garage est deja active. Le responsable peut se connecter avec son numero de telephone et le mot de passe recu lors de la premiere activation.",
          title: "Compte deja active",
          type: "info",
        });
        loadGarages();
      } else {
        showError(res.message || "Erreur lors de l'activation", "Erreur");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors de l'activation";
      showError(errorMessage, "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter garages
  const filteredGarages = listGarages.filter(
    (garage) =>
      garage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      garage.responsiblePerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    total: listGarages.length,
    active: listGarages.filter((g) => g.status).length,
    inactive: listGarages.filter((g) => !g.status).length,
    regions: [...new Set(listGarages.map((g) => g.city))].length,
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredGarages.length / itemsPerPage);
  const paginatedGarages = filteredGarages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const renderModal = (isEdit: boolean) => {
    const title = isEdit ? "Modifier le Garage" : "Nouveau Garage";
    const submitHandler = isEdit ? submitEdit : submitCreate;
    const closeHandler = () => {
      isEdit ? setModalEdit(false) : setModalCreate(false);
      resetForm();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 animate-fadeIn">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 border-b border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-200 rounded-xl">
                <Icon icon={isEdit ? "mdi:pencil" : "mdi:garage-variant"} className="text-2xl text-yellow-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-500">
                  {isEdit ? "Modifiez les informations du garage" : "Ajoutez un nouveau garage"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={submitHandler} className="p-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Icon icon="mdi:garage" className="inline mr-2 text-yellow-500" />
                  Nom du garage
                </label>
                <input
                  type="text"
                  value={nomGarage}
                  onChange={(e) => setNomGarage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
                  placeholder="Nom du garage"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Icon icon="mdi:account" className="inline mr-2 text-yellow-500" />
                    Nom du responsable
                  </label>
                  <input
                    type="text"
                    value={nomResponsable}
                    onChange={(e) => setNomResponsable(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
                    placeholder="Nom du responsable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Icon icon="mdi:phone" className="inline mr-2 text-yellow-500" />
                    Telephone
                  </label>
                  <div className="flex">
                    <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl font-medium text-gray-600">
                      +221
                    </span>
                    <input
                      type="text"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
                      placeholder="77 123 45 67"
                      maxLength={9}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Icon icon="mdi:map-marker" className="inline mr-2 text-yellow-500" />
                  Adresse
                </label>
                <input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
                  placeholder="Adresse du garage"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Icon icon="mdi:city" className="inline mr-2 text-yellow-500" />
                    Region
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
                    placeholder="Region"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Icon icon="mdi:latitude" className="inline mr-2 text-yellow-500" />
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Icon icon="mdi:longitude" className="inline mr-2 text-yellow-500" />
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
                  />
                </div>
              </div>
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
      {modalCreate && renderModal(false)}
      {modalEdit && renderModal(true)}

      {/* Modal succes creation */}
      {modalSuccessCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 animate-fadeIn">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Icon icon="mdi:check-circle" className="text-5xl text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Garage cree avec succes !</h2>
              <p className="text-gray-500 mb-2">
                Le garage <span className="font-semibold text-gray-700">{createdGarageName}</span> a ete cree.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <Icon icon="mdi:information" className="text-yellow-600 text-xl mt-0.5 shrink-0" />
                  <p className="text-sm text-yellow-800">
                    Pour que le responsable puisse se connecter sur l&apos;interface partenaire,
                    vous devez <strong>activer le garage</strong>. Il recevra ses identifiants
                    de connexion (telephone + mot de passe) par SMS ou WhatsApp.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalSuccessCreate(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors duration-200"
                >
                  Plus tard
                </button>
                <button
                  onClick={() => {
                    setModalSuccessCreate(false);
                    setActivateCode(createdGarageCode);
                    setActivateSender("SMS");
                    setModalActivate(true);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold rounded-xl hover:from-green-500 hover:to-green-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  <Icon icon="mdi:send" />
                  Activer maintenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'activation */}
      {modalActivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 animate-fadeIn">
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-200 rounded-xl">
                  <Icon icon="mdi:account-check" className="text-2xl text-green-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Activer le garage</h2>
                  <p className="text-sm text-gray-500">Creer le compte partenaire</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-3">
                  <Icon icon="mdi:account-key" className="text-blue-600 text-xl mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800">
                    L&apos;activation va <strong>creer un compte partenaire</strong> pour ce garage.
                    Le responsable recevra son <strong>identifiant (numero de telephone)</strong> et
                    son <strong>mot de passe</strong> par le canal choisi ci-dessous.
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-3">Canal d&apos;envoi des identifiants :</p>
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setActivateSender("SMS")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 ${
                    activateSender === "SMS"
                      ? "border-green-400 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Icon icon="mdi:message-text" className="text-xl" />
                  SMS
                </button>
                <button
                  onClick={() => setActivateSender("WHATSAPP")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 ${
                    activateSender === "WHATSAPP"
                      ? "border-green-400 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Icon icon="mdi:whatsapp" className="text-xl" />
                  WhatsApp
                </button>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModalActivate(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={executeActivate}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold rounded-xl hover:from-green-500 hover:to-green-600 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 shadow-md"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Activation...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:send" />
                      Activer et envoyer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup d'erreur */}
      <ErrorPopup
        isOpen={errorPopup.isOpen}
        onClose={closeErrorPopup}
        title={errorPopup.title}
        message={errorPopup.message}
        type={errorPopup.type}
      />

      {/* Header */}
      <PageHeader
        title="Liste des Garages"
        icon="mdi:garage"
        count={filteredGarages.length}
        action={
          <div className="flex items-center gap-3">
            {/* Toggle Carte/Tableau */}
            <div className="flex bg-gray-100 border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === "map"
                    ? "bg-gradient-to-r from-yellow-300 to-yellow-400 text-black shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Icon icon="mdi:map-marker-multiple" className="text-lg" />
                Carte
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === "table"
                    ? "bg-gradient-to-r from-yellow-300 to-yellow-400 text-black shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Icon icon="mdi:format-list-bulleted" className="text-lg" />
                Tableau
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
              />
            </div>

            <AddButton onClick={handleCreate} label="Ajouter un garage" />
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total" value={stats.total} icon="mdi:garage" color="gray" index={0} />
        <StatCard title="Actifs" value={stats.active} icon="mdi:check-circle" color="green" index={1} />
        <StatCard title="Inactifs" value={stats.inactive} icon="mdi:close-circle" color="red" index={2} />
        <StatCard title="Regions" value={stats.regions} icon="mdi:map-marker-radius" color="purple" index={3} />
      </div>

      {/* Vue Carte */}
      {viewMode === "map" && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4">
          <GarageMap garages={filteredGarages} onEdit={handleEdit} />
        </div>
      )}

      {/* Vue Tableau */}
      {viewMode === "table" && (
        <TableContainer>
          <table className="w-full">
            <TableHeader>
              <TableHeaderCell>Garage</TableHeaderCell>
              <TableHeaderCell>Responsable</TableHeaderCell>
              <TableHeaderCell>Telephone</TableHeaderCell>
              <TableHeaderCell>Adresse</TableHeaderCell>
              <TableHeaderCell>Region</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell className="text-center">Actions</TableHeaderCell>
            </TableHeader>
            <tbody>
              {paginatedGarages.length > 0 ? (
                paginatedGarages.map((garage, index) => (
                  <AnimatedTableRow key={garage.id} index={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Icon icon="mdi:garage" className="text-xl text-yellow-600" />
                        </div>
                        <span className="font-semibold text-gray-800">{garage.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(garage.responsiblePerson)}&background=FEF08A&color=713F12&bold=true`}
                          alt={garage.responsiblePerson}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="font-medium">{garage.responsiblePerson}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:phone" className="text-gray-400" />
                        <span>{garage.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:map-marker" className="text-gray-400" />
                        <span className="text-gray-600 truncate max-w-[200px]">{garage.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                        <Icon icon="mdi:city" className="text-sm" />
                        {garage.city}
                      </span>
                    </TableCell>
                    <TableCell>
                      {garage.status ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm">
                          <Icon icon="mdi:check-circle" className="text-sm" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200 shadow-sm">
                          <Icon icon="mdi:close-circle" className="text-sm" />
                          Inactif
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => router.push(`/parametres/garages/${garage.code}`)}
                          className="p-2.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-xl hover:from-blue-200 hover:to-blue-300 transition-all duration-200 hover:scale-110 shadow-sm"
                          title="Voir details"
                        >
                          <Icon icon="mdi:eye" className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleEdit(garage.code)}
                          className="p-2.5 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 rounded-xl hover:from-yellow-200 hover:to-yellow-300 transition-all duration-200 hover:scale-110 shadow-sm"
                          title="Modifier"
                        >
                          <Icon icon="mdi:pencil" className="text-lg" />
                        </button>
                        {!garage.status && (
                          <button
                            onClick={() => handleActivate(garage.code)}
                            className="p-2.5 bg-gradient-to-r from-green-100 to-green-200 text-green-700 rounded-xl hover:from-green-200 hover:to-green-300 transition-all duration-200 hover:scale-110 shadow-sm"
                            title="Activer"
                          >
                            <Icon icon="mdi:check-circle" className="text-lg" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </AnimatedTableRow>
                ))
              ) : (
                <EmptyState
                  icon="mdi:garage-open"
                  title="Aucun garage disponible"
                  description="Les garages apparaitront ici une fois ajoutes"
                />
              )}
            </tbody>
          </table>

          {filteredGarages.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredGarages.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </TableContainer>
      )}
    </div>
  );
}
