"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FilterDropdown from "@/components/FilterDropdown";
import Pagination from "@/components/Pagination";

// Type pour les chauffeurs (a adapter selon le backend)
type Chauffeur = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  isOnline: boolean;
  vehicule: string | null;
  createdAt: string;
};

// Donnees de demonstration
const mockChauffeurs: Chauffeur[] = [];

export default function ChauffeursList() {
  const [loading, setLoading] = useState(true);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [onlineFilter, setOnlineFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const loadChauffeurs = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'appel API reel
      setChauffeurs(mockChauffeurs);
    } catch (error) {
      toast.error("Erreur lors de la recuperation des chauffeurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChauffeurs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, onlineFilter]);

  // Filtrage
  const filteredChauffeurs = chauffeurs.filter((chauffeur) => {
    const matchSearch =
      chauffeur.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chauffeur.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chauffeur.phone.includes(searchTerm);

    const matchStatus = statusFilter === "ALL" || chauffeur.status === statusFilter;

    const matchOnline =
      onlineFilter === "ALL" ||
      (onlineFilter === "ONLINE" && chauffeur.isOnline) ||
      (onlineFilter === "OFFLINE" && !chauffeur.isOnline);

    return matchSearch && matchStatus && matchOnline;
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

  // Stats
  const stats = {
    total: chauffeurs.length,
    active: chauffeurs.filter((c) => c.status === "ACTIVE").length,
    online: chauffeurs.filter((c) => c.isOnline).length,
    pending: chauffeurs.filter((c) => c.status === "PENDING").length,
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
            <Icon icon="mdi:account-tie" className="inline mr-2" />
            Gestion des Chauffeurs
            <span className="text-yellow-500 ml-2">({filteredChauffeurs.length})</span>
          </h1>
          <button className="px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2">
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
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Chauffeur</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vehicule</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">En ligne</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedChauffeurs.length > 0 ? (
              paginatedChauffeurs.map((chauffeur) => (
                <tr key={chauffeur.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">#{chauffeur.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-600 font-medium">
                          {chauffeur.name.charAt(0)}
                        </div>
                        {chauffeur.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium">{chauffeur.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="text-gray-600">{chauffeur.email}</div>
                      <div className="text-gray-400">{chauffeur.phone}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {chauffeur.vehicule ? (
                      <span className="text-sm">{chauffeur.vehicule}</span>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Non assigne</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(chauffeur.status)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      chauffeur.isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${chauffeur.isOnline ? "bg-green-500" : "bg-gray-400"}`}></span>
                      {chauffeur.isOnline ? "En ligne" : "Hors ligne"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200">
                        <Icon icon="mdi:eye" />
                      </button>
                      <button className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200">
                        <Icon icon="mdi:pencil" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-gray-100">
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <Icon icon="mdi:account-off" className="text-6xl mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Aucun chauffeur trouve</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Les chauffeurs apparaitront ici une fois l'integration terminee
                  </p>
                </td>
              </tr>
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
      </div>
    </div>
  );
}
