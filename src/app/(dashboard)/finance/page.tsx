"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FilterDropdown from "@/components/FilterDropdown";
import Pagination from "@/components/Pagination";
import ExportDropdown from "@/components/ExportDropdown";
import { exportToExcel, exportToPDF, ExportColumn } from "@/utils/export-table";
import { SERVICE_TRANSACTION, TransactionProps } from "@/services/transaction-service";
import { SERVICE_COURSE, CourseProps } from "@/services/course-service";
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
} from "@/components/ui/AnimatedTable";

// Status badge config for transactions
const transactionStatusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  success: {
    bg: "bg-gradient-to-r from-green-100 to-emerald-100 border-green-200",
    text: "text-green-700",
    icon: "mdi:check-circle",
    label: "Succes",
  },
  SUCCESS: {
    bg: "bg-gradient-to-r from-green-100 to-emerald-100 border-green-200",
    text: "text-green-700",
    icon: "mdi:check-circle",
    label: "Succes",
  },
  pending: {
    bg: "bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200",
    text: "text-yellow-700",
    icon: "mdi:clock-outline",
    label: "En attente",
  },
  PENDING: {
    bg: "bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200",
    text: "text-yellow-700",
    icon: "mdi:clock-outline",
    label: "En attente",
  },
  failed: {
    bg: "bg-gradient-to-r from-red-100 to-rose-100 border-red-200",
    text: "text-red-700",
    icon: "mdi:close-circle",
    label: "Echoue",
  },
  FAILED: {
    bg: "bg-gradient-to-r from-red-100 to-rose-100 border-red-200",
    text: "text-red-700",
    icon: "mdi:close-circle",
    label: "Echoue",
  },
  cancelled: {
    bg: "bg-gradient-to-r from-gray-100 to-slate-100 border-gray-200",
    text: "text-gray-700",
    icon: "mdi:cancel",
    label: "Annule",
  },
  CANCELLED: {
    bg: "bg-gradient-to-r from-gray-100 to-slate-100 border-gray-200",
    text: "text-gray-700",
    icon: "mdi:cancel",
    label: "Annule",
  },
};

