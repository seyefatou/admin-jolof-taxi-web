"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { VehiculeResp } from "@/services/vehicule-service";

type VehiculeFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<VehiculeResp>) => Promise<void>;
  vehicule?: VehiculeResp | null;
  loading?: boolean;
};

export default function VehiculeFormModal({
  isOpen,
  onClose,
  onSubmit,
  vehicule,
  loading = false,
}: VehiculeFormModalProps) {
  const isEditMode = !!vehicule;

  // Form data state
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: "",
    licensePlateNumber: "",
    licenseNumber: "",
    color: "",
    status: "ACTIVE",
    isAvailable: true,
    category: "Confort", // Valeur par défaut
  });

  const [submitting, setSubmitting] = useState(false);

  // Reset form or populate with vehicule data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (vehicule) {
        // Mode edition: pre-remplir avec les donnees existantes
        setFormData({
          brand: vehicule.brand || "",
          model: vehicule.model || "",
          year: vehicule.year?.toString() || "",
          licensePlateNumber: vehicule.licensePlateNumber || "",
          licenseNumber: vehicule.licenseNumber || "",
          color: vehicule.color || "",
          status: vehicule.status || "ACTIVE",
          isAvailable: vehicule.isAvailable ?? true,
          category: vehicule.category || "Confort",
        });
      } else {
        // Mode creation: reinitialiser le formulaire
        setFormData({
          brand: "",
          model: "",
          year: "",
          licensePlateNumber: "",
          licenseNumber: "",
          color: "",
          status: "ACTIVE",
          isAvailable: true,
          category: "Confort",
        });
      }
    }
  }, [isOpen, vehicule]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation basique
    if (!formData.brand.trim() || !formData.model.trim() || !formData.year || !formData.licensePlateNumber.trim() || !formData.category) {
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        year: parseInt(formData.year),
        licensePlateNumber: formData.licensePlateNumber.toUpperCase(),
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icon icon="mdi:car-edit" className="text-2xl text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {isEditMode ? "Modifier le véhicule" : "Ajouter un véhicule"}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditMode ? "Modifiez les informations du véhicule" : "Remplissez les informations du nouveau véhicule"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon icon="mdi:close" className="text-xl text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marque *
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all"
                placeholder="Ex: Toyota"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle *
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all"
                placeholder="Ex: Corolla"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all"
                placeholder="Ex: 2020"
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all"
                required
              >
                <option value="Eco">Eco</option>
                <option value="Confort">Confort</option>
                <option value="Confort+">Confort+</option>
              </select>
            </div>
          </div>

          {/* Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Immatriculation *
              </label>
              <input
                type="text"
                value={formData.licensePlateNumber}
                onChange={(e) => handleInputChange("licensePlateNumber", e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all uppercase"
                placeholder="Ex: DK-1234-AB"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de licence
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all"
                placeholder="Ex: 123456789"
              />
            </div>
          </div>

          {/* Statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all"
              >
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disponibilité
              </label>
              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={() => handleInputChange("isAvailable", true)}
                    className="text-yellow-500 focus:ring-yellow-200"
                  />
                  <span className="text-sm text-gray-700">Disponible</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isAvailable"
                    checked={!formData.isAvailable}
                    onChange={() => handleInputChange("isAvailable", false)}
                    className="text-yellow-500 focus:ring-yellow-200"
                  />
                  <span className="text-sm text-gray-700">Indisponible</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Icon icon="mdi:content-save" />
                  {isEditMode ? "Modifier" : "Ajouter"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}