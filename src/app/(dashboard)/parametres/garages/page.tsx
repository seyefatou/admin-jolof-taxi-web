"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_GARAGES, GaragesProps } from "@/services/garage-service";
import Pagination from "@/components/Pagination";
import dynamic from "next/dynamic";

// Import dynamique pour eviter les erreurs SSR avec Google Maps
const GarageMap = dynamic(() => import("@/components/GarageMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-xl">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
    </div>
  ),
});

export default function GaragesPage() {
  const [loading, setLoading] = useState(true);
  const [listGarages, setListGarages] = useState<GaragesProps[]>([]);
  const [modalCreate, setModalCreate] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "map">("table");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [matricule, setMatricule] = useState("");
  const [nomGarage, setNomGarage] = useState("");
  const [nomResponsable, setNomResponsable] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [city, setCity] = useState("Dakar");
  const [latitude, setLatitude] = useState(14.7494);
  const [longitude, setLongitude] = useState(-17.4599);

  const loadGarages = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_GARAGES.getAll();
      setListGarages(res.data);
    } catch (error) {
      toast.error("Erreur lors de la recuperation des garages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGarages();
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const resetForm = () => {
    setMatricule("");
    setNomGarage("");
    setNomResponsable("");
    setTelephone("");
    setAdresse("");
    setCity("Dakar");
    setLatitude(14.7494);
    setLongitude(-17.4599);
  };

  const handleCreate = () => {
    resetForm();
    setModalCreate(true);
  };

  const handleEdit = async (code: string) => {
    try {
      const res = await SERVICE_GARAGES.getOne(code);
      setMatricule(res.data.code);
      setNomGarage(res.data.name);
      setNomResponsable(res.data.responsiblePerson);
      setTelephone(res.data.phoneNumber.replace("+221", ""));
      setAdresse(res.data.address);
      setCity(res.data.city);
      setLatitude(res.data.latitude);
      setLongitude(res.data.longitude);
      setModalEdit(true);
    } catch (error) {
      toast.error("Erreur lors de la recuperation du garage");
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomGarage || !nomResponsable || !telephone || !adresse) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      setSubmitting(true);
      const phone = telephone.startsWith("+221") ? telephone : `+221${telephone}`;
      const res = await SERVICE_GARAGES.create(
        nomGarage,
        adresse,
        latitude,
        longitude,
        city,
        nomResponsable,
        true,
        phone
      );
      if (res.status === 201) {
        toast.success("Garage ajoute avec succes");
        setModalCreate(false);
        resetForm();
        loadGarages();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomGarage || !nomResponsable || !telephone || !adresse) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      setSubmitting(true);
      const phone = telephone.startsWith("+221") ? telephone : `+221${telephone}`;
      const res = await SERVICE_GARAGES.update(
        matricule,
        nomGarage,
        adresse,
        latitude,
        longitude,
        city,
        nomResponsable,
        true,
        phone
      );
      if (res.status === 200) {
        toast.success("Garage modifie avec succes");
        setModalEdit(false);
        resetForm();
        loadGarages();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter garages
  const filteredGarages = listGarages.filter(
    (garage) =>
      garage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      garage.responsiblePerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredGarages.length / itemsPerPage);
  const paginatedGarages = filteredGarages.slice(
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

  const renderModal = (isEdit: boolean) => {
    const title = isEdit ? "Modifier le Garage" : "Nouveau Garage";
    const submitHandler = isEdit ? submitEdit : submitCreate;
    const closeHandler = () => {
      isEdit ? setModalEdit(false) : setModalCreate(false);
      resetForm();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">{title}</h2>
            <form onSubmit={submitHandler}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom du garage</label>
                  <input
                    type="text"
                    value={nomGarage}
                    onChange={(e) => setNomGarage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                    placeholder="Nom du garage"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom du responsable</label>
                    <input
                      type="text"
                      value={nomResponsable}
                      onChange={(e) => setNomResponsable(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                      placeholder="Nom du responsable"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Telephone</label>
                    <div className="flex">
                      <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
                        +221
                      </span>
                      <input
                        type="text"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-yellow-300"
                        placeholder="77 123 45 67"
                        maxLength={9}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Adresse</label>
                  <input
                    type="text"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                    placeholder="Adresse du garage"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Region</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                      placeholder="Region"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={closeHandler}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
                >
                  {submitting ? "Chargement..." : isEdit ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
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
      {modalCreate && renderModal(false)}
      {modalEdit && renderModal(true)}

      <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl mb-6">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            <Icon icon="mdi:garage" className="inline mr-2" />
            Liste des Garages
            <span className="text-yellow-500 ml-2">({filteredGarages.length})</span>
          </h1>
          <div className="flex items-center gap-4">
            {/* Toggle Carte/Tableau */}
            <div className="flex bg-gray-100 border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === "map"
                    ? "bg-yellow-300 text-black"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Icon icon="mdi:map-marker-multiple" className="text-lg" />
                Carte
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === "table"
                    ? "bg-yellow-300 text-black"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Icon icon="mdi:format-list-bulleted" className="text-lg" />
                Tableau
              </button>
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-200"
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              <Icon icon="mdi:plus" className="inline mr-1" />
              Ajouter un garage
            </button>
          </div>
        </div>
      </div>

      {/* Vue Carte */}
      {viewMode === "map" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4">
          <GarageMap garages={filteredGarages} onEdit={handleEdit} />
        </div>
      )}

      {/* Vue Tableau */}
      {viewMode === "table" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Responsable</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Telephone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Adresse</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Region</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGarages.length > 0 ? (
                paginatedGarages.map((garage) => (
                  <tr key={garage.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{garage.name}</td>
                    <td className="px-4 py-3">{garage.responsiblePerson}</td>
                    <td className="px-4 py-3">{garage.phoneNumber}</td>
                    <td className="px-4 py-3">{garage.address}</td>
                    <td className="px-4 py-3">{garage.city}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          garage.status
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {garage.status ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEdit(garage.code)}
                        className="p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200"
                      >
                        <Icon icon="mdi:pencil" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-100">
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <Icon icon="mdi:garage-open" className="text-4xl mx-auto mb-2 text-gray-300" />
                    Aucun garage disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredGarages.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredGarages.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
