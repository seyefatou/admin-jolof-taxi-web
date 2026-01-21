"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "@/components/Pagination";
import FilterDropdown from "@/components/FilterDropdown";

// Types pour les courses (a adapter selon le backend)
type Course = {
  id: number;
  client: { name: string; phone: string };
  driver: { name: string; phone: string } | null;
  pickupLocation: { address: string };
  dropOffLocation: { address: string };
  status: string;
  paymentMethod: { name: string } | null;
  price: number;
  created_at: string;
};

// Donnees de demonstration (a remplacer par l'API)
const mockCourses: Course[] = [];

export default function CoursesPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtres
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [driverFilter, setDriverFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Options de filtres
  const statusOptions = [
    { value: "ALL", label: "Tous les statuts", icon: "mdi:format-list-bulleted" },
    { value: "DONE", label: "Terminee", icon: "mdi:check-circle" },
    { value: "PENDING", label: "En attente", icon: "mdi:clock-outline" },
    { value: "IN_PROGRESS", label: "En cours", icon: "mdi:car-clock" },
    { value: "CANCELED", label: "Annulee", icon: "mdi:close-circle" },
    { value: "CANCELED_BY_CUSTOMER", label: "Annulee par client", icon: "mdi:account-cancel" },
  ];

  const dateOptions = [
    { value: "ALL", label: "Toutes les dates", icon: "mdi:calendar-blank" },
    { value: "TODAY", label: "Aujourd'hui", icon: "mdi:calendar-today" },
    { value: "WEEK", label: "Cette semaine", icon: "mdi:calendar-week" },
    { value: "MONTH", label: "Ce mois", icon: "mdi:calendar-month" },
  ];

  const paymentOptions = [
    { value: "ALL", label: "Tous les paiements", icon: "mdi:credit-card-multiple" },
    { value: "CASH", label: "Especes", icon: "mdi:cash" },
    { value: "CARD", label: "Carte bancaire", icon: "mdi:credit-card" },
    { value: "MOBILE", label: "Mobile Money", icon: "mdi:cellphone" },
    { value: "WAVE", label: "Wave", icon: "mdi:wave" },
    { value: "OM", label: "Orange Money", icon: "mdi:alpha-o-circle" },
  ];

  const driverOptions = [
    { value: "ALL", label: "Tous les chauffeurs", icon: "mdi:account-group" },
    { value: "ASSIGNED", label: "Chauffeurs assignes", icon: "mdi:account-check" },
    { value: "UNASSIGNED", label: "Non assignes", icon: "mdi:account-question" },
  ];

  const loadCourses = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'appel API reel
      // const res = await SERVICE_COURSES.getAll();
      // setCourses(res.data);
      setCourses(mockCourses);
    } catch (error) {
      toast.error("Erreur lors de la recuperation des courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Filtrage des courses
  useEffect(() => {
    let filtered = [...courses];

    // Filtre de recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.pickupLocation.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.dropOffLocation.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((course) => course.status === statusFilter);
    }

    // Filtre par date
    if (dateFilter !== "ALL") {
      const today = new Date();
      filtered = filtered.filter((course) => {
        const courseDate = new Date(course.created_at);
        if (dateFilter === "TODAY") {
          return courseDate.toDateString() === today.toDateString();
        }
        if (dateFilter === "WEEK") {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(today.getDate() - 7);
          return courseDate >= oneWeekAgo && courseDate <= today;
        }
        if (dateFilter === "MONTH") {
          return (
            courseDate.getMonth() === today.getMonth() &&
            courseDate.getFullYear() === today.getFullYear()
          );
        }
        return true;
      });
    }

    // Filtre par paiement
    if (paymentFilter !== "ALL") {
      filtered = filtered.filter(
        (course) => course.paymentMethod?.name === paymentFilter
      );
    }

    // Filtre par chauffeur
    if (driverFilter === "ASSIGNED") {
      filtered = filtered.filter((course) => course.driver !== null);
    } else if (driverFilter === "UNASSIGNED") {
      filtered = filtered.filter((course) => course.driver === null);
    }

    setFilteredCourses(filtered);
    setCurrentPage(1);
  }, [courses, searchTerm, statusFilter, dateFilter, paymentFilter, driverFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = filteredCourses.slice(
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

  const handleRefresh = () => {
    loadCourses();
    toast.info("Donnees actualisees");
  };

  const resetFilters = () => {
    setStatusFilter("ALL");
    setDateFilter("ALL");
    setPaymentFilter("ALL");
    setDriverFilter("ALL");
    setSearchTerm("");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      DONE: { bg: "bg-green-100", text: "text-green-700", label: "Terminee" },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En attente" },
      IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700", label: "En cours" },
      CANCELED: { bg: "bg-red-100", text: "text-red-700", label: "Annulee" },
      CANCELED_BY_CUSTOMER: { bg: "bg-orange-100", text: "text-orange-700", label: "Annulee client" },
    };
    const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const hasActiveFilters = statusFilter !== "ALL" || dateFilter !== "ALL" || paymentFilter !== "ALL" || driverFilter !== "ALL";

  // Compteurs pour les stats
  const stats = {
    total: courses.length,
    done: courses.filter((c) => c.status === "DONE").length,
    pending: courses.filter((c) => c.status === "PENDING").length,
    inProgress: courses.filter((c) => c.status === "IN_PROGRESS").length,
    canceled: courses.filter((c) => c.status === "CANCELED" || c.status === "CANCELED_BY_CUSTOMER").length,
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
            <Icon icon="mdi:car-multiple" className="inline mr-2" />
            Liste des Courses
            <span className="text-yellow-500 ml-2">({filteredCourses.length})</span>
          </h1>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
          >
            <Icon icon="mdi:refresh" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Icon icon="mdi:car-multiple" className="text-xl text-gray-600" />
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
              <p className="text-2xl font-bold text-green-600">{stats.done}</p>
              <p className="text-xs text-gray-500">Terminees</p>
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
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon icon="mdi:car-clock" className="text-xl text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-xs text-gray-500">En cours</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Icon icon="mdi:close-circle" className="text-xl text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.canceled}</p>
              <p className="text-xs text-gray-500">Annulees</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Icon icon="mdi:filter-variant" />
            Filtres
          </h2>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Icon icon="mdi:close" />
              Reinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FilterDropdown
            label="Statut"
            icon="mdi:list-status"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          <FilterDropdown
            label="Date"
            icon="mdi:calendar"
            options={dateOptions}
            value={dateFilter}
            onChange={setDateFilter}
          />

          <FilterDropdown
            label="Paiement"
            icon="mdi:credit-card"
            options={paymentOptions}
            value={paymentFilter}
            onChange={setPaymentFilter}
          />

          <FilterDropdown
            label="Chauffeur"
            icon="mdi:account"
            options={driverOptions}
            value={driverFilter}
            onChange={setDriverFilter}
          />
        </div>

        {/* Barre de recherche */}
        <div className="mt-4">
          <div className="relative">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par client, chauffeur, adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-300"
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

      {/* Tableau des courses */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Chauffeur</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Depart</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Arrivee</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Paiement</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Prix</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCourses.length > 0 ? (
              paginatedCourses.map((course) => (
                <tr key={course.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">#{course.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-600 font-medium">
                        {course.client.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{course.client.name}</div>
                        <div className="text-xs text-gray-500">{course.client.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {course.driver ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-medium">
                          {course.driver.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{course.driver.name}</div>
                          <div className="text-xs text-gray-500">{course.driver.phone}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Non assigne</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Icon icon="mdi:map-marker" className="text-green-500" />
                      <span className="truncate max-w-[150px]">{course.pickupLocation.address}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Icon icon="mdi:map-marker" className="text-red-500" />
                      <span className="truncate max-w-[150px]">{course.dropOffLocation.address}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{course.paymentMethod?.name || "N/A"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-sm">{course.price.toLocaleString()} CFA</span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(course.status)}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {new Date(course.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200">
                      <Icon icon="mdi:eye" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-gray-100">
                <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                  <Icon icon="mdi:car-off" className="text-6xl mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Aucune course trouvee</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {hasActiveFilters
                      ? "Essayez de modifier vos filtres"
                      : "Les courses apparaitront ici une fois l'integration terminee"}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="mt-4 px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400"
                    >
                      Reinitialiser les filtres
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredCourses.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCourses.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>
    </div>
  );
}
