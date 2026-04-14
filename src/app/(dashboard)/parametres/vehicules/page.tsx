"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_VEHICULES, VehiculeResp } from "@/services/vehicule-service";
import Pagination from "@/components/Pagination";
import {
  AnimatedTableRow,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableCell,
  EmptyState,
  PageHeader,
} from "@/components/ui/AnimatedTable";

const getServiceCategory = (year: number) => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  if (age < 2) return { category: "Confort+", color: "text-indigo-700", bg: "bg-gradient-to-r from-indigo-100 to-purple-100", border: "border-indigo-200", icon: "mdi:star-circle" };
  if (age < 10) return { category: "Confort", color: "text-yellow-700", bg: "bg-gradient-to-r from-yellow-100 to-amber-100", border: "border-yellow-200", icon: "mdi:car-seat" };
  return { category: "Eco", color: "text-green-700", bg: "bg-gradient-to-r from-green-100 to-emerald-100", border: "border-green-200", icon: "mdi:leaf" };
};

type SortConfig = {
  key: string;
  direction: "ascending" | "descending";
};

export default function VehiculesPage() {
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState<VehiculeResp[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [plateSearch, setPlateSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [expandedCarId, setExpandedCarId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "id", direction: "ascending" });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadVehicules = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_VEHICULES.getAll();
      if (res.status === 200) {
        setCars(res.data);
      }
    } catch (error) {
      toast.error("Erreur lors de la recuperation des vehicules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicules();
  }, []);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, plateSearch, filterCategory]);

  // Fonction de tri
  const handleSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Indicateur de direction du tri
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <Icon icon="mdi:unfold-more-horizontal" className="text-gray-400" />;
    return sortConfig.direction === "ascending" ? (
      <Icon icon="mdi:chevron-up" className="text-yellow-600" />
    ) : (
      <Icon icon="mdi:chevron-down" className="text-yellow-600" />
    );
  };

  const filteredCars = cars
    .filter((car) => {
      const matchSearch =
        car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.licensePlateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.owner.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPlate = plateSearch
        ? car.licensePlateNumber.toLowerCase().includes(plateSearch.toLowerCase())
        : true;

      if (filterCategory === "all") return matchSearch && matchPlate;

      const currentYear = new Date().getFullYear();
      const age = currentYear - car.year;
      if (filterCategory === "comfort-plus") return matchSearch && matchPlate && age < 2;
      if (filterCategory === "comfort") return matchSearch && matchPlate && age >= 2 && age < 10;
      if (filterCategory === "eco") return matchSearch && matchPlate && age >= 10;
      return matchSearch && matchPlate;
    })
    .sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      if (sortConfig.key === "owner.name") {
        valueA = a.owner.name;
        valueB = b.owner.name;
      } else {
        valueA = (a as Record<string, unknown>)[sortConfig.key] as string | number;
        valueB = (b as Record<string, unknown>)[sortConfig.key] as string | number;
      }

      if (valueA < valueB) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
  const paginatedCars = filteredCars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedCarId(null);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
    setExpandedCarId(null);
  };

  const toggleCarDetails = (id: number) => {
    setExpandedCarId(expandedCarId === id ? null : id);
  };

  // Stats
  const stats = {
    total: cars.length,
    eco: cars.filter((car) => new Date().getFullYear() - car.year >= 10).length,
    comfort: cars.filter((car) => {
      const age = new Date().getFullYear() - car.year;
      return age >= 2 && age < 10;
    }).length,
    comfortPlus: cars.filter((car) => new Date().getFullYear() - car.year < 2).length,
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
        title="Gestion des Vehicules"
        icon="mdi:car"
        count={filteredCars.length}
      />

      {/* Filtres par catégorie - Cards cliquables */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Tous */}
        <button
          onClick={() => setFilterCategory("all")}
          className={`relative p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 ${
            filterCategory === "all"
              ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg"
              : "border-gray-200 bg-white hover:border-yellow-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl transition-all duration-300 ${filterCategory === "all" ? "bg-yellow-400 shadow-md" : "bg-gray-100"}`}>
              <Icon icon="mdi:car-multiple" className={`text-2xl ${filterCategory === "all" ? "text-white" : "text-gray-600"}`} />
            </div>
            <div className="text-left">
              <p className={`text-2xl font-bold ${filterCategory === "all" ? "text-yellow-600" : "text-gray-800"}`}>
                {stats.total}
              </p>
              <p className="text-sm text-gray-500 font-medium">Tous</p>
            </div>
          </div>
          {filterCategory === "all" && (
            <div className="absolute top-2 right-2">
              <Icon icon="mdi:check-circle" className="text-yellow-500 text-xl" />
            </div>
          )}
        </button>

        {/* Eco */}
        <button
          onClick={() => setFilterCategory("eco")}
          className={`relative p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 ${
            filterCategory === "eco"
              ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-100 shadow-lg"
              : "border-gray-200 bg-white hover:border-green-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl transition-all duration-300 ${filterCategory === "eco" ? "bg-green-500 shadow-md" : "bg-green-100"}`}>
              <Icon icon="mdi:leaf" className={`text-2xl ${filterCategory === "eco" ? "text-white" : "text-green-600"}`} />
            </div>
            <div className="text-left">
              <p className={`text-2xl font-bold ${filterCategory === "eco" ? "text-green-600" : "text-gray-800"}`}>
                {stats.eco}
              </p>
              <p className="text-sm text-gray-500 font-medium">Eco</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-400">10+ ans</p>
          </div>
          {filterCategory === "eco" && (
            <div className="absolute top-2 right-2">
              <Icon icon="mdi:check-circle" className="text-green-500 text-xl" />
            </div>
          )}
        </button>

        {/* Confort */}
        <button
          onClick={() => setFilterCategory("comfort")}
          className={`relative p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 ${
            filterCategory === "comfort"
              ? "border-yellow-400 bg-gradient-to-br from-amber-50 to-yellow-100 shadow-lg"
              : "border-gray-200 bg-white hover:border-yellow-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl transition-all duration-300 ${filterCategory === "comfort" ? "bg-yellow-500 shadow-md" : "bg-yellow-100"}`}>
              <Icon icon="mdi:car-seat" className={`text-2xl ${filterCategory === "comfort" ? "text-white" : "text-yellow-600"}`} />
            </div>
            <div className="text-left">
              <p className={`text-2xl font-bold ${filterCategory === "comfort" ? "text-yellow-600" : "text-gray-800"}`}>
                {stats.comfort}
              </p>
              <p className="text-sm text-gray-500 font-medium">Confort</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-400">2-10 ans</p>
          </div>
          {filterCategory === "comfort" && (
            <div className="absolute top-2 right-2">
              <Icon icon="mdi:check-circle" className="text-yellow-500 text-xl" />
            </div>
          )}
        </button>

        {/* Confort+ */}
        <button
          onClick={() => setFilterCategory("comfort-plus")}
          className={`relative p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 ${
            filterCategory === "comfort-plus"
              ? "border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-100 shadow-lg"
              : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl transition-all duration-300 ${filterCategory === "comfort-plus" ? "bg-indigo-500 shadow-md" : "bg-indigo-100"}`}>
              <Icon icon="mdi:star-circle" className={`text-2xl ${filterCategory === "comfort-plus" ? "text-white" : "text-indigo-600"}`} />
            </div>
            <div className="text-left">
              <p className={`text-2xl font-bold ${filterCategory === "comfort-plus" ? "text-indigo-600" : "text-gray-800"}`}>
                {stats.comfortPlus}
              </p>
              <p className="text-sm text-gray-500 font-medium">Confort+</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-400">&lt; 2 ans</p>
          </div>
          {filterCategory === "comfort-plus" && (
            <div className="absolute top-2 right-2">
              <Icon icon="mdi:check-circle" className="text-indigo-500 text-xl" />
            </div>
          )}
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[200px] group">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher par marque, modele, immatriculation ou proprietaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
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
          <div className="relative min-w-[250px] group">
            <Icon icon="mdi:card-text-outline" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher par plaque..."
              value={plateSearch}
              onChange={(e) => setPlateSearch(e.target.value.toUpperCase())}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200 uppercase placeholder:normal-case"
            />
            {plateSearch && (
              <button
                onClick={() => setPlateSearch("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icon icon="mdi:close-circle" />
              </button>
            )}
          </div>
          {(filterCategory !== "all" || plateSearch) && (
            <button
              onClick={() => { setFilterCategory("all"); setPlateSearch(""); }}
              className="px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 flex items-center gap-2 transition-colors"
            >
              <Icon icon="mdi:close" />
              Effacer les filtres
            </button>
          )}
        </div>
        {plateSearch && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Icon icon="mdi:information-outline" className="text-yellow-500" />
            <span className="text-gray-600">
              {filteredCars.length} vehicule{filteredCars.length !== 1 ? "s" : ""} trouve{filteredCars.length !== 1 ? "s" : ""} pour la plaque <span className="font-bold text-yellow-700">&quot;{plateSearch}&quot;</span>
            </span>
          </div>
        )}
      </div>

      {/* Tableau */}
      <TableContainer>
        <table className="w-full">
          <TableHeader>
            <th
              className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort("id")}
            >
              <div className="flex items-center gap-1">
                ID {getSortIcon("id")}
              </div>
            </th>
            <th
              className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort("brand")}
            >
              <div className="flex items-center gap-1">
                Marque/Modele {getSortIcon("brand")}
              </div>
            </th>
            <th
              className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort("year")}
            >
              <div className="flex items-center gap-1">
                Annee {getSortIcon("year")}
              </div>
            </th>
            <TableHeaderCell>Categorie</TableHeaderCell>
            <TableHeaderCell>Immatriculation</TableHeaderCell>
            <th
              className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort("owner.name")}
            >
              <div className="flex items-center gap-1">
                Proprietaire {getSortIcon("owner.name")}
              </div>
            </th>
            <TableHeaderCell>Statut</TableHeaderCell>
            <TableHeaderCell>Disponibilite</TableHeaderCell>
            <TableHeaderCell className="text-center">Actions</TableHeaderCell>
          </TableHeader>
          <tbody>
            {paginatedCars.length > 0 ? (
              paginatedCars.map((car, index) => {
                const serviceCategory = getServiceCategory(car.year);
                const isExpanded = expandedCarId === car.id;

                return (
                  <>
                    <AnimatedTableRow
                      key={car.id}
                      index={index}
                      className={isExpanded ? "bg-yellow-50" : ""}
                    >
                      <TableCell>
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          #{car.id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Icon icon="mdi:car" className="text-xl text-gray-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{car.brand}</div>
                            <div className="text-gray-500 text-sm">{car.model}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{car.year}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${serviceCategory.bg} ${serviceCategory.color} border ${serviceCategory.border} shadow-sm`}>
                          <Icon icon={serviceCategory.icon} className="text-sm" />
                          {serviceCategory.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono font-medium px-2 py-1 rounded ${
                          plateSearch && car.licensePlateNumber.toLowerCase().includes(plateSearch.toLowerCase())
                            ? "bg-yellow-200 text-yellow-800 ring-2 ring-yellow-400"
                            : "bg-gray-100"
                        }`}>
                          {car.licensePlateNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(car.owner.name)}&background=FEF08A&color=713F12&bold=true`}
                            alt={car.owner.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-medium">{car.owner.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {car.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm">
                            <Icon icon="mdi:check-circle" className="text-sm" />
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200 shadow-sm">
                            <Icon icon="mdi:close-circle" className="text-sm" />
                            Inactif
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {car.isAvailable ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 border border-gray-200 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                            Indisponible
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => toggleCarDetails(car.id)}
                          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                            isExpanded
                              ? "bg-yellow-400 text-black shadow-md"
                              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          }`}
                        >
                          {isExpanded ? "Masquer" : "Details"}
                        </button>
                      </TableCell>
                    </AnimatedTableRow>
                    {isExpanded && (
                      <tr key={`${car.id}-details`} className="bg-gradient-to-r from-yellow-50 to-amber-50">
                        <td colSpan={9} className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-4 rounded-xl border border-yellow-200 shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <Icon icon="mdi:car-info" className="text-yellow-600 text-xl" />
                                <h4 className="font-semibold text-gray-900">Details du vehicule</h4>
                              </div>
                              <div className="text-sm space-y-2">
                                <p className="flex justify-between">
                                  <span className="text-gray-500">Couleur:</span>
                                  <span className="font-medium">{car.color || "Non specifie"}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-gray-500">N de licence:</span>
                                  <span className="font-medium">{car.licenseNumber}</span>
                                </p>
                              </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-yellow-200 shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <Icon icon="mdi:account" className="text-yellow-600 text-xl" />
                                <h4 className="font-semibold text-gray-900">Proprietaire</h4>
                              </div>
                              <div className="text-sm space-y-2">
                                <p className="flex justify-between">
                                  <span className="text-gray-500">Telephone:</span>
                                  <span className="font-medium">{car.owner.phone}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-gray-500">Email:</span>
                                  <span className="font-medium">{car.owner.email || "Non specifie"}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-gray-500">Matricule:</span>
                                  <span className="font-medium font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{car.owner.matricule}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-gray-500">Ville:</span>
                                  <span className="font-medium">{car.owner.address?.city}</span>
                                </p>
                              </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-yellow-200 shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <Icon icon="mdi:garage" className="text-yellow-600 text-xl" />
                                <h4 className="font-semibold text-gray-900">Affiliation Garage</h4>
                              </div>
                              <div className="text-sm space-y-2">
                                <p className="flex justify-between">
                                  <span className="text-gray-500">Nom:</span>
                                  <span className="font-medium">{car.owner.garageAffiliation?.name || "N/A"}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-gray-500">Adresse:</span>
                                  <span className="font-medium">{car.owner.garageAffiliation?.address || "N/A"}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-gray-500">Responsable:</span>
                                  <span className="font-medium">{car.owner.garageAffiliation?.responsiblePerson || "N/A"}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            ) : (
              <EmptyState
                icon="mdi:car-off"
                title="Aucun vehicule trouve"
                description="Les vehicules apparaitront ici une fois ajoutes"
              />
            )}
          </tbody>
        </table>

        {filteredCars.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCars.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </TableContainer>
    </div>
  );
}
