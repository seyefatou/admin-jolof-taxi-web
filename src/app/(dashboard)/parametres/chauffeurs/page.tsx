"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import FilterDropdown from "@/components/FilterDropdown";
import Pagination from "@/components/Pagination";
import ChauffeurFormModal from "@/components/chauffeurs/ChauffeurFormModal";
import ConfirmModal from "@/components/ConfirmModal";
import { SERVICE_CHAUFFEUR, ChauffeurProps, UpdateChauffeurData } from "@/services/chauffeur-service";
import { SERVICE_GARAGES, GaragesProps } from "@/services/garage-service";
import { SERVICE_VEHICULES, VehiculeTypeResp } from "@/services/vehicule-service";
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

export default function ChauffeursList() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chauffeurs, setChauffeurs] = useState<ChauffeurProps[]>([]);
  const [garages, setGarages] = useState<GaragesProps[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehiculeTypeResp[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [onlineFilter, setOnlineFilter] = useState("ALL");
  const [garageFilter, setGarageFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedChauffeur, setSelectedChauffeur] = useState<ChauffeurProps | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "activate" | "deactivate" | "ban" | "delete" | "pending";
    chauffeur: ChauffeurProps;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Action menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
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
        setMenuPosition(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle menu toggle with position calculation
  const handleMenuToggle = (matricule: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (openMenuId === matricule) {
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const menuHeight = 320;

      const spaceBelow = windowHeight - rect.bottom;
      const top = spaceBelow < menuHeight
        ? rect.top - menuHeight + window.scrollY
        : rect.bottom + window.scrollY;

      setMenuPosition({
        top,
        left: rect.right - 192 + window.scrollX,
      });
      setOpenMenuId(matricule);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [chauffeursRes, garagesRes, vehicleTypesRes] = await Promise.all([
        searchTerm ? SERVICE_CHAUFFEUR.search(searchTerm) : SERVICE_CHAUFFEUR.getAll(),
        SERVICE_GARAGES.getAll(),
        SERVICE_VEHICULES.getTypeList(),
      ]);
      setChauffeurs(chauffeursRes.data || []);
      setGarages(garagesRes.data || []);
      setVehicleTypes(vehicleTypesRes.data || []);
    } catch (error) {
      toast.error("Erreur lors de la recuperation des donnees");
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, onlineFilter, garageFilter]);

  // Filtrage
  const filteredChauffeurs = chauffeurs.filter((chauffeur) => {
    const matchStatus = statusFilter === "ALL" || chauffeur.status === statusFilter;
    const matchOnline =
      onlineFilter === "ALL" ||
      (onlineFilter === "ONLINE" && chauffeur.isOnline) ||
      (onlineFilter === "OFFLINE" && !chauffeur.isOnline);
    const matchGarage =
      garageFilter === "ALL" ||
      chauffeur.garageAffiliation?.id?.toString() === garageFilter;
    return matchStatus && matchOnline && matchGarage;
  });

  // Pagination
  const totalPages = Math.ceil(filteredChauffeurs.length / itemsPerPage);
  const paginatedChauffeurs = filteredChauffeurs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // CRUD Actions
  const handleAddChauffeur = () => {
    setSelectedChauffeur(null);
    setShowFormModal(true);
  };

  const handleEditChauffeur = (chauffeur: ChauffeurProps) => {
    setSelectedChauffeur(chauffeur);
    setShowFormModal(true);
    setOpenMenuId(null);
  };

  const handleViewDetails = (chauffeur: ChauffeurProps) => {
    router.push(`/parametres/chauffeurs/${chauffeur.matricule}`);
    setOpenMenuId(null);
  };

  const handleFormSubmit = async (formData: FormData) => {
    try {
      const res = await SERVICE_CHAUFFEUR.create(formData);

      if (res.status === 200 || res.status === 201) {
        toast.success("Chauffeur ajoute avec succes");
        setShowFormModal(false);
        loadData();
      } else if (res.status === 409) {
        toast.error(res.message || "Ce chauffeur existe deja");
      } else {
        toast.error(res.message || "Erreur lors de l'operation");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Erreur lors de l'operation");
      console.error(error);
    }
  };

  const handleUpdateSubmit = async (data: UpdateChauffeurData) => {
    try {
      const res = await SERVICE_CHAUFFEUR.update(data);

      if (res.status === 200 || res.status === 201) {
        toast.success("Chauffeur modifie avec succes");
        setShowFormModal(false);
        loadData();
      } else {
        toast.error(res.message || "Erreur lors de la modification");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Erreur lors de l'operation");
      console.error(error);
    }
  };

  const handleStatusAction = (type: "activate" | "deactivate" | "ban" | "pending", chauffeur: ChauffeurProps) => {
    setConfirmAction({ type, chauffeur });
    setShowConfirmModal(true);
    setOpenMenuId(null);
  };

  const handleDeleteAction = (chauffeur: ChauffeurProps) => {
    setConfirmAction({ type: "delete", chauffeur });
    setShowConfirmModal(true);
    setOpenMenuId(null);
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    setActionLoading(true);
    try {
      let res;
      const { type, chauffeur } = confirmAction;

      switch (type) {
        case "activate":
          res = await SERVICE_CHAUFFEUR.activate(chauffeur.matricule);
          break;
        case "deactivate":
          res = await SERVICE_CHAUFFEUR.deactivate(chauffeur.matricule);
          break;
        case "ban":
          res = await SERVICE_CHAUFFEUR.ban(chauffeur.matricule);
          break;
        case "pending":
          res = await SERVICE_CHAUFFEUR.setPending(chauffeur.matricule);
          break;
        case "delete":
          res = await SERVICE_CHAUFFEUR.remove(chauffeur.matricule);
          break;
      }

      if (res.status === 200 || res.status === 201) {
        const messages = {
          activate: "Chauffeur active avec succes",
          deactivate: "Chauffeur desactive avec succes",
          ban: "Chauffeur banni avec succes",
          pending: "Chauffeur mis en attente",
          delete: "Chauffeur supprime avec succes",
        };
        toast.success(messages[type]);
        setShowConfirmModal(false);
        setConfirmAction(null);
        loadData();
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
        title: "Activer le chauffeur",
        message: `Voulez-vous activer le chauffeur ${confirmAction.chauffeur.name} ?`,
        type: "success" as const,
        confirmText: "Activer",
      },
      deactivate: {
        title: "Desactiver le chauffeur",
        message: `Voulez-vous desactiver le chauffeur ${confirmAction.chauffeur.name} ?`,
        type: "warning" as const,
        confirmText: "Desactiver",
      },
      ban: {
        title: "Bannir le chauffeur",
        message: `Voulez-vous bannir le chauffeur ${confirmAction.chauffeur.name} ? Cette action est serieuse.`,
        type: "danger" as const,
        confirmText: "Bannir",
      },
      pending: {
        title: "Mettre en attente",
        message: `Voulez-vous mettre le chauffeur ${confirmAction.chauffeur.name} en attente ?`,
        type: "info" as const,
        confirmText: "Confirmer",
      },
      delete: {
        title: "Supprimer le chauffeur",
        message: `Voulez-vous vraiment supprimer le chauffeur ${confirmAction.chauffeur.name} ? Cette action est irreversible.`,
        type: "danger" as const,
        confirmText: "Supprimer",
      },
    };

    return configs[confirmAction.type];
  };

  // Stats
  const stats = {
    total: chauffeurs.length,
    active: chauffeurs.filter((c) => c.status === "ACTIVE").length,
    online: chauffeurs.filter((c) => c.isOnline).length,
    pending: chauffeurs.filter((c) => c.status === "PENDING").length,
  };

  // Garage options for filter
  const garageOptions = [
    { value: "ALL", label: "Tous les garages", icon: "mdi:garage" },
    ...garages.map((g) => ({ value: g.id.toString(), label: g.name, icon: "mdi:garage-variant" })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-yellow-400"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon icon="mdi:car" className="text-yellow-500 text-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <PageHeader
        title="Gestion des Chauffeurs"
        icon="mdi:account-tie"
        count={filteredChauffeurs.length}
        action={<AddButton onClick={handleAddChauffeur} label="Ajouter" />}
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

          <FilterDropdown
            label="Garage"
            icon="mdi:garage"
            options={garageOptions}
            value={garageFilter}
            onChange={setGarageFilter}
          />

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              <Icon icon="mdi:magnify" className="inline mr-1" />
              Recherche
            </label>
            <div className="relative group">
              <Icon icon="mdi:magnify" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou telephone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Icon icon="mdi:close-circle" className="text-xl" />
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
            <TableHeaderCell>Chauffeur</TableHeaderCell>
            <TableHeaderCell>Contact</TableHeaderCell>
            <TableHeaderCell>Vehicule</TableHeaderCell>
            <TableHeaderCell>Garage</TableHeaderCell>
            <TableHeaderCell>Statut</TableHeaderCell>
            <TableHeaderCell>Disponibilite</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableHeader>
          <tbody>
            {paginatedChauffeurs.length > 0 ? (
              paginatedChauffeurs.map((chauffeur, index) => (
                <AnimatedTableRow key={chauffeur.matricule} index={index}>
                  <TableCell>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md">
                      {chauffeur.matricule}
                    </span>
                  </TableCell>
                  <TableCell>
                    <AvatarWithStatus
                      name={chauffeur.name}
                      avatar={chauffeur.avatar}
                      isOnline={chauffeur.isOnline}
                      rating={chauffeur.rating}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon icon="mdi:email-outline" className="text-gray-400" />
                        {chauffeur.email || "-"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Icon icon="mdi:phone-outline" className="text-gray-400" />
                        {chauffeur.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {chauffeur.vehicule ? (
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Icon icon="mdi:car" className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{chauffeur.vehicule.brand} {chauffeur.vehicule.model}</p>
                          <p className="text-xs text-gray-500">{chauffeur.vehicule.licensePlateNumber}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic flex items-center gap-2">
                        <Icon icon="mdi:car-off" className="text-gray-300" />
                        Non assigne
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {chauffeur.garageAffiliation ? (
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:garage" className="text-yellow-600" />
                        <span className="text-sm">{chauffeur.garageAffiliation.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={chauffeur.status} />
                  </TableCell>
                  <TableCell>
                    <OnlineBadge isOnline={chauffeur.isOnline} />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={(e) => handleMenuToggle(chauffeur.matricule, e)}
                      className="p-2.5 hover:bg-yellow-100 rounded-xl transition-all duration-200 hover:scale-110"
                    >
                      <Icon icon="mdi:dots-vertical" className="text-gray-600 text-xl" />
                    </button>
                  </TableCell>
                </AnimatedTableRow>
              ))
            ) : (
              <EmptyState
                icon="mdi:account-off"
                title="Aucun chauffeur trouve"
                description="Les chauffeurs apparaitront ici une fois ajoutes"
              />
            )}
          </tbody>
        </table>

        {filteredChauffeurs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredChauffeurs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </TableContainer>

      {/* Action Menu Portal */}
      {openMenuId && menuPosition && typeof window !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed w-52 bg-white border border-gray-200 rounded-2xl shadow-2xl py-2 z-[9999] overflow-hidden"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          {(() => {
            const chauffeur = paginatedChauffeurs.find(c => c.matricule === openMenuId);
            if (!chauffeur) return null;
            return (
              <>
                <button
                  onClick={() => handleViewDetails(chauffeur)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-yellow-50 flex items-center gap-3 transition-colors"
                >
                  <div className="p-1.5 bg-yellow-100 rounded-lg">
                    <Icon icon="mdi:eye" className="text-yellow-600" />
                  </div>
                  <span className="font-medium">Voir details</span>
                </button>
                <button
                  onClick={() => handleEditChauffeur(chauffeur)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors"
                >
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Icon icon="mdi:pencil" className="text-blue-600" />
                  </div>
                  <span className="font-medium">Modifier</span>
                </button>

                <div className="border-t border-gray-100 my-2"></div>

                {chauffeur.status !== "ACTIVE" && (
                  <button
                    onClick={() => handleStatusAction("activate", chauffeur)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-green-50 flex items-center gap-3 transition-colors"
                  >
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Icon icon="mdi:check-circle" className="text-green-600" />
                    </div>
                    <span className="font-medium">Activer</span>
                  </button>
                )}
                {chauffeur.status !== "PENDING" && (
                  <button
                    onClick={() => handleStatusAction("pending", chauffeur)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-yellow-50 flex items-center gap-3 transition-colors"
                  >
                    <div className="p-1.5 bg-yellow-100 rounded-lg">
                      <Icon icon="mdi:clock-outline" className="text-yellow-600" />
                    </div>
                    <span className="font-medium">Mettre en attente</span>
                  </button>
                )}
                {chauffeur.status !== "DEACTIVATED" && (
                  <button
                    onClick={() => handleStatusAction("deactivate", chauffeur)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <Icon icon="mdi:account-off" className="text-gray-600" />
                    </div>
                    <span className="font-medium">Desactiver</span>
                  </button>
                )}
                {chauffeur.status !== "BANNED" && (
                  <button
                    onClick={() => handleStatusAction("ban", chauffeur)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-orange-50 flex items-center gap-3 transition-colors"
                  >
                    <div className="p-1.5 bg-orange-100 rounded-lg">
                      <Icon icon="mdi:account-cancel" className="text-orange-600" />
                    </div>
                    <span className="font-medium">Bannir</span>
                  </button>
                )}

                <div className="border-t border-gray-100 my-2"></div>

                <button
                  onClick={() => handleDeleteAction(chauffeur)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <Icon icon="mdi:delete" className="text-red-600" />
                  </div>
                  <span className="font-medium text-red-600">Supprimer</span>
                </button>
              </>
            );
          })()}
        </div>,
        document.body
      )}

      {/* Form Modal */}
      <ChauffeurFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        chauffeur={selectedChauffeur}
        garages={garages}
        vehicleTypes={vehicleTypes}
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
