"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmModal from "@/components/ConfirmModal";
import { SERVICE_CHAUFFEUR, ChauffeurProps } from "@/services/chauffeur-service";
import { SERVICE_DOCUMENT, DriverDocument, DocumentType } from "@/services/document-service";

export default function ChauffeurDetails() {
  const params = useParams();
  const router = useRouter();
  const matricule = decodeURIComponent(params.matricule as string);

  const [loading, setLoading] = useState(true);
  const [chauffeur, setChauffeur] = useState<ChauffeurProps | null>(null);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "documents" | "wallet">("info");

  // Document upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    documentTypeId: "",
    file: null as File | null,
    expiryDate: "",
  });
  const [uploading, setUploading] = useState(false);

  // Confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | "delete";
    document: DriverDocument;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger le chauffeur en premier (obligatoire)
      const chauffeurRes = await SERVICE_CHAUFFEUR.getOne(matricule);
      console.log("Chauffeur response:", chauffeurRes);

      if (chauffeurRes.status === 200) {
        setChauffeur(chauffeurRes.data);
      } else {
        toast.error(chauffeurRes.message || "Chauffeur non trouve");
        return;
      }

      // Charger documents et types (optionnel - ne pas bloquer si erreur)
      try {
        const [documentsRes, typesRes] = await Promise.all([
          SERVICE_DOCUMENT.getDriverDocuments(matricule),
          SERVICE_DOCUMENT.getDocumentTypes(),
        ]);
        setDocuments(documentsRes.data || []);
        setDocumentTypes(typesRes.data || []);
      } catch (docError) {
        console.log("Documents non disponibles:", docError);
        // Ne pas afficher d'erreur, les documents sont optionnels
      }
    } catch (error: unknown) {
      console.error("Erreur chargement chauffeur:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Erreur lors du chargement des donnees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (matricule) {
      loadData();
    }
  }, [matricule]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.documentTypeId) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    setUploading(true);
    try {
      const res = await SERVICE_DOCUMENT.addDocument({
        driverMatricule: matricule,
        documentTypeId: parseInt(uploadData.documentTypeId),
        file: uploadData.file,
        expiryDate: uploadData.expiryDate || undefined,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success("Document ajoute avec succes");
        setShowUploadModal(false);
        setUploadData({ documentTypeId: "", file: null, expiryDate: "" });
        loadData();
      } else {
        toast.error(res.message || "Erreur lors de l'ajout du document");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout du document");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentAction = (type: "approve" | "reject" | "delete", document: DriverDocument) => {
    setConfirmAction({ type, document });
    setShowConfirmModal(true);
  };

  const executeDocumentAction = async () => {
    if (!confirmAction) return;

    setActionLoading(true);
    try {
      let res;
      const { type, document } = confirmAction;

      switch (type) {
        case "approve":
          res = await SERVICE_DOCUMENT.approveDocument(document.id);
          break;
        case "reject":
          if (!rejectionReason.trim()) {
            toast.error("Veuillez indiquer une raison de rejet");
            setActionLoading(false);
            return;
          }
          res = await SERVICE_DOCUMENT.rejectDocument(document.id, rejectionReason);
          break;
        case "delete":
          res = await SERVICE_DOCUMENT.deleteDocument(document.id);
          break;
      }

      if (res.status === 200 || res.status === 201) {
        const messages = {
          approve: "Document approuve avec succes",
          reject: "Document rejete",
          delete: "Document supprime",
        };
        toast.success(messages[type]);
        setShowConfirmModal(false);
        setConfirmAction(null);
        setRejectionReason("");
        loadData();
      } else {
        toast.error(res.message || "Erreur lors de l'operation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'operation");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      ACTIVE: { bg: "bg-green-100", text: "text-green-700", label: "Actif" },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En attente" },
      DEACTIVATED: { bg: "bg-gray-100", text: "text-gray-700", label: "Desactive" },
      BANNED: { bg: "bg-red-100", text: "text-red-700", label: "Banni" },
    };
    const c = config[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const getDocumentStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En attente" },
      APPROVED: { bg: "bg-green-100", text: "text-green-700", label: "Approuve" },
      REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Rejete" },
    };
    const c = config[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  if (!chauffeur) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:account-off" className="text-6xl mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-600">Chauffeur non trouve</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-yellow-300 text-black rounded-lg hover:bg-yellow-400"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md mb-6">
        <div className="p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <Icon icon="mdi:arrow-left" />
            Retour a la liste
          </button>

          <div className="flex items-start gap-6">
            <div className="relative">
              {chauffeur.avatar ? (
                <img
                  src={chauffeur.avatar}
                  alt={chauffeur.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-yellow-300"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-600 text-3xl font-bold border-4 border-yellow-300">
                  {chauffeur.name?.charAt(0) || "?"}
                </div>
              )}
              {chauffeur.isOnline && (
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full"></div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{chauffeur.name}</h1>
                {getStatusBadge(chauffeur.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Matricule</p>
                  <p className="font-medium">{chauffeur.matricule}</p>
                </div>
                <div>
                  <p className="text-gray-500">Telephone</p>
                  <p className="font-medium">{chauffeur.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{chauffeur.email || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Note</p>
                  <p className="font-medium flex items-center gap-1">
                    <Icon icon="mdi:star" className="text-yellow-500" />
                    {chauffeur.rating > 0 ? chauffeur.rating.toFixed(1) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "info"
                  ? "border-yellow-400 text-yellow-600 bg-yellow-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon icon="mdi:information" className="inline mr-2" />
              Informations
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "documents"
                  ? "border-yellow-400 text-yellow-600 bg-yellow-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon icon="mdi:file-document-multiple" className="inline mr-2" />
              Documents ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "wallet"
                  ? "border-yellow-400 text-yellow-600 bg-yellow-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon icon="mdi:wallet" className="inline mr-2" />
              Portefeuille
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vehicule */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:car" className="text-yellow-500" />
              Vehicule
            </h3>
            {chauffeur.vehicule ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Marque/Modele</span>
                  <span className="font-medium">{chauffeur.vehicule.brand} {chauffeur.vehicule.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Annee</span>
                  <span className="font-medium">{chauffeur.vehicule.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Immatriculation</span>
                  <span className="font-medium">{chauffeur.vehicule.licensePlateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Couleur</span>
                  <span className="font-medium">{chauffeur.vehicule.color || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    chauffeur.vehicule.isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {chauffeur.vehicule.isAvailable ? "Disponible" : "Indisponible"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic">Aucun vehicule assigne</p>
            )}
          </div>

          {/* Garage */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:garage" className="text-yellow-500" />
              Garage
            </h3>
            {chauffeur.garageAffiliation ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium">{chauffeur.garageAffiliation.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Code</span>
                  <span className="font-medium">{chauffeur.garageAffiliation.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Adresse</span>
                  <span className="font-medium">{chauffeur.garageAffiliation.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ville</span>
                  <span className="font-medium">{chauffeur.garageAffiliation.city}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic">Aucun garage affilie</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Icon icon="mdi:file-document-multiple" className="text-yellow-500" />
              Documents du chauffeur
            </h3>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 flex items-center gap-2"
            >
              <Icon icon="mdi:plus" />
              Ajouter un document
            </button>
          </div>

          {documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-yellow-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:file-document" className="text-2xl text-yellow-500" />
                      <div>
                        <p className="font-medium text-sm">{doc.documentType.name}</p>
                        <p className="text-xs text-gray-400">{doc.documentType.code}</p>
                      </div>
                    </div>
                    {getDocumentStatusBadge(doc.status)}
                  </div>

                  {doc.expiryDate && (
                    <p className="text-xs text-gray-500 mb-2">
                      Expire le: {new Date(doc.expiryDate).toLocaleDateString()}
                    </p>
                  )}

                  {doc.rejectionReason && (
                    <p className="text-xs text-red-500 mb-2">
                      Raison: {doc.rejectionReason}
                    </p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <a
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"
                    >
                      <Icon icon="mdi:eye" />
                      Voir
                    </a>

                    {doc.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleDocumentAction("approve", doc)}
                          className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1"
                        >
                          <Icon icon="mdi:check" />
                        </button>
                        <button
                          onClick={() => handleDocumentAction("reject", doc)}
                          className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1"
                        >
                          <Icon icon="mdi:close" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDocumentAction("delete", doc)}
                      className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1"
                    >
                      <Icon icon="mdi:delete" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="mdi:file-document-outline" className="text-6xl mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Aucun document</p>
              <p className="text-sm text-gray-400">Ajoutez des documents pour ce chauffeur</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon="mdi:wallet" className="text-yellow-500" />
            Portefeuille
          </h3>
          {chauffeur.wallet ? (
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-xl p-6 text-black">
              <p className="text-sm opacity-80">Solde actuel</p>
              <p className="text-4xl font-bold">{chauffeur.wallet.balance} FCFA</p>
              <p className="text-xs opacity-70 mt-2">ID: {chauffeur.wallet.id}</p>
            </div>
          ) : (
            <p className="text-gray-400 italic">Aucun portefeuille configure</p>
          )}
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowUploadModal(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-yellow-300 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-black">Ajouter un document</h2>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <Icon icon="mdi:close" className="text-xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUploadDocument} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de document <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={uploadData.documentTypeId}
                  onChange={(e) => setUploadData({ ...uploadData, documentTypeId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                >
                  <option value="">Selectionner un type</option>
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} {type.isRequired && "(Requis)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fichier <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'expiration
                </label>
                <input
                  type="date"
                  value={uploadData.expiryDate}
                  onChange={(e) => setUploadData({ ...uploadData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 bg-yellow-300 text-black rounded-xl hover:bg-yellow-400 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:upload" />
                      Ajouter
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal for document actions */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmModal(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                confirmAction.type === "approve" ? "bg-green-100" :
                confirmAction.type === "reject" ? "bg-orange-100" : "bg-red-100"
              }`}>
                <Icon
                  icon={
                    confirmAction.type === "approve" ? "mdi:check-circle" :
                    confirmAction.type === "reject" ? "mdi:close-circle" : "mdi:delete"
                  }
                  className={`text-3xl ${
                    confirmAction.type === "approve" ? "text-green-600" :
                    confirmAction.type === "reject" ? "text-orange-600" : "text-red-600"
                  }`}
                />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {confirmAction.type === "approve" ? "Approuver le document" :
                 confirmAction.type === "reject" ? "Rejeter le document" : "Supprimer le document"}
              </h3>

              <p className="text-gray-600 mb-4">
                {confirmAction.type === "approve"
                  ? `Voulez-vous approuver le document "${confirmAction.document.documentType.name}" ?`
                  : confirmAction.type === "reject"
                  ? `Voulez-vous rejeter le document "${confirmAction.document.documentType.name}" ?`
                  : `Voulez-vous supprimer le document "${confirmAction.document.documentType.name}" ?`}
              </p>

              {confirmAction.type === "reject" && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Raison du rejet..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                    setRejectionReason("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={executeDocumentAction}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 ${
                    confirmAction.type === "approve"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : confirmAction.type === "reject"
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    confirmAction.type === "approve" ? "Approuver" :
                    confirmAction.type === "reject" ? "Rejeter" : "Supprimer"
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
