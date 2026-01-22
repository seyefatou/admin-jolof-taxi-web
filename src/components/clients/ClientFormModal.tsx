"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { ClientProps, CreateClientData, UpdateClientData } from "@/services/client-service";

type ClientFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClientData | UpdateClientData) => Promise<void>;
  client?: ClientProps | null;
  loading?: boolean;
};

export default function ClientFormModal({
  isOpen,
  onClose,
  onSubmit,
  client,
  loading = false,
}: ClientFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = !!client;

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        phone: client.phone || "",
        email: client.email || "",
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
      });
    }
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        ...(isEditMode && { matricule: client!.matricule }),
        name: formData.name,
        phone: formData.phone,
        ...(formData.email && { email: formData.email }),
      };

      await onSubmit(data as CreateClientData | UpdateClientData);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-yellow-300 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon
                  icon={isEditMode ? "mdi:account-edit" : "mdi:account-plus"}
                  className="text-2xl text-black"
                />
              </div>
              <h2 className="text-xl font-bold text-black">
                {isEditMode ? "Modifier le client" : "Ajouter un client"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Icon icon="mdi:close" className="text-xl text-black" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Icon
                icon="mdi:account"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Entrez le nom complet"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
              />
            </div>
          </div>

          {/* Telephone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telephone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Icon
                icon="mdi:phone"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+221 7X XXX XX XX"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Icon
                icon="mdi:email"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@email.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="flex-1 px-4 py-2.5 bg-yellow-300 text-black rounded-xl hover:bg-yellow-400 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                  Traitement...
                </>
              ) : (
                <>
                  <Icon icon={isEditMode ? "mdi:check" : "mdi:plus"} />
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
