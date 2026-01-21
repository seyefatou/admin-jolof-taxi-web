"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_ADMINISTRATEUR, AdminProps } from "@/services/administrateur-service";
import Pagination from "@/components/Pagination";
import FilterDropdown from "@/components/FilterDropdown";

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
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      setSubmitting(true);
      const phone = telephone.startsWith("+221") ? telephone : `+221${telephone}`;
      const res = await SERVICE_ADMINISTRATEUR.create(nom, email, phone, adresse);
      if (res.status === 200) {
        toast.success("Administrateur cree avec succes");
        setModalAdd(false);
        resetForm();
        loadAdmins();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la creation");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !email || !telephone || !adresse) {
      toast.error("Veuillez remplir tous les champs");
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
      toast.error(error.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const submitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmWord = statusAction === "ACTIVE" ? "ACTIVER" : statusAction === "BANNED" ? "BANNIR" : "DESACTIVER";
    if (confirmText !== confirmWord) {
      toast.error(`Veuillez taper "${confirmWord}" pour confirmer`);
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
      toast.error(error.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "DEACTIVATED":
        return "bg-gray-100 text-gray-700";
      case "BANNED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const renderFormModal = (isEdit: boolean) => {
    const title = isEdit ? `Modifier l'administrateur ${nom}` : "Nouvel Administrateur";
    const submitHandler = isEdit ? submitEdit : submitAdd;
    const closeHandler = () => {
      isEdit ? setModalEdit(false) : setModalAdd(false);
      resetForm();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">{title}</h2>
            <form onSubmit={submitHandler}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom & Prenom</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                    placeholder="Nom complet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telephone</label>
                  <div className="flex">
                    <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
                      +221
                    </span>
                    <input
                      type="text"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-yellow-300"
                      placeholder="77 123 45 67"
                      maxLength={9}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Adresse</label>
                  <input
                    type="text"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                    placeholder="Adresse"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={closeHandler}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
                >
                  {submitting ? "Chargement..." : isEdit ? "Modifier" : "Creer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderStatusModal = () => {
    const confirmWord = statusAction === "ACTIVE" ? "ACTIVER" : statusAction === "BANNED" ? "BANNIR" : "DESACTIVER";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Modifier le statut du compte</h2>
            <p className="text-gray-600 mb-4">
              Tapez le mot <strong>&quot;{confirmWord}&quot;</strong> pour confirmer
            </p>
            <form onSubmit={submitStatus}>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300 mb-4"
                placeholder={confirmWord}
              />
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setModalStatus(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={submitting || confirmText !== confirmWord}
                  className="px-6 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
                >
                  {submitting ? "Chargement..." : "Confirmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ToastContainer position="bottom-right" />
      {modalAdd && renderFormModal(false)}
      {modalEdit && renderFormModal(true)}
      {modalStatus && renderStatusModal()}

      {/* Header */}
      <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl mb-6">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            <Icon icon="mdi:account-tie" className="inline mr-2" />
            Liste des Administrateurs
            <span className="text-yellow-500 ml-2">({admins.length})</span>
          </h1>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
          >
            <Icon icon="mdi:plus" />
            Nouveau Admin
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Icon icon="mdi:account-group" className="text-xl text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icon icon="mdi:check-circle" className="text-xl text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500">Actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Icon icon="mdi:account-off" className="text-xl text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{stats.deactivated}</p>
              <p className="text-xs text-gray-500">Desactives</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Icon icon="mdi:account-cancel" className="text-xl text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.banned}</p>
              <p className="text-xs text-gray-500">Bannis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FilterDropdown
            label="Statut"
            icon="mdi:filter-variant"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              <Icon icon="mdi:magnify" className="inline mr-1" />
              Recherche
            </label>
            <div className="relative">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou telephone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon icon="mdi:close-circle" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Telephone</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAdmins.length > 0 ? (
              paginatedAdmins.map((admin) => (
                <tr key={admin.matricule} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-700 font-semibold">
                        {admin.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{admin.name}</div>
                        <div className="text-xs text-gray-500">{admin.matricule}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{admin.email}</td>
                  <td className="px-4 py-3">{admin.phone}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {admin.role?.nameRole || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(admin.status)}`}>
                      {admin.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(admin)}
                        className="p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200"
                        title="Modifier"
                      >
                        <Icon icon="mdi:pencil" />
                      </button>
                      {admin.status !== "ACTIVE" && (
                        <button
                          onClick={() => handleStatusChange(admin, "ACTIVE")}
                          className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                          title="Activer"
                        >
                          <Icon icon="mdi:check" />
                        </button>
                      )}
                      {admin.status === "ACTIVE" && (
                        <button
                          onClick={() => handleStatusChange(admin, "DEACTIVATED")}
                          className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                          title="Desactiver"
                        >
                          <Icon icon="mdi:lock" />
                        </button>
                      )}
                      {admin.status !== "BANNED" && (
                        <button
                          onClick={() => handleStatusChange(admin, "BANNED")}
                          className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                          title="Bannir"
                        >
                          <Icon icon="mdi:block-helper" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-gray-100">
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <Icon icon="mdi:account-off" className="text-4xl mx-auto mb-2 text-gray-300" />
                  Aucun administrateur disponible
                </td>
              </tr>
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
      </div>
    </div>
  );
}
