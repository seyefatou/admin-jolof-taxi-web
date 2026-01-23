"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import FilterDropdown from "@/components/FilterDropdown";
import Pagination from "@/components/Pagination";
import ClientFormModal from "@/components/clients/ClientFormModal";
import ConfirmModal from "@/components/ConfirmModal";
import { SERVICE_CLIENT, ClientProps, CreateClientData, UpdateClientData } from "@/services/client-service";
import {
  AnimatedTableRow,
  StatusBadge,
  OnlineBadge,
  AvatarWithStatus,
  StatCard,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableCell,
  EmptyState,
  PageHeader,
  AddButton,
} from "@/components/ui/AnimatedTable";

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

  // Action menu with portal
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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
        const clickedButton = Array.from(buttonRefs.current.values()).some(
          (btn) => btn && btn.contains(event.target as Node)
        );
        if (!clickedButton) {
          setOpenMenuId(null);
          setMenuPosition(null);
        }
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

  // Toggle menu with position calculation
  const toggleMenu = (clientId: string) => {
    if (openMenuId === clientId) {
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      const button = buttonRefs.current.get(clientId);
      if (button) {
        const rect = button.getBoundingClientRect();
        const menuHeight = 320;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        let top: number;
        if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
          top = rect.bottom + window.scrollY + 4;
        } else {
          top = rect.top + window.scrollY - menuHeight - 4;
        }

        setMenuPosition({
          top,
          left: rect.right + window.scrollX - 192,
        });
        setOpenMenuId(clientId);
      }
    }
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
    setMenuPosition(null);
  };

  const handleViewDetails = (client: ClientProps) => {
    router.push(`/parametres/clients/${client.matricule}`);
    setOpenMenuId(null);
    setMenuPosition(null);
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
    setMenuPosition(null);
  };

  const handleDeleteAction = (client: ClientProps) => {
    setConfirmAction({ type: "delete", client });
    setShowConfirmModal(true);
    setOpenMenuId(null);
    setMenuPosition(null);
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

      {/* Header */}
      <PageHeader
        title="Gestion des Clients"
        icon="mdi:account-group"
        count={filteredClients.length}
        action={<AddButton onClick={handleAddClient} label="Ajouter" />}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total" value={stats.total} icon="mdi:account-group" color="gray" index={0} />
        <StatCard title="Actifs" value={stats.active} icon="mdi:check-circle" color="green" index={1} />
        <StatCard title="En ligne" value={stats.online} icon="mdi:wifi" color="blue" index={2} />
        <StatCard title="En attente" value={stats.pending} icon="mdi:clock-outline" color="yellow" index={3} />
      </div>

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-5 mb-6">
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
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Client</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Telephone</TableHeaderCell>
            <TableHeaderCell>Statut</TableHeaderCell>
            <TableHeaderCell>Disponibilite</TableHeaderCell>
            <TableHeaderCell className="text-center">Actions</TableHeaderCell>
          </TableHeader>
          <tbody>
            {paginatedClients.length > 0 ? (
              paginatedClients.map((client, index) => (
                <AnimatedTableRow key={client.matricule} index={index}>
                  <TableCell>
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {client.matricule}
                    </span>
                  </TableCell>
                  <TableCell>
                    <AvatarWithStatus
                      name={client.name}
                      avatar={client.avatar}
                      isOnline={client.isOnline}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{client.email || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:phone" className="text-gray-400" />
                      <span className="font-medium">{client.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={client.status} />
                  </TableCell>
                  <TableCell>
                    <OnlineBadge isOnline={client.isOnline} />
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      ref={(el) => {
                        if (el) buttonRefs.current.set(client.matricule, el);
                      }}
                      onClick={() => toggleMenu(client.matricule)}
                      className="p-2 hover:bg-yellow-100 rounded-full transition-all duration-200 hover:scale-110"
                    >
                      <Icon icon="mdi:dots-vertical" className="text-gray-600" />
                    </button>
                  </TableCell>
                </AnimatedTableRow>
              ))
            ) : (
              <EmptyState
                icon="mdi:account-group-outline"
                title="Aucun client trouve"
                description="Les clients apparaitront ici une fois ajoutes"
              />
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
      </TableContainer>

      {/* Action Menu Portal */}
      {openMenuId && menuPosition && typeof window !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] w-48 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 animate-fadeIn"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            {(() => {
              const client = clients.find((c) => c.matricule === openMenuId);
              if (!client) return null;

              return (
                <>
                  <button
                    onClick={() => handleViewDetails(client)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-yellow-50 flex items-center gap-3 transition-colors"
                  >
                    <Icon icon="mdi:eye" className="text-yellow-600 text-lg" />
                    <span>Voir details</span>
                  </button>
                  <button
                    onClick={() => handleEditClient(client)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors"
                  >
                    <Icon icon="mdi:pencil" className="text-blue-600 text-lg" />
                    <span>Modifier</span>
                  </button>

                  <div className="border-t border-gray-100 my-2"></div>

                  {client.status !== "ACTIVE" && (
                    <button
                      onClick={() => handleStatusAction("activate", client)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-green-50 flex items-center gap-3 transition-colors"
                    >
                      <Icon icon="mdi:check-circle" className="text-green-600 text-lg" />
                      <span>Activer</span>
                    </button>
                  )}
                  {client.status !== "PENDING" && (
                    <button
                      onClick={() => handleStatusAction("pending", client)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-yellow-50 flex items-center gap-3 transition-colors"
                    >
                      <Icon icon="mdi:clock-outline" className="text-yellow-600 text-lg" />
                      <span>Mettre en attente</span>
                    </button>
                  )}
                  {client.status !== "DEACTIVATED" && (
                    <button
                      onClick={() => handleStatusAction("deactivate", client)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Icon icon="mdi:account-off" className="text-gray-600 text-lg" />
                      <span>Desactiver</span>
                    </button>
                  )}
                  {client.status !== "BANNED" && (
                    <button
                      onClick={() => handleStatusAction("ban", client)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50 flex items-center gap-3 transition-colors"
                    >
                      <Icon icon="mdi:account-cancel" className="text-orange-600 text-lg" />
                      <span>Bannir</span>
                    </button>
                  )}

                  <div className="border-t border-gray-100 my-2"></div>

                  <button
                    onClick={() => handleDeleteAction(client)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 transition-colors"
                  >
                    <Icon icon="mdi:delete" className="text-lg" />
                    <span>Supprimer</span>
                  </button>
                </>
              );
            })()}
          </div>,
          document.body
        )}

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
