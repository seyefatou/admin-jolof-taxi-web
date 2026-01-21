"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_PAIEMENT, PaiementProps } from "@/services/paiement-service";

export default function PaiementsPage() {
  const [loading, setLoading] = useState(true);
  const [paiements, setPaiements] = useState<PaiementProps[]>([]);
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [nomPaiement, setNomPaiement] = useState("");
  const [editId, setEditId] = useState<number>(0);
  const [editStatus, setEditStatus] = useState(true);

  const loadPaiements = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_PAIEMENT.getAll();
      setPaiements(res.data);
    } catch (error) {
      toast.error("Erreur lors de la recuperation des paiements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaiements();
  }, []);

  const resetForm = () => {
    setNomPaiement("");
    setEditId(0);
    setEditStatus(true);
  };

  const handleAdd = () => {
    resetForm();
    setModalAdd(true);
  };

  const handleEdit = (paiement: PaiementProps) => {
    setNomPaiement(paiement.name);
    setEditId(paiement.id);
    setEditStatus(paiement.status);
    setModalEdit(true);
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomPaiement) {
      toast.error("Veuillez remplir le nom du mode de paiement");
      return;
    }

    try {
      setSubmitting(true);
      const res = await SERVICE_PAIEMENT.create(nomPaiement);
      if (res.status === 201) {
        toast.success("Mode de paiement ajoute avec succes");
        setModalAdd(false);
        resetForm();
        loadPaiements();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomPaiement) {
      toast.error("Veuillez remplir le nom du mode de paiement");
      return;
    }

    try {
      setSubmitting(true);
      const res = await SERVICE_PAIEMENT.update(nomPaiement, editId, editStatus);
      if (res.status === 200) {
        toast.success("Mode de paiement modifie avec succes");
        setModalEdit(false);
        resetForm();
        loadPaiements();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const renderModal = (isEdit: boolean) => {
    const title = isEdit ? "Modifier le mode de paiement" : "Ajouter un nouveau mode de paiement";
    const submitHandler = isEdit ? submitEdit : submitAdd;
    const closeHandler = () => {
      isEdit ? setModalEdit(false) : setModalAdd(false);
      resetForm();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">{title}</h2>
            <form onSubmit={submitHandler}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom du mode de paiement</label>
                  <input
                    type="text"
                    value={nomPaiement}
                    onChange={(e) => setNomPaiement(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                    placeholder="Ex: Orange Money, Wave, etc."
                  />
                </div>
                {isEdit && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Statut</label>
                    <select
                      value={editStatus ? "true" : "false"}
                      onChange={(e) => setEditStatus(e.target.value === "true")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                    >
                      <option value="true">Actif</option>
                      <option value="false">Inactif</option>
                    </select>
                  </div>
                )}
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
      {modalAdd && renderModal(false)}
      {modalEdit && renderModal(true)}

      <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl mb-6">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            <Icon icon="mdi:credit-card" className="inline mr-2" />
            Modes de Paiement
          </h1>
        </div>
      </div>

      <div
        onClick={handleAdd}
        className="flex items-center justify-center gap-2 px-5 py-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-xl cursor-pointer hover:bg-yellow-100 transition-colors"
      >
        <span className="text-gray-700">Ajouter un nouveau mode de paiement</span>
        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full font-bold">+</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paiements.length > 0 ? (
          paiements.map((paiement) => (
            <div
              key={paiement.id}
              className="bg-white border border-gray-200 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:credit-card-outline" className="text-2xl text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{paiement.name}</h3>
                    <span
                      className={`text-xs font-medium ${
                        paiement.status ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {paiement.status ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(paiement)}
                  className="p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200"
                >
                  <Icon icon="mdi:pencil" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Icon icon="mdi:credit-card-off" className="text-6xl mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Aucun mode de paiement disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}
