"use client";

import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import FilterDropdown from "@/components/FilterDropdown";
import Pagination from "@/components/Pagination";
import ClientFormModal from "@/components/clients/ClientFormModal";
import ConfirmModal from "@/components/ConfirmModal";
import { SERVICE_CLIENT, ClientProps, CreateClientData, UpdateClientData } from "@/services/client-service";

export default function ClientsList() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientProps[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [onlineFilter, setOnlineFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientProps | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "activate" | "deactivate" | "ban" | "delete" | "pending";
    client: ClientProps;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Action menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { value: "ALL", label: "Tous les statuts", icon: "mdi:format-list-bulleted" },
    { value: "ACTIVE", label: "Actifs", icon: "mdi:check-circle" },
    { value: "PENDING", label: "En attente", icon: "mdi:clock-outline" },
    { value: "DEACTIVATED", label: "Desactives", icon: "mdi:account-off" },
    { value: "BANNED", label: "Bannis", icon: "mdi:account-cancel" },
  ];

  const onlineOptions = [
    { value: "ALL", label: "Tous", icon: "mdi:account-group" },
    { value: "ONLINE", label: "En ligne", icon: "mdi:circle" },
    { value: "OFFLINE", label: "Hors ligne", icon: "mdi:circle-outline" },
  ];

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      let response;
      if (searchTerm) {
        response = await SERVICE_CLIENT.search(searchTerm);
      } else {
        response = await SERVICE_CLIENT.getAll();
      }
      setClients(response.data || []);
    } catch (error) {
      toast.error("Erreur lors de la recuperation des clients");
      console.error("Erreur clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, onlineFilter]);

  // Filtrage
  const filteredClients = clients.filter((client) => {
    const matchStatus = statusFilter === "ALL" || client.status === statusFilter;
    const matchOnline =
      onlineFilter === "ALL" ||
      (onlineFilter === "ONLINE" && client.isOnline) ||
      (onlineFilter === "OFFLINE" && !client.isOnline);
    return matchStatus && matchOnline;
  });

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  // CRUD Actions
  const handleAddClient = () => {
    setSelectedClient(null);
    setShowFormModal(true);
  };

  const handleEditClient = (client: ClientProps) => {
    setSelectedClient(client);
    setShowFormModal(true);
    setOpenMenuId(null);
  };

  const handleViewDetails = (client: ClientProps) => {
    router.push(`/parametres/clients/${client.matricule}`);
    setOpenMenuId(null);
  };

  const handleFormSubmit = async (data: CreateClientData | UpdateClientData) => {
    try {
      let res;
      if ("matricule" in data) {
        res = await SERVICE_CLIENT.update(data as UpdateClientData);
      } else {
        res = await SERVICE_CLIENT.create(data as CreateClientData);
      }

      if (res.status === 200 || res.status === 201) {
        toast.success("matricule" in data ? "Client modifie avec succes" : "Client ajoute avec succes");
        setShowFormModal(false);
        loadClients();
      } else if (res.status === 409) {
        toast.error(res.message || "Ce client existe deja");
      } else {
        toast.error(res.message || "Erreur lors de l'operation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'operation");
      console.error(error);
    }
  };

  const handleStatusAction = (type: "activate" | "deactivate" | "ban" | "pending", client: ClientProps) => {
    setConfirmAction({ type, client });
    setShowConfirmModal(true);
    setOpenMenuId(null);
  };

  const handleDeleteAction = (client: ClientProps) => {
    setConfirmAction({ type: "delete", client });
    setShowConfirmModal(true);
    setOpenMenuId(null);
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    setActionLoading(true);
    try {
      let res;
      const { type, client } = confirmAction;

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
        case "delete":
          res = await SERVICE_CLIENT.remove(client.matricule);
          break;
      }

      if (res.status === 200 || res.status === 201) {
        const messages = {
          activate: "Client active avec succes",
          deactivate: "Client desactive avec succes",
          ban: "Client banni avec succes",
          pending: "Client mis en attente",
          delete: "Client supprime avec succes",
        };
        toast.success(messages[type]);
        setShowConfirmModal(false);
        setConfirmAction(null);
        loadClients();
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
    if (!confirmAction) return { title: "", message: "", type: "warning" as const };

    const configs = {
      activate: {
        title: "Activer le client",
        message: `Voulez-vous activer le client ${confirmAction.client.name} ?`,
        type: "success" as const,
        confirmText: "Activer",
      },
      deactivate: {
        title: "Desactiver le client",
        message: `Voulez-vous desactiver le client ${confirmAction.client.name} ?`,
        type: "warning" as const,
        confirmText: "Desactiver",
      },
      ban: {
        title: "Bannir le client",
        message: `Voulez-vous bannir le client ${confirmAction.client.name} ? Cette action est serieuse.`,
        type: "danger" as const,
        confirmText: "Bannir",
      },
      pending: {
        title: "Mettre en attente",
        message: `Voulez-vous mettre le client ${confirmAction.client.name} en attente ?`,
        type: "info" as const,
        confirmText: "Confirmer",
      },
      delete: {
        title: "Supprimer le client",
        message: `Voulez-vous vraiment supprimer le client ${confirmAction.client.name} ? Cette action est irreversible.`,
        type: "danger" as const,
        confirmText: "Supprimer",
      },
    };

    return configs[confirmAction.type];
  };

  // Stats
  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "ACTIVE").length,
    online: clients.filter((c) => c.isOnline).length,
    pending: clients.filter((c) => c.status === "PENDING").length,
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

      {/* Header */}
      <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl mb-6">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            <Icon icon="mdi:account-group" className="inline mr-2" />
            Gestion des Clients
            <span className="text-yellow-500 ml-2">({filteredClients.length})</span>
          </h1>
          <button
            onClick={handleAddClient}
            className="px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
          >
            <Icon icon="mdi:plus" />
            Ajouter
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon icon="mdi:circle" className="text-xl text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.online}</p>
              <p className="text-xs text-gray-500">En ligne</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icon icon="mdi:clock-outline" className="text-xl text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FilterDropdown
            label="Statut"
            icon="mdi:filter-variant"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          <FilterDropdown
            label="Disponibilite"
            icon="mdi:wifi"
            options={onlineOptions}
            value={onlineFilter}
            onChange={setOnlineFilter}
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

      {/* Tableau */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Telephone</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">En ligne</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClients.length > 0 ? (
              paginatedClients.map((client, index) => (
                <tr key={client.matricule} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-xs">{client.matricule}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        {client.avatar ? (
                          <img
                            src={client.avatar}
                            alt={client.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(client.name || "U")}&background=random`}
                            alt={client.name || "User"}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        {client.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">
                          {client.name ? client.name : <span className="text-gray-400 italic">Indisponible</span>}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{client.email || "-"}</td>
                  <td className="px-4 py-3">{client.phone}</td>
                  <td className="px-4 py-3">{getStatusBadge(client.status)}</td>
                  <td className="px-4 py-3">
                    {client.isOnline ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm">
                        <Icon icon="mdi:wifi" className="text-sm" />
                        En ligne
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 shadow-sm">
                        <Icon icon="mdi:wifi-off" className="text-sm" />
                        Hors ligne
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative" ref={openMenuId === client.matricule ? menuRef : null}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === client.matricule ? null : client.matricule)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Icon icon="mdi:dots-vertical" className="text-gray-600" />
                      </button>

                      {openMenuId === client.matricule && (
                        <div className={`absolute right-0 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 max-h-80 overflow-y-auto ${
                          index >= paginatedClients.length - 3 ? "bottom-full mb-1" : "top-full mt-1"
                        }`}>
                          <button
                            onClick={() => handleViewDetails(client)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Icon icon="mdi:eye" className="text-yellow-600" />
                            Voir details
                          </button>
                          <button
                            onClick={() => handleEditClient(client)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Icon icon="mdi:pencil" className="text-blue-600" />
                            Modifier
                          </button>

                          <div className="border-t border-gray-100 my-1"></div>

                          {client.status !== "ACTIVE" && (
                            <button
                              onClick={() => handleStatusAction("activate", client)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Icon icon="mdi:check-circle" className="text-green-600" />
                              Activer
                            </button>
                          )}
                          {client.status !== "PENDING" && (
                            <button
                              onClick={() => handleStatusAction("pending", client)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Icon icon="mdi:clock-outline" className="text-yellow-600" />
                              Mettre en attente
                            </button>
                          )}
                          {client.status !== "DEACTIVATED" && (
                            <button
                              onClick={() => handleStatusAction("deactivate", client)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Icon icon="mdi:account-off" className="text-gray-600" />
                              Desactiver
                            </button>
                          )}
                          {client.status !== "BANNED" && (
                            <button
                              onClick={() => handleStatusAction("ban", client)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Icon icon="mdi:account-cancel" className="text-orange-600" />
                              Bannir
                            </button>
                          )}

                          <div className="border-t border-gray-100 my-1"></div>

                          <button
                            onClick={() => handleDeleteAction(client)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <Icon icon="mdi:delete" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-gray-100">
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <Icon icon="mdi:account-off" className="text-6xl mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Aucun client trouve</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Les clients apparaitront ici une fois ajoutes
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredClients.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredClients.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {/* Form Modal */}
      <ClientFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        client={selectedClient}
      />

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
