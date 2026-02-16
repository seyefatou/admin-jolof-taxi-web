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
import ExportDropdown from "@/components/ExportDropdown";
import { exportToExcel, exportToPDF, ExportColumn, STATUS_LABELS, ONLINE_LABELS } from "@/utils/export-table";
import { SERVICE_CHAUFFEUR, ChauffeurProps, UpdateChauffeurData, ConnectionQuality } from "@/services/chauffeur-service";
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [chauffeurs, setChauffeurs] = useState<ChauffeurProps[]>([]);
  const [garages, setGarages] = useState<GaragesProps[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehiculeTypeResp[]>([]);
  const [connectionMap, setConnectionMap] = useState<Record<string, ConnectionQuality>>({});
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
    { value: "GOOD", label: "Bonne connexion", icon: "mdi:wifi" },
    { value: "POOR", label: "Mauvaise connexion", icon: "mdi:wifi-strength-2" },
    { value: "DISCONNECTED", label: "Deconnecte", icon: "mdi:wifi-off" },
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
      setInitialLoading(true);
      const [chauffeursRes, garagesRes, vehicleTypesRes, trackingRes] = await Promise.all([
        SERVICE_CHAUFFEUR.getAll(),
        SERVICE_GARAGES.getAll(),
        SERVICE_VEHICULES.getTypeList(),
        SERVICE_CHAUFFEUR.getLiveTracking().catch(() => null),
      ]);
      setChauffeurs(chauffeursRes.data || []);
      setGarages(garagesRes.data || []);
      setVehicleTypes(vehicleTypesRes.data || []);

      // Construire la map matricule → connectionQuality
      if (trackingRes?.data?.drivers) {
        const map: Record<string, ConnectionQuality> = {};
        for (const d of trackingRes.data.drivers) {
          map[d.matricule] = d.connectionQuality || "DISCONNECTED";
        }
        setConnectionMap(map);
      }
    } catch (error) {
      toast.error("Erreur lors de la recuperation des donnees");
      console.error("Erreur:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadData();
  }, []);

  // Reset page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, onlineFilter, garageFilter, searchTerm]);

  // Filtrage local (recherche + filtres)
  const filteredChauffeurs = chauffeurs.filter((chauffeur) => {
    // Filtre par recherche (nom, email, telephone, matricule)
    const searchLower = searchTerm.toLowerCase().trim();
    const matchSearch =
      searchLower === "" ||
      chauffeur.name?.toLowerCase().includes(searchLower) ||
      chauffeur.email?.toLowerCase().includes(searchLower) ||
      chauffeur.phone?.toLowerCase().includes(searchLower) ||
      chauffeur.matricule?.toLowerCase().includes(searchLower);

    const matchStatus = statusFilter === "ALL" || chauffeur.status === statusFilter;
    const driverConnection = connectionMap[chauffeur.matricule] || "DISCONNECTED";
    const matchOnline =
      onlineFilter === "ALL" || driverConnection === onlineFilter;
    const matchGarage =
      garageFilter === "ALL" ||
      chauffeur.garageAffiliation?.id?.toString() === garageFilter;
    return matchSearch && matchStatus && matchOnline && matchGarage;
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

  const handleEditChauffeur = async (chauffeur: ChauffeurProps) => {
    setOpenMenuId(null);
    try {
      // Recuperer les details complets du chauffeur (avec documents)
      const res = await SERVICE_CHAUFFEUR.getOne(chauffeur.matricule);
      if (res.data) {
        setSelectedChauffeur(res.data);
      } else {
        setSelectedChauffeur(chauffeur);
      }
    } catch {
      // Fallback sur les donnees de la liste
      setSelectedChauffeur(chauffeur);
    }
    setShowFormModal(true);
  };

  const handleViewDetails = (chauffeur: ChauffeurProps) => {
    router.push(`/parametres/chauffeurs/${chauffeur.matricule}`);
    setOpenMenuId(null);
  };

  const handleFormSubmit = async (formData: FormData) => {
    const isUpdate = formData.has("matricule");
    try {
      console.log("Envoi du formulaire chauffeur...", isUpdate ? "modification" : "creation");
      const res = await SERVICE_CHAUFFEUR.create(formData);
      console.log("Reponse:", res);

      if (res.status === 200 || res.status === 201) {
        toast.success(isUpdate ? "Chauffeur modifie avec succes" : "Chauffeur ajoute avec succes");
        setShowFormModal(false);
        loadData();
      } else if (res.status === 409) {
        toast.error(res.message || "Ce chauffeur existe deja");
      } else {
        toast.error(res.message || "Erreur lors de l'operation");
      }
    } catch (error: unknown) {
      console.error("Erreur complete:", error);
      const err = error as { response?: { data?: { message?: string }; status?: number } };
      console.error("Status:", err?.response?.status);
      console.error("Data:", err?.response?.data);
      toast.error(err?.response?.data?.message || "Erreur lors de l'operation");
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

  // Export columns
  const exportColumns: ExportColumn<ChauffeurProps>[] = [
    { header: "Matricule", accessor: (c) => c.matricule },
    { header: "Nom", accessor: (c) => c.name || "" },
    { header: "Telephone", accessor: (c) => c.phone || "-" },
    { header: "Statut", accessor: (c) => STATUS_LABELS[c.status] || c.status },
    { header: "Etat Reseau", accessor: (c) => ONLINE_LABELS[connectionMap[c.matricule] || "DISCONNECTED"] || "Deconnecte" },
    { header: "Vehicule", accessor: (c) => c.vehicule ? `${c.vehicule.brand} ${c.vehicule.model} — ${c.vehicule.licensePlateNumber?.toUpperCase()}` : "-" },
    { header: "Garage", accessor: (c) => c.garageAffiliation?.name || "-" },
  ];

  const handleExport = (format: "pdf" | "excel") => {
    const config = {
      fileName: "chauffeurs",
      title: "Liste des Chauffeurs",
      columns: exportColumns,
      data: filteredChauffeurs,
    };
    if (format === "pdf") exportToPDF(config);
    else exportToExcel(config);
  };

  // Stats
  const stats = {
    total: chauffeurs.length,
    active: chauffeurs.filter((c) => c.status === "ACTIVE").length,
    online: chauffeurs.filter((c) => connectionMap[c.matricule] === "GOOD" || connectionMap[c.matricule] === "POOR").length,
    pending: chauffeurs.filter((c) => c.status === "PENDING").length,
  };

  // Garage options for filter
  const garageOptions = [
    { value: "ALL", label: "Tous les garages", icon: "mdi:garage" },
    ...garages.map((g) => ({ value: g.id.toString(), label: g.name, icon: "mdi:garage-variant" })),
  ];

  if (initialLoading) {
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
        action={
          <div className="flex items-center gap-3">
            <ExportDropdown onExport={handleExport} />
            <AddButton onClick={handleAddChauffeur} label="Ajouter" />
          </div>
        }
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
            <TableHeaderCell>Chauffeur</TableHeaderCell>
            <TableHeaderCell>Garage</TableHeaderCell>
            <TableHeaderCell>Contact</TableHeaderCell>
            <TableHeaderCell>Statut</TableHeaderCell>
            <TableHeaderCell>Etat Reseau</TableHeaderCell>
            <TableHeaderCell>Vehicule</TableHeaderCell>
            <TableHeaderCell className="text-center">Actions</TableHeaderCell>
          </TableHeader>
          <tbody>
            {paginatedChauffeurs.length > 0 ? (
              paginatedChauffeurs.map((chauffeur, index) => (
                <AnimatedTableRow key={chauffeur.matricule} index={index}>
                  {/* Chauffeur */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          className="w-10 h-10 rounded-full ring-2 ring-gray-100 object-cover"
                          src={chauffeur.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chauffeur.name || "U")}&background=FEF08A&color=713F12&bold=true`}
                          alt={chauffeur.name || "User"}
                        />
                        {connectionMap[chauffeur.matricule] === "GOOD" && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full">
                            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
                          </span>
                        )}
                        {connectionMap[chauffeur.matricule] === "POOR" && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-orange-500 border-2 border-white rounded-full">
                            <span className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-75"></span>
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {chauffeur.name || <span className="text-gray-400 italic font-normal">Indisponible</span>}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Icon icon="mdi:map-marker" className="text-gray-400 text-xs" />
                          <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{chauffeur.matricule}</span>
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Garage */}
                  <TableCell>
                    {chauffeur.garageAffiliation ? (
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Icon icon="mdi:garage" className="text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{chauffeur.garageAffiliation.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[120px]">
                            {chauffeur.garageAffiliation.address?.slice(0, 20)}...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic flex items-center gap-2">
                        <Icon icon="mdi:garage-alert" className="text-gray-300" />
                        Aucun garage
                      </span>
                    )}
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Icon icon="mdi:phone" className="text-gray-400 text-sm" />
                        <span className="font-medium">{chauffeur.phone || "-"}</span>
                      </div>
                      {chauffeur.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Icon icon="mdi:email-outline" className="text-gray-400 text-sm" />
                          {chauffeur.email}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Statut */}
                  <TableCell>
                    <StatusBadge status={chauffeur.status} />
                  </TableCell>

                  {/* Etat Reseau */}
                  <TableCell>
                    <OnlineBadge connectionQuality={connectionMap[chauffeur.matricule]} />
                  </TableCell>

                  {/* Vehicule */}
                  <TableCell>
                    {chauffeur.vehicule ? (
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Icon icon="mdi:car-side" className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {chauffeur.vehicule.brand} {chauffeur.vehicule.model}
                          </p>
                          <p className="text-xs text-gray-500">
                            {chauffeur.vehicule.licensePlateNumber?.toUpperCase()}
                            {chauffeur.vehicule.type && <span> • {chauffeur.vehicule.type}</span>}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic flex items-center gap-2">
                        <Icon icon="mdi:car-off" className="text-gray-300" />
                        Aucun vehicule
                      </span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {/* Details */}
                      <button
                        onClick={() => handleViewDetails(chauffeur)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-yellow-100 border border-gray-200 hover:border-yellow-300 transition-all duration-200 hover:scale-110 group"
                        title="Voir details"
                      >
                        <Icon icon="fluent:apps-list-detail-20-filled" className="text-gray-600 group-hover:text-yellow-600 text-lg" />
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => handleEditChauffeur(chauffeur)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-blue-100 border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:scale-110 group"
                        title="Modifier"
                      >
                        <Icon icon="basil:edit-solid" className="text-gray-600 group-hover:text-blue-600 text-lg" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteAction(chauffeur)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-200 hover:scale-110 group"
                        title="Supprimer"
                      >
                        <Icon icon="weui:delete-filled" className="text-red-500 group-hover:text-red-600 text-lg" />
                      </button>
                      {/* More options */}
                      <button
                        onClick={(e) => handleMenuToggle(chauffeur.matricule, e)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all duration-200 hover:scale-110"
                        title="Plus d'options"
                      >
                        <Icon icon="mdi:dots-vertical" className="text-gray-600 text-lg" />
                      </button>
                    </div>
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

      {/* Action Menu Portal - Status options only */}
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
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Changer le statut</p>
                </div>

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
        onSubmit={async (formData) => {
          if (selectedChauffeur) {
            // Mode edition: meme endpoint que creation (POST) avec matricule
            formData.append("matricule", selectedChauffeur.matricule);
            if (selectedChauffeur.vehicule?.id) {
              formData.append("vehiculeId", selectedChauffeur.vehicule.id.toString());
            }
          }
          await handleFormSubmit(formData);
        }}
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