// Type badge config
const transactionTypeConfig: Record<string, { bg: string; text: string; icon: string }> = {
  credit: { bg: "bg-green-100", text: "text-green-700", icon: "mdi:arrow-down" },
  CREDIT: { bg: "bg-green-100", text: "text-green-700", icon: "mdi:arrow-down" },
  debit: { bg: "bg-red-100", text: "text-red-700", icon: "mdi:arrow-up" },
  DEBIT: { bg: "bg-red-100", text: "text-red-700", icon: "mdi:arrow-up" },
};

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [initialLoading, setInitialLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionProps[]>([]);
  const [courses, setCourses] = useState<CourseProps[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const typeOptions = [
    { value: "ALL", label: "Tous les types", icon: "mdi:format-list-bulleted" },
    { value: "credit", label: "Credit", icon: "mdi:arrow-down" },
    { value: "debit", label: "Debit", icon: "mdi:arrow-up" },
  ];

  const statusOptions = [
    { value: "ALL", label: "Tous les statuts", icon: "mdi:format-list-bulleted" },
    { value: "success", label: "Succes", icon: "mdi:check-circle" },
    { value: "pending", label: "En attente", icon: "mdi:clock-outline" },
    { value: "failed", label: "Echoue", icon: "mdi:close-circle" },
  ];

  // Compute stats from transactions and courses
  const completedCourses = courses.filter(
    (c) => c.status?.toLowerCase() === "done" || c.status?.toLowerCase() === "completed"
  );
  const totalRevenue = completedCourses.reduce((sum, c) => sum + (c.price || 0), 0);
  const totalCommission = completedCourses.reduce((sum, c) => sum + (c.commission || 0), 0);

  const loadData = async () => {
    try {
      setInitialLoading(true);

      // Fetch independently so one failure doesn't block the other
      const [transactionsRes, coursesRes] = await Promise.allSettled([
        SERVICE_TRANSACTION.getAll(),
        SERVICE_COURSE.getAll(),
      ]);

      if (transactionsRes.status === "fulfilled") {
        setTransactions(transactionsRes.value.data || []);
      } else {
        console.error("Erreur transactions:", transactionsRes.reason);
        toast.error("Erreur lors de la recuperation des transactions");
      }

      if (coursesRes.status === "fulfilled") {
        setCourses(coursesRes.value.data || []);
      } else {
        console.warn("Courses indisponibles:", coursesRes.reason);
      }
    } catch (error) {
      toast.error("Erreur lors de la recuperation des donnees");
      console.error("Erreur:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter, searchTerm]);

  // Local filtering
  const filteredTransactions = transactions.filter((t) => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchSearch =
      searchLower === "" ||
      t.transactionId?.toLowerCase().includes(searchLower) ||
      t.libelle?.toLowerCase().includes(searchLower) ||
      t.paymentReference?.toLowerCase().includes(searchLower);

    const matchType =
      typeFilter === "ALL" || t.type?.toLowerCase() === typeFilter.toLowerCase();
    const matchStatus =
      statusFilter === "ALL" || t.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchSearch && matchType && matchStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Export
  const exportColumns: ExportColumn<TransactionProps>[] = [
    { header: "ID Transaction", accessor: (t) => t.transactionId },
    { header: "Date", accessor: (t) => t.date ? new Date(t.date).toLocaleDateString("fr-FR") : "-" },
    { header: "Libelle", accessor: (t) => t.libelle || "-" },
    { header: "Type", accessor: (t) => t.type || "-" },
    { header: "Montant", accessor: (t) => `${t.amount.toLocaleString()} CFA` },
    { header: "Methode", accessor: (t) => t.paymentMethod || "-" },
    { header: "Statut", accessor: (t) => t.status || "-" },
  ];

  const handleExport = (format: "pdf" | "excel") => {
    const config = {
      fileName: "transactions",
      title: "Liste des Transactions",
      columns: exportColumns,
      data: filteredTransactions,
    };
    if (format === "pdf") exportToPDF(config);
    else exportToExcel(config);
  };

  // Format amount with CFA
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} CFA`;
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-yellow-400"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon icon="mdi:finance" className="text-yellow-500 text-xl" />
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
        title="Finance"
        icon="mdi:finance"
        count={transactions.length}
        action={<ExportDropdown onExport={handleExport} />}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "overview"
              ? "bg-yellow-300 text-black"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Vue d&apos;ensemble
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "transactions"
              ? "bg-yellow-300 text-black"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Transactions
        </button>
      </div>

      {/* Vue d'ensemble Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total transactions"
              value={transactions.length}
              icon="mdi:receipt-text"
              color="gray"
              index={0}
            />
            <StatCard
              title="Revenus total"
              value={totalRevenue}
              icon="mdi:cash-plus"
              color="green"
              index={1}
            />
            <StatCard
              title="Courses completees"
              value={completedCourses.length}
              icon="mdi:car-check"
              color="blue"
              index={2}
            />
            <StatCard
              title="Commission totale"
              value={totalCommission}
              icon="mdi:percent"
              color="purple"
              index={3}
            />
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <>
          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FilterDropdown
                label="Type"
                icon="mdi:swap-vertical"
                options={typeOptions}
                value={typeFilter}
                onChange={setTypeFilter}
              />

              <FilterDropdown
                label="Statut"
                icon="mdi:filter-variant"
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
              />

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  <Icon icon="mdi:magnify" className="inline mr-1" />
                  Recherche
                </label>
                <div className="relative group">
                  <Icon
                    icon="mdi:magnify"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Rechercher par ID, libelle ou reference..."
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

          {/* Table */}
          <TableContainer>
            <table className="w-full">
              <TableHeader>
                <TableHeaderCell>ID Transaction</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Libelle</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Montant</TableHeaderCell>
                <TableHeaderCell>Methode paiement</TableHeaderCell>
                <TableHeaderCell>Statut</TableHeaderCell>
              </TableHeader>
              <tbody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction, index) => {
                    const typeConf = transactionTypeConfig[transaction.type] || {
                      bg: "bg-gray-100",
                      text: "text-gray-700",
                      icon: "mdi:help-circle",
                    };

                    return (
                      <AnimatedTableRow key={transaction.id} index={index}>
                        {/* ID Transaction */}
                        <TableCell>
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {transaction.transactionId}
                          </span>
                        </TableCell>

                        {/* Date */}
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {transaction.date
                              ? new Date(transaction.date).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </div>
                          {transaction.date && (
                            <div className="text-xs text-gray-400">
                              {new Date(transaction.date).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                        </TableCell>

                        {/* Libelle */}
                        <TableCell>
                          <span className="text-sm text-gray-800">
                            {transaction.libelle || "-"}
                          </span>
                        </TableCell>

                        {/* Type */}
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${typeConf.bg} ${typeConf.text}`}
                          >
                            <Icon icon={typeConf.icon} className="text-sm" />
                            {transaction.type || "-"}
                          </span>
                        </TableCell>

                        {/* Montant */}
                        <TableCell>
                          <span
                            className={`text-sm font-bold ${
                              transaction.type?.toLowerCase() === "credit"
                                ? "text-green-600"
                                : transaction.type?.toLowerCase() === "debit"
                                  ? "text-red-600"
                                  : "text-gray-800"
                            }`}
                          >
                            {transaction.type?.toLowerCase() === "debit" ? "-" : "+"}
                            {formatAmount(transaction.amount)}
                          </span>
                        </TableCell>

                        {/* Methode paiement */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon icon="mdi:credit-card-outline" className="text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {transaction.paymentMethod || "-"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Statut */}
                        <TableCell>
                          <StatusBadge
                            status={transaction.status}
                            customConfig={transactionStatusConfig}
                          />
                        </TableCell>
                      </AnimatedTableRow>
                    );
                  })
                ) : (
                  <EmptyState
                    icon="mdi:receipt-text-outline"
                    title="Aucune transaction trouvee"
                    description="Les transactions apparaitront ici une fois effectuees"
                  />
                )}
              </tbody>
            </table>

            {filteredTransactions.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTransactions.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            )}
          </TableContainer>
        </>
      )}
    </div>
  );
}
