"use client";

import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import Pagination from "@/components/Pagination";
import FilterDropdown from "@/components/FilterDropdown";
import ConfirmModal from "@/components/ConfirmModal";
import ExportDropdown from "@/components/ExportDropdown";
import { exportToExcel, exportToPDF, ExportColumn } from "@/utils/export-table";
import { SERVICE_COURSE, CourseProps } from "@/services/course-service";
import { SERVICE_CHAUFFEUR, ChauffeurProps } from "@/services/chauffeur-service";

export default function CoursesPage() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [courses, setCourses] = useState<CourseProps[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseProps[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableDrivers, setAvailableDrivers] = useState<ChauffeurProps[]>([]);

  // Filtres
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [driverFilter, setDriverFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Action menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseProps | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Options de filtres
  const statusOptions = [
    { value: "ALL", label: "Tous les statuts", icon: "mdi:format-list-bulleted" },
    { value: "DONE", label: "Terminee", icon: "mdi:check-circle" },
    { value: "PENDING", label: "En attente", icon: "mdi:clock-outline" },
    { value: "ACCEPTED", label: "Acceptee", icon: "mdi:check-decagram" },
    { value: "DRIVER_IN_PROGRESS", label: "Chauffeur en route", icon: "mdi:car-arrow-right" },
    { value: "IN_PROGRESS", label: "En cours", icon: "mdi:car-clock" },
    { value: "ALL_CANCELED", label: "Toutes les annulations", icon: "mdi:close-circle" },
    { value: "CANCELED_BY_CUSTOMER", label: "Annulee par client", icon: "mdi:account-cancel" },
    { value: "CANCELED_BY_DRIVER", label: "Annulee par chauffeur", icon: "mdi:account-cancel" },
    { value: "CANCELED_BY_SYSTEM", label: "Annulee par systeme", icon: "mdi:robot" },
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

  const loadCourses = async () => {
    try {
      setInitialLoading(true);
      const response = await SERVICE_COURSE.getAll({});
      const data = response.data;
      // DEBUG: voir tous les statuts uniques
      const uniqueStatuses = [...new Set((Array.isArray(data) ? data : []).map((c: any) => c.status))];
      console.log("[DEBUG] Statuts uniques:", uniqueStatuses);
      console.log("[DEBUG] Nombre total de courses:", Array.isArray(data) ? data.length : 0);
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Erreur lors de la recuperation des courses");
      setCourses([]);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await SERVICE_CHAUFFEUR.getAll();
      const activeDrivers = (response.data || []).filter(
        (d) => d.status === "ACTIVE" && d.isOnline
      );
      setAvailableDrivers(activeDrivers);
    } catch (error) {
      console.error("Erreur chargement chauffeurs:", error);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadCourses();
    loadDrivers();
  }, []);

  // Filtrage des courses (filtres locaux)
  useEffect(() => {
    let filtered = Array.isArray(courses) ? [...courses] : [];

    // Filtre par recherche (client, chauffeur, adresse, code)
    const searchLower = searchTerm.toLowerCase().trim();
    if (searchLower !== "") {
      filtered = filtered.filter((course) =>
        course.customer?.name?.toLowerCase().includes(searchLower) ||
        course.driver?.name?.toLowerCase().includes(searchLower) ||
        course.pickup_location?.address?.toLowerCase().includes(searchLower) ||
        course.dropoff_location?.address?.toLowerCase().includes(searchLower) ||
        course.code_booking?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par status
    if (statusFilter === "ALL_CANCELED") {
      filtered = filtered.filter((course) =>
        course.status === "CANCELED" || course.status === "CANCELED_BY_CUSTOMER" || course.status === "CANCELED_BY_DRIVER" || course.status === "CANCELED_BY_SYSTEM"
      );
    } else if (statusFilter !== "ALL") {
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
        (course) => course.payment_method?.name === paymentFilter
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

  const handlePageChange = (page: number) => setCurrentPage(page);
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

  const handleViewDetails = (course: CourseProps) => {
    router.push(`/reservations/reservations/${course.code_booking}`);
    setOpenMenuId(null);
  };

  const handleCancelCourse = (course: CourseProps) => {
    setSelectedCourse(course);
    setShowCancelModal(true);
    setOpenMenuId(null);
  };

  const handleAssignDriver = (course: CourseProps) => {
    setSelectedCourse(course);
    setShowAssignModal(true);
    setOpenMenuId(null);
  };

  const executeCancelCourse = async () => {
    if (!selectedCourse || !cancelReason.trim()) {
      toast.error("Veuillez indiquer une raison d'annulation");
      return;
    }

    setActionLoading(true);
    try {
      const res = await SERVICE_COURSE.cancel(selectedCourse.code_booking, cancelReason);
      if (res.status === 200 || res.status === 201) {
        toast.success("Course annulee avec succes");
        setShowCancelModal(false);
        setSelectedCourse(null);
        setCancelReason("");
        loadCourses();
      } else {
        toast.error(res.message || "Erreur lors de l'annulation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setActionLoading(false);
    }
  };

  const executeAssignDriver = async () => {
    if (!selectedCourse || !selectedDriver) {
      toast.error("Veuillez selectionner un chauffeur");
      return;
    }

    setActionLoading(true);
    try {
      const res = await SERVICE_COURSE.assignDriver(selectedCourse.code_booking, selectedDriver);
      if (res.status === 200 || res.status === 201) {
        toast.success("Chauffeur assigne avec succes");
        setShowAssignModal(false);
        setSelectedCourse(null);
        setSelectedDriver("");
        loadCourses();
      } else {
        toast.error(res.message || "Erreur lors de l'assignation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'assignation");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      DONE: { bg: "bg-green-100", text: "text-green-700", label: "Terminee" },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En attente" },
      ACCEPTED: { bg: "bg-cyan-100", text: "text-cyan-700", label: "Acceptee" },
      DRIVER_IN_PROGRESS: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Chauffeur en route" },
      IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700", label: "En cours" },
      CANCELED: { bg: "bg-red-100", text: "text-red-700", label: "Annulee" },
      CANCELED_BY_CUSTOMER: { bg: "bg-orange-100", text: "text-orange-700", label: "Annulee par client" },
      CANCELED_BY_DRIVER: { bg: "bg-purple-100", text: "text-purple-700", label: "Annulee par chauffeur" },
      CANCELED_BY_SYSTEM: { bg: "bg-gray-100", text: "text-gray-700", label: "Annulee par systeme" },
    };
    const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const hasActiveFilters = statusFilter !== "ALL" || dateFilter !== "ALL" || paymentFilter !== "ALL" || driverFilter !== "ALL";

  const COURSE_STATUS_LABELS: Record<string, string> = {
    DONE: "Terminee",
    PENDING: "En attente",
    ACCEPTED: "Acceptee",
    DRIVER_IN_PROGRESS: "Chauffeur en route",
    IN_PROGRESS: "En cours",
    CANCELED: "Annulee",
    CANCELED_BY_CUSTOMER: "Annulee par client",
    CANCELED_BY_DRIVER: "Annulee par chauffeur",
    CANCELED_BY_SYSTEM: "Annulee par systeme",
  };

  const formatDateFr = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportColumns: ExportColumn<CourseProps>[] = [
    { header: "Code", accessor: (c) => c.code_booking },
    { header: "Client", accessor: (c) => c.customer?.name || "-" },
    { header: "Telephone client", accessor: (c) => c.customer?.phone || "-" },
    { header: "Chauffeur", accessor: (c) => c.driver?.name || "Non assigne" },
    { header: "Depart", accessor: (c) => c.pickup_location?.address || "-" },
    { header: "Arrivee", accessor: (c) => c.dropoff_location?.address || "-" },
    { header: "Statut", accessor: (c) => COURSE_STATUS_LABELS[c.status] || c.status },
    { header: "Paiement", accessor: (c) => c.payment_method?.name || "-" },
    { header: "Prix (FCFA)", accessor: (c) => c.price ?? 0 },
    { header: "Distance (km)", accessor: (c) => c.distance ?? 0 },
    { header: "Duree (min)", accessor: (c) => c.duration ?? 0 },
    { header: "Date", accessor: (c) => formatDateFr(c.created_at) },
  ];

  const handleExport = (format: "pdf" | "excel") => {
    if (filteredCourses.length === 0) {
      toast.info("Aucune course a exporter");
      return;
    }
    const config = {
      fileName: "courses",
      title: "Liste des Courses",
      columns: exportColumns,
      data: filteredCourses,
    };
    if (format === "pdf") exportToPDF(config);
    else exportToExcel(config);
  };

  // Compteurs pour les stats (protection si courses n'est pas un tableau)
  const coursesArray = Array.isArray(courses) ? courses : [];
  const stats = {
    total: coursesArray.length,
    done: coursesArray.filter((c) => c.status === "DONE").length,
    pending: coursesArray.filter((c) => c.status === "PENDING").length,
    inProgress: coursesArray.filter((c) => c.status === "IN_PROGRESS").length,
    canceled: coursesArray.filter((c) => c.status === "CANCELED" || c.status === "CANCELED_BY_CUSTOMER" || c.status === "CANCELED_BY_DRIVER" || c.status === "CANCELED_BY_SYSTEM").length,
    revenue: coursesArray.filter((c) => c.status === "DONE").reduce((sum, c) => sum + c.price, 0),
  };

  if (initialLoading) {
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
          <div className="flex items-center gap-3">
            <ExportDropdown onExport={handleExport} />
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
            >
              <Icon icon="mdi:refresh" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
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
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icon icon="mdi:cash" className="text-xl text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-purple-600">{stats.revenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Revenus (CFA)</p>
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
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 outline-none"
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
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trajet</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Prix</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCourses.length > 0 ? (
              paginatedCourses.map((course) => (
                <tr key={course.code_booking} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-xs">{course.code_booking}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-600 font-medium">
                        {course.customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{course.customer.name}</div>
                        <div className="text-xs text-gray-500">{course.customer.phone}</div>
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
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:map-marker" className="text-green-500 text-xs" />
                        <span className="truncate max-w-[120px]">{course.pickup_location.address}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:map-marker" className="text-red-500 text-xs" />
                        <span className="truncate max-w-[120px]">{course.dropoff_location.address}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-semibold text-sm">{course.price.toLocaleString()} CFA</span>
                      <div className="text-xs text-gray-400">{course.payment_method?.name || "N/A"}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(course.status)}
                    {course.cancel_reason && (
                      <div className="mt-1 text-xs text-red-500 max-w-[160px] truncate" title={course.cancel_reason}>
                        <Icon icon="mdi:message-alert" className="inline mr-1 text-red-400" />
                        {course.cancel_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="text-gray-700">{new Date(course.created_at).toLocaleDateString("fr-FR")}</div>
                      <div className="text-xs text-gray-400">{new Date(course.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative" ref={openMenuId === course.code_booking ? menuRef : null}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === course.code_booking ? null : course.code_booking)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Icon icon="mdi:dots-vertical" className="text-gray-600" />
                      </button>

                      {openMenuId === course.code_booking && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                          <button
                            onClick={() => handleViewDetails(course)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Icon icon="mdi:eye" className="text-yellow-600" />
                            Voir details
                          </button>

                          {!course.driver && course.status === "PENDING" && (
                            <button
                              onClick={() => handleAssignDriver(course)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Icon icon="mdi:account-plus" className="text-blue-600" />
                              Assigner chauffeur
                            </button>
                          )}

                          {(course.status === "PENDING" || course.status === "ACCEPTED" || course.status === "IN_PROGRESS") && (
                            <>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => handleCancelCourse(course)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                              >
                                <Icon icon="mdi:close-circle" />
                                Annuler la course
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-gray-100">
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <Icon icon="mdi:car-off" className="text-6xl mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Aucune course trouvee</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {hasActiveFilters
                      ? "Essayez de modifier vos filtres"
                      : "Les courses apparaitront ici"}
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

      {/* Cancel Modal */}
      {showCancelModal && selectedCourse && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCancelModal(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-red-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Annuler la course</h2>
                <button onClick={() => setShowCancelModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <Icon icon="mdi:close" className="text-xl text-white" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Vous etes sur le point d'annuler la course <strong>{selectedCourse.code_booking}</strong>.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison de l'annulation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Indiquez la raison de l'annulation..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  onClick={executeCancelCourse}
                  disabled={actionLoading || !cancelReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Icon icon="mdi:close-circle" />
                      Annuler la course
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignModal && selectedCourse && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAssignModal(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-yellow-300 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-black">Assigner un chauffeur</h2>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <Icon icon="mdi:close" className="text-xl text-black" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Selectionner un chauffeur pour la course <strong>{selectedCourse.code_booking}</strong>.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chauffeur disponible <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                >
                  <option value="">Selectionner un chauffeur</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver.matricule} value={driver.matricule}>
                      {driver.name} - {driver.phone}
                    </option>
                  ))}
                </select>
                {availableDrivers.length === 0 && (
                  <p className="text-sm text-orange-500 mt-1">Aucun chauffeur disponible en ligne</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={executeAssignDriver}
                  disabled={actionLoading || !selectedDriver}
                  className="flex-1 px-4 py-2.5 bg-yellow-300 text-black rounded-xl hover:bg-yellow-400 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                  ) : (
                    <>
                      <Icon icon="mdi:account-check" />
                      Assigner
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
