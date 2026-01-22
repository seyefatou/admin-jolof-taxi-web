"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_VEHICULES, VehiculeResp } from "@/services/vehicule-service";
import Pagination from "@/components/Pagination";

const getServiceCategory = (year: number) => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  if (age < 2) return { category: "Confort+", color: "text-indigo-600", bg: "bg-indigo-100" };
  if (age < 10) return { category: "Confort", color: "text-yellow-600", bg: "bg-yellow-100" };
  return { category: "Eco", color: "text-green-600", bg: "bg-green-100" };
};

type SortConfig = {
  key: string;
  direction: "ascending" | "descending";
};

export default function VehiculesPage() {
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState<VehiculeResp[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
  }, [searchTerm, filterCategory]);

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
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? (
      <Icon icon="mdi:chevron-up" className="text-lg" />
    ) : (
      <Icon icon="mdi:chevron-down" className="text-lg" />
    );
  };

  const filteredCars = cars
    .filter((car) => {
      const matchSearch =
        car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.licensePlateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.owner.name.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterCategory === "all") return matchSearch;

      const currentYear = new Date().getFullYear();
      const age = currentYear - car.year;
      if (filterCategory === "comfort-plus") return matchSearch && age < 2;
      if (filterCategory === "comfort") return matchSearch && age >= 2 && age < 10;
      if (filterCategory === "eco") return matchSearch && age >= 10;
      return matchSearch;
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

      <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl mb-6">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            <Icon icon="mdi:car" className="inline mr-2" />
            Gestion des Vehicules
            <span className="text-yellow-500 ml-2">({filteredCars.length})</span>
          </h1>
        </div>
      </div>

      {/* Filtres par catégorie - Cards cliquables */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Tous */}
        <button
          onClick={() => setFilterCategory("all")}
          className={`relative p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
            filterCategory === "all"
              ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg"
              : "border-gray-200 bg-white hover:border-yellow-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${filterCategory === "all" ? "bg-yellow-400" : "bg-gray-100"}`}>
              <Icon icon="mdi:car-multiple" className={`text-2xl ${filterCategory === "all" ? "text-white" : "text-gray-600"}`} />
            </div>
            <div className="text-left">
              <p className={`text-2xl font-bold ${filterCategory === "all" ? "text-yellow-600" : "text-gray-800"}`}>
                {cars.length}
              </p>
              <p className="text-sm text-gray-500">Tous</p>
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
          className={`relative p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
            filterCategory === "eco"
              ? "border-green-400 bg-gradient-to-br from-green-50 to-green-100 shadow-lg"
              : "border-gray-200 bg-white hover:border-green-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${filterCategory === "eco" ? "bg-green-500" : "bg-green-100"}`}>
              <Icon icon="mdi:leaf" className={`text-2xl ${filterCategory === "eco" ? "text-white" : "text-green-600"}`} />
            </div>
            <div className="text-left">
              <p className={`text-2xl font-bold ${filterCategory === "eco" ? "text-green-600" : "text-gray-800"}`}>
                {cars.filter((car) => new Date().getFullYear() - car.year >= 10).length}
              </p>
              <p className="text-sm text-gray-500">Eco</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-400">Vehicules 10+ ans</p>
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
          className={`relative p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
            filterCategory === "comfort"
              ? "border-yellow-400 bg-gradient-to-br from-amber-50 to-yellow-100 shadow-lg"
              : "border-gray-200 bg-white hover:border-yellow-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${filterCategory === "comfort" ? "bg-yellow-500" : "bg-yellow-100"}`}>
              <Icon icon="mdi:car-seat" className={`text-2xl ${filterCategory === "comfort" ? "text-white" : "text-yellow-600"}`} />
            </div>
            <div className="text-left">
              <p className={`text-2xl font-bold ${filterCategory === "comfort" ? "text-yellow-600" : "text-gray-800"}`}>
                {cars.filter((car) => {
                  const age = new Date().getFullYear() - car.year;
                  return age >= 2 && age < 10;
                }).length}
              </p>
              <p className="text-sm text-gray-500">Confort</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-400">Vehicules 2-10 ans</p>
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
          className={`relative p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
            filterCategory === "comfort-plus"
              ? "border-indigo-400 bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-lg"
              : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${filterCategory === "comfort-plus" ? "bg-indigo-500" : "bg-indigo-100"}`}>
              <Icon icon="mdi:star-circle" className={`text-2xl ${filterCategory === "comfort-plus" ? "text-white" : "text-indigo-600"}`} />
            </div>
            <div className="text-left">
              <p className={`text-2xl font-bold ${filterCategory === "comfort-plus" ? "text-indigo-600" : "text-gray-800"}`}>
                {cars.filter((car) => new Date().getFullYear() - car.year < 2).length}
              </p>
              <p className="text-sm text-gray-500">Confort+</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-400">Vehicules &lt; 2 ans</p>
          </div>
          {filterCategory === "comfort-plus" && (
            <div className="absolute top-2 right-2">
              <Icon icon="mdi:check-circle" className="text-indigo-500 text-xl" />
            </div>
          )}
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white border border-gray-200 rounded-t-xl shadow-md p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par marque, modele, immatriculation ou proprietaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
            />
          </div>
          {filterCategory !== "all" && (
            <button
              onClick={() => setFilterCategory("all")}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Icon icon="mdi:close" />
              Effacer le filtre
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-t-0 border-gray-200 shadow-md overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center gap-1">
                  ID {getSortIcon("id")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("brand")}
              >
                <div className="flex items-center gap-1">
                  Marque/Modele {getSortIcon("brand")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("year")}
              >
                <div className="flex items-center gap-1">
                  Annee {getSortIcon("year")}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categorie</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Immatriculation</th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("owner.name")}
              >
                <div className="flex items-center gap-1">
                  Proprietaire {getSortIcon("owner.name")}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Disponibilite</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCars.length > 0 ? (
              paginatedCars.map((car) => {
                const serviceCategory = getServiceCategory(car.year);
                const isExpanded = expandedCarId === car.id;

                return (
                  <>
                    <tr key={car.id} className={`border-t border-gray-100 hover:bg-gray-50 ${isExpanded ? "bg-yellow-50" : ""}`}>
                      <td className="px-4 py-3 font-medium">{car.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{car.brand}</div>
                        <div className="text-gray-500 text-sm">{car.model}</div>
                      </td>
                      <td className="px-4 py-3">{car.year}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${serviceCategory.bg} ${serviceCategory.color}`}>
                          {serviceCategory.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">{car.licensePlateNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-600 font-medium">
                            {car.owner.name.charAt(0)}
                          </div>
                          <span>{car.owner.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          car.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {car.status === "ACTIVE" ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          car.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {car.isAvailable ? "Disponible" : "Indisponible"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleCarDetails(car.id)}
                          className="text-yellow-600 hover:text-yellow-800 font-medium"
                        >
                          {isExpanded ? "Masquer" : "Details"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${car.id}-details`}>
                        <td colSpan={9} className="px-6 py-4 bg-yellow-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Details du vehicule</h4>
                              <div className="text-sm space-y-1">
                                <p><span className="text-gray-500">Couleur:</span> {car.color || "Non specifie"}</p>
                                <p><span className="text-gray-500">N de licence:</span> {car.licenseNumber}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Proprietaire</h4>
                              <div className="text-sm space-y-1">
                                <p><span className="text-gray-500">Telephone:</span> {car.owner.phone}</p>
                                <p><span className="text-gray-500">Email:</span> {car.owner.email || "Non specifie"}</p>
                                <p><span className="text-gray-500">Matricule:</span> {car.owner.matricule}</p>
                                <p><span className="text-gray-500">Ville:</span> {car.owner.address?.city}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Affiliation Garage</h4>
                              <div className="text-sm space-y-1">
                                <p><span className="text-gray-500">Nom:</span> {car.owner.garageAffiliation?.name || "N/A"}</p>
                                <p><span className="text-gray-500">Adresse:</span> {car.owner.garageAffiliation?.address || "N/A"}</p>
                                <p><span className="text-gray-500">Responsable:</span> {car.owner.garageAffiliation?.responsiblePerson || "N/A"}</p>
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
              <tr className="border-t border-gray-100">
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  <Icon icon="mdi:car-off" className="text-4xl mx-auto mb-2 text-gray-300" />
                  Aucun vehicule trouve
                </td>
              </tr>
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
      </div>
    </div>
  );
}
