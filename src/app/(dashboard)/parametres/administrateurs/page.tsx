"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_ADMINISTRATEUR, AdminProps } from "@/services/administrateur-service";
import Pagination from "@/components/Pagination";
import FilterDropdown from "@/components/FilterDropdown";
import ErrorPopup from "@/components/ErrorPopup";
import { useErrorPopup } from "@/hooks/useErrorPopup";
import {
  AnimatedTableRow,
  StatusBadge,
  StatCard,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableCell,
  EmptyState,
  PageHeader,
  AddButton,
} from "@/components/ui/AnimatedTable";

export default function AdministrateursPage() {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminProps[]>([]);
  const [allAdmins, setAllAdmins] = useState<AdminProps[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [modalStatus, setModalStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Hook pour les popups d'erreur
  const { errorPopup, showWarning, closePopup, handleApiError } = useErrorPopup();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Options de filtre
  const statusOptions = [
    { value: "ALL", label: "Tous les statuts", icon: "mdi:format-list-bulleted" },
    { value: "ACTIVE", label: "Actifs", icon: "mdi:check-circle" },
    { value: "DEACTIVATED", label: "Desactives", icon: "mdi:account-off" },
    { value: "BANNED", label: "Bannis", icon: "mdi:account-cancel" },
  ];

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
    } catch (error) {
      toast.error("Erreur lors de la recuperation des administrateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // Filtrage local
  useEffect(() => {
    let filtered = [...allAdmins];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (admin) =>
          admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.phone.includes(searchTerm)
      );
    }

    // Filtre par statut
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((admin) => admin.status === statusFilter);
    }

    setAdmins(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, allAdmins]);

  // Stats
  const stats = {
    total: allAdmins.length,
    active: allAdmins.filter((a) => a.status === "ACTIVE").length,
    deactivated: allAdmins.filter((a) => a.status === "DEACTIVATED").length,
    banned: allAdmins.filter((a) => a.status === "BANNED").length,
  };

  // Pagination logic
  const totalPages = Math.ceil(admins.length / itemsPerPage);
  const paginatedAdmins = admins.slice(
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

  const resetForm = () => {
    setMatricule("");
    setNom("");
    setEmail("");
    setTelephone("");
    setAdresse("");
    setConfirmText("");
  };

  const handleAdd = () => {
    resetForm();
    setModalAdd(true);
  };

  const handleEdit = async (admin: AdminProps) => {
    setMatricule(admin.matricule);
    setNom(admin.name);
    setEmail(admin.email);
    setTelephone(admin.phone.replace("+221", ""));
    setAdresse(admin.address);
    setModalEdit(true);
  };

  const handleStatusChange = (admin: AdminProps, action: "ACTIVE" | "DEACTIVATED" | "BANNED") => {
    setMatricule(admin.matricule);
    setStatusAction(action);
    setConfirmText("");
    setModalStatus(true);
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !email || !telephone || !adresse) {
      showWarning("Veuillez remplir tous les champs obligatoires", "Champs manquants");
      return;
    }

    try {
      setSubmitting(true);
      const phone = telephone.startsWith("+221") ? telephone : `+221${telephone}`;
      const res = await SERVICE_ADMINISTRATEUR.create(nom, email, phone, adresse);
      if (res.status === 200) {
        toast.success(`Administrateur cree avec succes. Un email a ete envoye a ${email} pour definir son mot de passe.`, {
          autoClose: 8000,
        });
        setModalAdd(false);
        resetForm();
        loadAdmins();
      }
    } catch (error: any) {
      handleApiError(error, "Erreur lors de la creation de l'administrateur");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !email || !telephone || !adresse) {
      showWarning("Veuillez remplir tous les champs obligatoires", "Champs manquants");
      return;
    }

    try {
      setSubmitting(true);
      const phone = telephone.startsWith("+221") ? telephone : `+221${telephone}`;
      const res = await SERVICE_ADMINISTRATEUR.update(matricule, nom, email, phone, adresse);
      if (res.status === 200) {
        toast.success("Administrateur modifie avec succes");
        setModalEdit(false);
        resetForm();
        loadAdmins();
      }
    } catch (error: any) {
      handleApiError(error, "Erreur lors de la modification de l'administrateur");
    } finally {
      setSubmitting(false);
    }
  };

  const submitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmWord = statusAction === "ACTIVE" ? "ACTIVER" : statusAction === "BANNED" ? "BANNIR" : "DESACTIVER";
    if (confirmText !== confirmWord) {
      showWarning(`Veuillez taper "${confirmWord}" pour confirmer`, "Confirmation requise");
      return;
    }

    try {
      setSubmitting(true);
      const res = await SERVICE_ADMINISTRATEUR.updateStatus(matricule, statusAction);
      if (res.status === 200) {
        toast.success("Statut modifie avec succes");
        setModalStatus(false);
        resetForm();
        loadAdmins();
      }
    } catch (error: any) {
      handleApiError(error, "Erreur lors du changement de statut");
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormModal = (isEdit: boolean) => {
    const title = isEdit ? `Modifier l'administrateur` : "Nouvel Administrateur";
    const submitHandler = isEdit ? submitEdit : submitAdd;
    const closeHandler = () => {
      isEdit ? setModalEdit(false) : setModalAdd(false);
      resetForm();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4 animate-fadeIn">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 border-b border-yellow-200 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-200 rounded-xl">
                <Icon icon={isEdit ? "mdi:pencil" : "mdi:account-plus"} className="text-2xl text-yellow-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-500">
                  {isEdit ? "Modifiez les informations" : "Ajoutez un nouvel administrateur"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={submitHandler} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Icon icon="mdi:account" className="inline mr-2 text-yellow-500" />
                  Nom & Prenom
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
                  placeholder="Nom complet"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Icon icon="mdi:email" className="inline mr-2 text-yellow-500" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
                  placeholder="email@exemple.com"
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
                  placeholder="Adresse"
                />
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
                    {isEdit ? "Modifier" : "Creer"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderStatusModal = () => {
    const confirmWord = statusAction === "ACTIVE" ? "ACTIVER" : statusAction === "BANNED" ? "BANNIR" : "DESACTIVER";
    const statusColor = statusAction === "ACTIVE" ? "green" : statusAction === "BANNED" ? "red" : "gray";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 animate-fadeIn">
          {/* Modal Header */}
          <div className={`bg-gradient-to-r ${
            statusAction === "ACTIVE" ? "from-green-50 to-emerald-100" :
            statusAction === "BANNED" ? "from-red-50 to-rose-100" :
            "from-gray-50 to-slate-100"
          } p-6 border-b ${
            statusAction === "ACTIVE" ? "border-green-200" :
            statusAction === "BANNED" ? "border-red-200" :
            "border-gray-200"
          } rounded-t-2xl`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 ${
                statusAction === "ACTIVE" ? "bg-green-200" :
                statusAction === "BANNED" ? "bg-red-200" :
                "bg-gray-200"
              } rounded-xl`}>
                <Icon icon={
                  statusAction === "ACTIVE" ? "mdi:check-circle" :
                  statusAction === "BANNED" ? "mdi:block-helper" :
                  "mdi:lock"
                } className={`text-2xl ${
                  statusAction === "ACTIVE" ? "text-green-700" :
                  statusAction === "BANNED" ? "text-red-700" :
                  "text-gray-700"
                }`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Modifier le statut</h2>
                <p className="text-sm text-gray-500">Cette action necessite une confirmation</p>
              </div>
            </div>
          </div>

          <form onSubmit={submitStatus} className="p-6">
            <div className="mb-6">
              <p className="text-gray-600">
                Tapez le mot <strong className={`${
                  statusAction === "ACTIVE" ? "text-green-600" :
                  statusAction === "BANNED" ? "text-red-600" :
                  "text-gray-600"
                }`}>&quot;{confirmWord}&quot;</strong> pour confirmer
              </p>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 ${
                confirmText === confirmWord
                  ? statusAction === "ACTIVE" ? "border-green-400 focus:ring-green-200" :
                    statusAction === "BANNED" ? "border-red-400 focus:ring-red-200" :
                    "border-gray-400 focus:ring-gray-200"
                  : "border-gray-200 focus:border-gray-400 focus:ring-gray-100"
              }`}
              placeholder={confirmWord}
            />

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setModalStatus(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors duration-200"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={submitting || confirmText !== confirmWord}
                className={`px-6 py-2.5 font-semibold rounded-xl disabled:opacity-50 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg ${
                  statusAction === "ACTIVE" ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white" :
                  statusAction === "BANNED" ? "bg-gradient-to-r from-red-400 to-rose-500 text-white" :
                  "bg-gradient-to-r from-gray-400 to-slate-500 text-white"
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Chargement...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:check" />
                    Confirmer
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
      {modalAdd && renderFormModal(false)}
      {modalEdit && renderFormModal(true)}
      {modalStatus && renderStatusModal()}

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
        title="Liste des Administrateurs"
        icon="mdi:account-tie"
        count={admins.length}
        action={<AddButton onClick={handleAdd} label="Nouveau Admin" />}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total" value={stats.total} icon="mdi:account-group" color="gray" index={0} />
        <StatCard title="Actifs" value={stats.active} icon="mdi:check-circle" color="green" index={1} />
        <StatCard title="Desactives" value={stats.deactivated} icon="mdi:account-off" color="yellow" index={2} />
        <StatCard title="Bannis" value={stats.banned} icon="mdi:account-cancel" color="red" index={3} />
      </div>

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FilterDropdown
            label="Statut"
            icon="mdi:filter-variant"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              <Icon icon="mdi:magnify" className="inline mr-1" />
              Recherche
            </label>
            <div className="relative group">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou telephone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icon icon="mdi:close-circle" />
                </button>
              )}
            </div>
          </div>
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
            {paginatedAdmins.length > 0 ? (
              paginatedAdmins.map((admin, index) => (
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
                      <button
                        onClick={() => handleEdit(admin)}
                        className="p-2.5 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 rounded-xl hover:from-yellow-200 hover:to-yellow-300 transition-all duration-200 hover:scale-110 shadow-sm"
                        title="Modifier"
                      >
                        <Icon icon="mdi:pencil" />
                      </button>
                      {admin.status !== "ACTIVE" && (
                        <button
                          onClick={() => handleStatusChange(admin, "ACTIVE")}
                          className="p-2.5 bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 rounded-xl hover:from-green-200 hover:to-emerald-300 transition-all duration-200 hover:scale-110 shadow-sm"
                          title="Activer"
                        >
                          <Icon icon="mdi:check" />
                        </button>
                      )}
                      {admin.status === "ACTIVE" && (
                        <button
                          onClick={() => handleStatusChange(admin, "DEACTIVATED")}
                          className="p-2.5 bg-gradient-to-r from-gray-100 to-slate-200 text-gray-600 rounded-xl hover:from-gray-200 hover:to-slate-300 transition-all duration-200 hover:scale-110 shadow-sm"
                          title="Desactiver"
                        >
                          <Icon icon="mdi:lock" />
                        </button>
                      )}
                      {admin.status !== "BANNED" && (
                        <button
                          onClick={() => handleStatusChange(admin, "BANNED")}
                          className="p-2.5 bg-gradient-to-r from-red-100 to-rose-200 text-red-600 rounded-xl hover:from-red-200 hover:to-rose-300 transition-all duration-200 hover:scale-110 shadow-sm"
                          title="Bannir"
                        >
                          <Icon icon="mdi:block-helper" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </AnimatedTableRow>
              ))
            ) : (
              <EmptyState
                icon="mdi:account-off"
                title="Aucun administrateur disponible"
                description="Les administrateurs apparaitront ici une fois ajoutes"
              />
            )}
          </tbody>
        </table>

        {admins.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={admins.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </TableContainer>
    </div>
  );
}
