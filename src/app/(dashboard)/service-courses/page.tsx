"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_VEHICULES, VehiculeTypeResp } from "@/services/vehicule-service";

type Tarif = {
  minKm: number;
  maxKm: number;
  pricePerKm: number;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price);
};

export default function ServiceCoursesPage() {
  const [loading, setLoading] = useState(true);
  const [listServices, setListServices] = useState<VehiculeTypeResp[]>([]);
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [nom, setNom] = useState("");
  const [priceKm, setPriceKm] = useState("");
  const [priceRate, setPriceRate] = useState("");
  const [priceMn, setPriceMn] = useState("");
  const [img, setImg] = useState<File | null>(null);
  const [imgEdit, setImgEdit] = useState<File | string | null>(null);
  const [idEdit, setIdEdit] = useState<number>(0);
  const [statusEdit, setStatusEdit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tarifs, setTarifs] = useState<Tarif[]>([
    { minKm: 0, maxKm: 10, pricePerKm: 140 },
  ]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_VEHICULES.getTypeList();
      if (res.status === 200) {
        setListServices(res.data);
      }
    } catch (error) {
      toast.error("Erreur lors de la recuperation des services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const resetForm = () => {
    setNom("");
    setPriceKm("");
    setPriceRate("");
    setPriceMn("");
    setImg(null);
    setImgEdit(null);
    setStatusEdit(true);
    setIdEdit(0);
    setTarifs([{ minKm: 0, maxKm: 10, pricePerKm: 140 }]);
  };

  const handleModalOpenAdd = () => {
    resetForm();
    setModalAdd(true);
  };

  const handleModalCloseAdd = () => {
    resetForm();
    setModalAdd(false);
  };

  const handleModalCloseEdit = () => {
    resetForm();
    setModalEdit(false);
  };

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImg(file);
      setImgEdit(file);
    }
  };

  const deleteImage = () => {
    setImg(null);
    setImgEdit(null);
  };

  const handleEditService = async (id: number) => {
    try {
      const res = await SERVICE_VEHICULES.getTypeOne(id);
      if (res.status === 200) {
        setNom(res.data.type);
        setPriceKm(String(res.data.priceKm || 0));
        setPriceRate(res.data.ratePrice.toString());
        setPriceMn(res.data.priceMn.toString());
        setImgEdit(res.data.image);
        setStatusEdit(res.data.status);
        setTarifs(res.data.tarifs || [{ minKm: 0, maxKm: 10, pricePerKm: 140 }]);
        setIdEdit(id);
        setModalEdit(true);
      }
    } catch (error) {
      toast.error("Erreur lors de la recuperation du service");
    }
  };

  const handleAddTarif = () => {
    const lastTarif = tarifs[tarifs.length - 1];
    setTarifs([
      ...tarifs,
      {
        minKm: lastTarif?.maxKm || 0,
        maxKm: (lastTarif?.maxKm || 0) + 10,
        pricePerKm: lastTarif?.pricePerKm || 140,
      },
    ]);
  };

  const handleRemoveTarif = (index: number) => {
    if (tarifs.length > 1) {
      setTarifs(tarifs.filter((_, i) => i !== index));
    } else {
      toast.warning("Vous devez avoir au moins une plage tarifaire");
    }
  };

  const handleTarifChange = (index: number, field: keyof Tarif, value: number) => {
    const newTarifs = [...tarifs];
    newTarifs[index][field] = value;
    setTarifs(newTarifs);
  };

  const handleNumericInput = (value: string) => {
    return value.replace(/\D/g, "");
  };

  const updateServiceStatus = async (id: number) => {
    try {
      const res = await SERVICE_VEHICULES.updateTypeStatus(id);
      if (res) {
        loadServices();
        toast.info("Statut du service mis a jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise a jour du statut");
    }
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !priceRate || !priceMn) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const formData = new FormData();
    formData.append("type", nom);
    formData.append("ratePrice", priceRate);
    formData.append("priceMn", priceMn);
    tarifs.forEach((tarif, index) => {
      formData.append(`tarifs[${index}][minKm]`, String(tarif.minKm));
      formData.append(`tarifs[${index}][maxKm]`, String(tarif.maxKm));
      formData.append(`tarifs[${index}][pricePerKm]`, String(tarif.pricePerKm));
    });
    if (img) formData.append("image", img);

    try {
      setSubmitting(true);
      const res = await SERVICE_VEHICULES.createType(formData);
      if (res.status === 201) {
        toast.success("Service ajoute avec succes");
        handleModalCloseAdd();
        loadServices();
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout du service");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !priceRate || !priceMn) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const formData = new FormData();
    formData.append("type", nom);
    formData.append("priceKm", priceKm);
    formData.append("ratePrice", priceRate);
    formData.append("priceMn", priceMn);
    formData.append("status", String(statusEdit));
    formData.append("tarifs", JSON.stringify(tarifs));
    if (imgEdit && typeof imgEdit !== "string") {
      formData.append("image", imgEdit);
    }

    try {
      setSubmitting(true);
      const res = await SERVICE_VEHICULES.updateType(formData, idEdit);
      if (res.status === 200) {
        toast.success("Service modifie avec succes");
        handleModalCloseEdit();
        loadServices();
      }
    } catch (error) {
      toast.error("Erreur lors de la modification du service");
    } finally {
      setSubmitting(false);
    }
  };

  const renderModal = (isEdit: boolean) => {
    const modalTitle = isEdit ? `Modification du service ${nom}` : "Ajouter un nouveau service";
    const submitHandler = isEdit ? submitEdit : submitAdd;
    const closeHandler = isEdit ? handleModalCloseEdit : handleModalCloseAdd;
    const buttonText = isEdit ? "Modifier" : "Ajouter";
    const currentImage = isEdit ? imgEdit : img;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto m-4">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">{modalTitle}</h2>
            <form onSubmit={submitHandler}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Colonne 1 - Informations de base */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom du service</label>
                    <input
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                      placeholder="Nom du service"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Prix moyen du Tarif (CFA)</label>
                    <input
                      type="text"
                      value={priceRate}
                      onChange={(e) => setPriceRate(handleNumericInput(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                      placeholder="Prix du Tarif"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Prix par minute (CFA)</label>
                    <input
                      type="text"
                      value={priceMn}
                      onChange={(e) => setPriceMn(handleNumericInput(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                      placeholder="Prix par minute"
                    />
                  </div>

                  {/* Zone d'upload d'image */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Image du service</label>
                    <label
                      htmlFor="dropzone-file"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer border-gray-300 bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Icon icon="mdi:cloud-upload" className="text-3xl text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Cliquer pour telecharger</span>
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG (MAX. 800x400px)</p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImgChange}
                      />
                    </label>
                  </div>

                  {/* Apercu de l'image */}
                  {currentImage && (
                    <div className="relative">
                      <div className="bg-yellow-100 rounded-lg p-4 flex items-center justify-center h-32">
                        <img
                          src={typeof currentImage === "string" ? currentImage : URL.createObjectURL(currentImage)}
                          alt="Apercu"
                          className="max-h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={deleteImage}
                        className="mt-2 w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                      >
                        <Icon icon="mdi:delete" />
                        Supprimer l'image
                      </button>
                    </div>
                  )}
                </div>

                {/* Colonne 2-3 - Tarifs par plage de km */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Tarifs par plage de kilometres</label>
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {tarifs.map((tarif, index) => (
                        <div key={index} className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">De (km)</label>
                            <input
                              type="number"
                              value={tarif.minKm}
                              onChange={(e) => handleTarifChange(index, "minKm", parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">A (km)</label>
                            <input
                              type="number"
                              value={tarif.maxKm}
                              onChange={(e) => handleTarifChange(index, "maxKm", parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Prix/km (CFA)</label>
                            <input
                              type="number"
                              value={tarif.pricePerKm}
                              onChange={(e) => handleTarifChange(index, "pricePerKm", parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveTarif(index)}
                              className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-1"
                            >
                              <Icon icon="mdi:delete" />
                              Suppr.
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTarif}
                      className="w-full py-2 mt-4 bg-yellow-300 text-black rounded-lg hover:bg-yellow-400 font-medium"
                    >
                      + Ajouter une plage tarifaire
                    </button>
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
                  {submitting ? "Chargement..." : buttonText}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Composant carte de service (style APK)
  const ServiceCard = ({ service }: { service: VehiculeTypeResp }) => {
    return (
      <div className="relative p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-3xl overflow-hidden shadow-lg">
        {/* Effets de fond */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-gray-500/5 to-transparent z-0"></div>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-yellow-400/10 blur-3xl"></div>

        {/* Badge type de service */}
        <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-300 to-yellow-400 px-4 py-1 rounded-full z-20 shadow">
          <span className="text-sm font-bold text-black">Service {service.type}</span>
        </div>

        {/* Badge statut + Toggle */}
        <div className="absolute top-4 right-4 flex items-center gap-3 z-20">
          <div className={`px-4 py-1 rounded-full shadow ${service.status ? "bg-green-500" : "bg-red-500"}`}>
            <span className="text-sm font-medium text-white flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${service.status ? "bg-white" : "bg-red-200"}`}></span>
              {service.status ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>

        {/* Toggle switch */}
        <div className="absolute top-16 right-4 z-20">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={service.status}
              onChange={() => updateServiceStatus(service.id)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-yellow-300 peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mt-12">
          {/* Prix par minute */}
          <div className="p-4">
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-105">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2">
                Prix par minute
              </h3>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-yellow-500">
                  {formatPrice(service.priceMn)}
                </span>
                <span className="ml-1 text-sm text-gray-500">FCFA/min</span>
              </div>
            </div>
          </div>

          {/* Image du vehicule */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-xs">
              <img
                src={service.image || "/taxi.png"}
                alt={service.type}
                className="w-full h-auto transform transition-all duration-500 hover:scale-110 drop-shadow-xl"
              />
            </div>
          </div>

          {/* Bouton modifier */}
          <div className="p-4 flex justify-end items-start">
            <button
              onClick={() => handleEditService(service.id)}
              className="bg-white backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-100 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-gray-600 font-medium">Modifier</span>
              <Icon icon="mdi:pencil" className="text-yellow-500 text-xl" />
            </button>
          </div>
        </div>

        {/* Prix de base */}
        <div className="relative z-10 mt-8 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100 max-w-md mx-auto transform transition-all duration-300 hover:scale-105">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Prix de base</h3>
            <div className="flex items-baseline justify-center">
              <span className="text-5xl font-bold text-yellow-500">
                {formatPrice(service.ratePrice)}
              </span>
              <span className="ml-2 text-lg text-gray-500">FCFA</span>
            </div>
          </div>
        </div>

        {/* Grille tarifaire */}
        {service.tarifs && service.tarifs.length > 0 && (
          <div className="mt-8 relative z-10">
            <h3 className="mb-6 text-2xl font-bold text-center text-gray-700">Grille Tarifaire</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {service.tarifs.map((tarif, index) => (
                <div
                  key={index}
                  className="relative bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute top-0 right-0 bg-yellow-400 text-xs text-white font-bold px-2 py-1 rounded-bl-lg rounded-tr-2xl">
                    Zone {index + 1}
                  </div>

                  <h4 className="text-sm font-medium text-gray-500 mb-2">Distance</h4>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <span className="text-xs text-gray-400">Min</span>
                      <p className="text-lg font-bold text-gray-700">{tarif.minKm} km</p>
                    </div>
                    <Icon icon="mdi:arrow-right" className="text-gray-400" />
                    <div className="text-center">
                      <span className="text-xs text-gray-400">Max</span>
                      <p className="text-lg font-bold text-gray-700">{tarif.maxKm} km</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Prix par km</h4>
                    <p className="text-2xl font-bold text-yellow-500">
                      {formatPrice(tarif.pricePerKm)}
                      <span className="text-xs text-gray-500 ml-1">FCFA</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
      {modalAdd && renderModal(false)}
      {modalEdit && renderModal(true)}

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Services</h1>
          <button
            onClick={handleModalOpenAdd}
            className="px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
          >
            <Icon icon="mdi:plus" />
            Nouveau service
          </button>
        </div>
      </div>

      {/* Liste des services en cartes */}
      {listServices.length > 0 ? (
        <div className="space-y-8">
          {listServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Icon icon="mdi:car-off" className="text-6xl mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">Aucun service disponible</p>
          <button
            onClick={handleModalOpenAdd}
            className="mt-4 px-6 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400"
          >
            Ajouter un service
          </button>
        </div>
      )}
    </div>
  );
}
