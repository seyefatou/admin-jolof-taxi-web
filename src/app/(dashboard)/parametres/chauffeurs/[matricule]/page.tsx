"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_CHAUFFEUR, ChauffeurProps, DriverDocumentInfo, FilleulProps } from "@/services/chauffeur-service";
import { SERVICE_DOCUMENT, DocumentType } from "@/services/document-service";
import { SERVICE_COURSE, CourseProps } from "@/services/course-service";

export default function ChauffeurDetails() {
  const params = useParams();
  const router = useRouter();
  const matricule = decodeURIComponent(params.matricule as string);

  const [loading, setLoading] = useState(true);
  const [chauffeur, setChauffeur] = useState<ChauffeurProps | null>(null);
  const [documents, setDocuments] = useState<DriverDocumentInfo[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

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
    type: "approve" | "reject" | "delete" | "activate" | "deactivate" | "ambassadeur" | "remove_ambassadeur";
    document?: DriverDocumentInfo;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Image preview modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  // Filleuls (parrainage)
  const [filleuls, setFilleuls] = useState<FilleulProps[]>([]);
  const [filleulsLoading, setFilleulsLoading] = useState(false);
  const [offlineLoading, setOfflineLoading] = useState(false);

  // Statistiques courses
  const [driverCourses, setDriverCourses] = useState<CourseProps[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const chauffeurRes = await SERVICE_CHAUFFEUR.getOne(matricule);

      if (chauffeurRes.status === 200 && chauffeurRes.data) {
        setChauffeur(chauffeurRes.data);
        setDocuments(chauffeurRes.data.driverDocument || []);
      } else {
        toast.error(chauffeurRes.message || "Chauffeur non trouve");
        return;
      }

      try {
        const typesRes = await SERVICE_DOCUMENT.getDocumentTypes();
        setDocumentTypes(typesRes.data || []);
      } catch (docError) {
        console.log("Types de documents non disponibles:", docError);
      }

      // Charger les filleuls
      try {
        setFilleulsLoading(true);
        const filleulsRes = await SERVICE_CHAUFFEUR.getFilleuls(matricule);
        setFilleuls(filleulsRes.data || []);
      } catch (filleulError) {
        console.log("Filleuls non disponibles:", filleulError);
      } finally {
        setFilleulsLoading(false);
      }

      // Charger les courses du chauffeur
      try {
        setCoursesLoading(true);
        const coursesRes = await SERVICE_COURSE.getByDriver(matricule);
        setDriverCourses(coursesRes.data || []);
      } catch (coursesError) {
        console.log("Courses non disponibles:", coursesError);
      } finally {
        setCoursesLoading(false);
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

  const handleDocumentAction = (type: "approve" | "reject" | "delete", document: DriverDocumentInfo) => {
    setConfirmAction({ type, document });
    setShowConfirmModal(true);
  };

  const handleStatusAction = (type: "activate" | "deactivate") => {
    setConfirmAction({ type });
    setShowConfirmModal(true);
  };

  const handleSetOffline = async () => {
    setOfflineLoading(true);
    try {
      const res = await SERVICE_CHAUFFEUR.setOffline(matricule);
      if (res.status === 200) {
        toast.success("Chauffeur mis hors ligne avec succes");
        loadData();
      } else {
        toast.error(res.message || "Erreur lors de l'operation");
      }
    } catch {
      toast.error("Erreur lors de la mise hors ligne");
    } finally {
      setOfflineLoading(false);
    }
  };

  const handleToggleAmbassadeur = () => {
    if (!chauffeur) return;
    setConfirmAction({ type: chauffeur.isAmbassadeur ? "remove_ambassadeur" : "ambassadeur" });
    setShowConfirmModal(true);
  };

  const openImagePreview = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl);
    setPreviewTitle(title);
    setShowImageModal(true);
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    setActionLoading(true);
    try {
      let res;
      const { type, document } = confirmAction;

      switch (type) {
        case "approve":
          if (document) res = await SERVICE_DOCUMENT.approveDocument(document.id);
          break;
        case "reject":
          if (document) res = await SERVICE_DOCUMENT.rejectDocument(document.id, rejectionReason.trim() || undefined);
          break;
        case "delete":
          if (document) res = await SERVICE_DOCUMENT.deleteDocument(document.id);
          break;
        case "activate":
          res = await SERVICE_CHAUFFEUR.activate(matricule);
          break;
        case "deactivate":
          res = await SERVICE_CHAUFFEUR.deactivate(matricule);
          break;
        case "ambassadeur":
          res = await SERVICE_CHAUFFEUR.changeAmbassadeurStatus(matricule, true);
          break;
        case "remove_ambassadeur":
          res = await SERVICE_CHAUFFEUR.changeAmbassadeurStatus(matricule, false);
          break;
      }

      if (res && (res.status === 200 || res.status === 201)) {
        const messages: Record<string, string> = {
          approve: "Document approuve avec succes",
          reject: "Document rejete",
          delete: "Document supprime",
          activate: "Chauffeur active avec succes",
          deactivate: "Chauffeur desactive avec succes",
          ambassadeur: "Chauffeur defini comme ambassadeur",
          remove_ambassadeur: "Statut ambassadeur retire",
        };
        toast.success(messages[type]);
        setShowConfirmModal(false);
        setConfirmAction(null);
        setRejectionReason("");
        loadData();
      } else {
        toast.error("Erreur lors de l'operation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'operation");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { bg: string; text: string; border: string; label: string; icon: string }> = {
      ACTIVE: { bg: "bg-green-500", text: "text-white", border: "border-green-500", label: "Actif", icon: "mdi:check-circle" },
      PENDING: { bg: "bg-yellow-500", text: "text-white", border: "border-yellow-500", label: "En attente", icon: "mdi:clock-outline" },
      DEACTIVATED: { bg: "bg-gray-500", text: "text-white", border: "border-gray-500", label: "Desactive", icon: "mdi:account-off" },
      BANNED: { bg: "bg-red-500", text: "text-white", border: "border-red-500", label: "Banni", icon: "mdi:account-cancel" },
      DELETED: { bg: "bg-red-700", text: "text-white", border: "border-red-700", label: "Supprime", icon: "mdi:delete" },
    };
    return config[status] || { bg: "bg-gray-500", text: "text-white", border: "border-gray-500", label: status, icon: "mdi:help-circle" };
  };

  const getDocStatusConfig = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string; icon: string }> = {
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En attente", icon: "mdi:clock-outline" },
      APPROVED: { bg: "bg-green-100", text: "text-green-700", label: "Approuve", icon: "mdi:check-circle" },
      REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Rejete", icon: "mdi:close-circle" },
    };
    return config[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status, icon: "mdi:help-circle" };
  };

  const formatBalance = (balance: string | number) => {
    const num = typeof balance === 'string' ? parseFloat(balance) : balance;
    return num.toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-gray-600 mx-auto"></div>
            <Icon icon="mdi:account" className="absolute inset-0 m-auto text-gray-600 text-3xl" />
          </div>
          <p className="mt-4 text-gray-500 font-medium">Chargement des informations...</p>
        </div>
      </div>
    );
  }

  if (!chauffeur) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:account-off" className="text-5xl text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Chauffeur introuvable</h2>
          <p className="text-gray-500 mb-6">Le chauffeur demande n'existe pas ou a ete supprime.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
          >
            <Icon icon="mdi:arrow-left" className="inline mr-2" />
            Retour a la liste
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(chauffeur.status);

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-8">
      <ToastContainer position="bottom-right" />

      {/* Header avec retour */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <Icon icon="mdi:arrow-left" className="text-xl" />
            <span>Retour a la liste des chauffeurs</span>
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="px-6 -mt-0">
        <div className="bg-yellow-400 rounded-b-3xl shadow-xl p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white">
                {chauffeur.avatar ? (
                  <img src={chauffeur.avatar} alt={chauffeur.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-5xl font-bold text-gray-400">
                      {chauffeur.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
              {/* Online indicator */}
              <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white ${chauffeur.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}>
                {chauffeur.isOnline && (
                  <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {chauffeur.name || "Nom non renseigne"}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusConfig.bg} ${statusConfig.text} flex items-center gap-2 shadow-lg`}>
                  <Icon icon={statusConfig.icon} />
                  {statusConfig.label}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${chauffeur.isOnline ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} flex items-center gap-2`}>
                  <span className={`w-2 h-2 rounded-full ${chauffeur.isOnline ? 'bg-white' : 'bg-white'}`}></span>
                  {chauffeur.isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
              <p className="text-gray-800 font-mono text-lg">ID: {chauffeur.matricule}</p>
            </div>

            {/* Rating */}
            <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-black/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Icon icon="mdi:star" className="text-3xl text-gray-900" />
                <span className="text-4xl font-bold text-gray-900">
                  {chauffeur.rating > 0 ? chauffeur.rating.toFixed(1) : "N/A"}
                </span>
              </div>
              <p className="text-gray-800 text-sm font-medium">Note moyenne</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {chauffeur.status !== "ACTIVE" && (
            <button
              onClick={() => handleStatusAction("activate")}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:bg-green-50 hover:border-green-400 transition-all group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <Icon icon="mdi:check-circle" className="text-2xl text-gray-700 group-hover:text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">Activer</p>
                  <p className="text-xs text-gray-500">le compte</p>
                </div>
              </div>
            </button>
          )}
          {chauffeur.status === "ACTIVE" && (
            <button
              onClick={() => handleStatusAction("deactivate")}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-all group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-50 transition-colors">
                  <Icon icon="mdi:account-off" className="text-2xl text-gray-700" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">Desactiver</p>
                  <p className="text-xs text-gray-500">le compte</p>
                </div>
              </div>
            </button>
          )}
          {chauffeur.isOnline && (
            <button
              onClick={handleSetOffline}
              disabled={offlineLoading}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:bg-red-50 hover:border-red-400 transition-all group shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  {offlineLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent" />
                  ) : (
                    <Icon icon="mdi:wifi-off" className="text-2xl text-gray-700 group-hover:text-red-600" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">Hors ligne</p>
                  <p className="text-xs text-gray-500">deconnecter</p>
                </div>
              </div>
            </button>
          )}
          <button
            onClick={handleToggleAmbassadeur}
            className={`bg-white border border-gray-200 rounded-2xl p-4 transition-all group shadow-sm hover:shadow-md ${
              chauffeur.isAmbassadeur ? "hover:bg-orange-50 hover:border-orange-400" : "hover:bg-green-50 hover:border-green-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center transition-colors ${
                chauffeur.isAmbassadeur ? "group-hover:bg-orange-100" : "group-hover:bg-green-100"
              }`}>
                <Icon icon="mdi:account-star" className={`text-2xl text-gray-700 ${
                  chauffeur.isAmbassadeur ? "group-hover:text-orange-600" : "group-hover:text-green-600"
                }`} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">{chauffeur.isAmbassadeur ? "Retirer" : "Ambassadeur"}</p>
                <p className="text-xs text-gray-500">{chauffeur.isAmbassadeur ? "ambassadeur" : "promouvoir"}</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-white border border-gray-200 rounded-2xl p-4 hover:bg-green-50 hover:border-green-400 transition-all group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <Icon icon="mdi:file-plus" className="text-2xl text-gray-700 group-hover:text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">Ajouter</p>
                <p className="text-xs text-gray-500">un document</p>
              </div>
            </div>
          </button>
          <a
            href={`tel:${chauffeur.phone}`}
            className="bg-white border border-gray-200 rounded-2xl p-4 hover:bg-green-50 hover:border-green-400 transition-all group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <Icon icon="mdi:phone" className="text-2xl text-gray-700 group-hover:text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">Appeler</p>
                <p className="text-xs text-gray-500">{chauffeur.phone}</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact & Wallet */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Icon icon="mdi:card-account-details" className="text-yellow-400" />
                Informations de contact
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:phone" className="text-2xl text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Telephone</p>
                  <p className="text-lg font-bold text-gray-800">{chauffeur.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:email" className="text-2xl text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Email</p>
                  <p className="text-lg font-bold text-gray-800">{chauffeur.email || "Non renseigne"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:identifier" className="text-2xl text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Matricule</p>
                  <p className="text-lg font-bold text-gray-800 font-mono">{chauffeur.matricule}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Card */}
          <div className="bg-gray-900 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden border border-gray-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Icon icon="mdi:wallet" className="text-3xl text-yellow-400" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">Solde du portefeuille</p>
                  <p className="text-xs text-white/60">Wallet ID: {chauffeur.wallet?.id || "N/A"}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-4xl md:text-5xl font-bold">
                  {chauffeur.wallet ? formatBalance(chauffeur.wallet.balance) : "0"}
                  <span className="text-2xl ml-2">FCFA</span>
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques Courses */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Icon icon="mdi:chart-bar" className="text-yellow-400" />
                Statistiques des courses
              </h3>
            </div>
            {coursesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600"></div>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Icon icon="mdi:car-multiple" className="text-2xl text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{driverCourses.length}</p>
                    <p className="text-xs text-gray-500 font-medium">Total courses</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Icon icon="mdi:check-circle" className="text-2xl text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {driverCourses.filter(c => c.status === "DONE").length}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">Terminees</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Icon icon="mdi:close-circle" className="text-2xl text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-700">
                      {driverCourses.filter(c => c.status === "CANCELED_BY_DRIVER" || c.status === "CANCELED").length}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">Annulees / Refusees</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Icon icon="mdi:clock-outline" className="text-2xl text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-700">
                      {driverCourses.filter(c => c.status === "PENDING" || c.status === "IN_PROGRESS").length}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">En cours / Attente</p>
                  </div>
                </div>

                {/* Taux de completion */}
                {driverCourses.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-700">Taux de completion</p>
                      <p className="text-sm font-bold text-green-600">
                        {Math.round((driverCourses.filter(c => c.status === "DONE").length / driverCourses.length) * 100)}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((driverCourses.filter(c => c.status === "DONE").length / driverCourses.length) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Revenu total */}
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <Icon icon="mdi:cash-multiple" className="text-2xl text-yellow-600" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Revenu total</p>
                      <p className="text-xl font-bold text-gray-800">
                        {driverCourses.filter(c => c.status === "DONE").reduce((sum, c) => sum + c.price, 0).toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Column - Vehicle & Garage */}
        <div className="space-y-6">
          {/* Vehicle Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Icon icon="mdi:car" className="text-yellow-400" />
                Vehicule assigne
              </h3>
            </div>
            {chauffeur.vehicule ? (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <Icon icon="mdi:car-side" className="text-4xl text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-800">
                      {chauffeur.vehicule.brand} {chauffeur.vehicule.model}
                    </p>
                    <p className="text-gray-500">{chauffeur.vehicule.year}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Plaque</p>
                    <p className="text-lg font-bold text-gray-800">{chauffeur.vehicule.licensePlateNumber}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Licence</p>
                    <p className="text-lg font-bold text-gray-800">{chauffeur.vehicule.licenseNumber || "N/A"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Couleur</p>
                    <p className="text-lg font-bold text-gray-800">{chauffeur.vehicule.color || "N/A"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Categorie</p>
                    <p className="text-lg font-bold text-gray-800">{chauffeur.vehicule.type || "N/A"}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                    chauffeur.vehicule.isAvailable
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <Icon icon={chauffeur.vehicule.isAvailable ? "mdi:check-circle" : "mdi:close-circle"} />
                    {chauffeur.vehicule.isAvailable ? "Disponible" : "Indisponible"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon="mdi:car-off" className="text-4xl text-gray-400" />
                </div>
                <p className="text-xl font-bold text-gray-600 mb-2">Aucun vehicule</p>
                <p className="text-gray-400">Ce chauffeur n'a pas de vehicule assigne</p>
              </div>
            )}
          </div>

          {/* Garage Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Icon icon="mdi:garage" className="text-yellow-400" />
                Garage affilie
              </h3>
            </div>
            {chauffeur.garageAffiliation ? (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <Icon icon="mdi:garage-variant" className="text-3xl text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-800">{chauffeur.garageAffiliation.name}</p>
                    <p className="text-gray-500 font-mono">{chauffeur.garageAffiliation.code}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Icon icon="mdi:map-marker" className="text-xl text-gray-500" />
                    <span>{chauffeur.garageAffiliation.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Icon icon="mdi:city" className="text-xl text-gray-500" />
                    <span>{chauffeur.garageAffiliation.city}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon="mdi:garage-alert" className="text-4xl text-gray-400" />
                </div>
                <p className="text-xl font-bold text-gray-600 mb-2">Aucun garage</p>
                <p className="text-gray-400">Ce chauffeur n'est affilie a aucun garage</p>
              </div>
            )}
          </div>

          {/* Parrainage Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Icon icon="mdi:account-group" className="text-yellow-400" />
                Parrainage
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Statut ambassadeur */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Icon icon="mdi:account-star" className={`text-2xl ${chauffeur.isAmbassadeur ? "text-purple-600" : "text-gray-400"}`} />
                  <div>
                    <p className="text-sm font-bold text-gray-800">Statut Ambassadeur</p>
                    <p className="text-xs text-gray-500">Peut parrainer d'autres chauffeurs</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  chauffeur.isAmbassadeur ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-600"
                }`}>
                  {chauffeur.isAmbassadeur ? "Ambassadeur" : "Non"}
                </span>
              </div>

              {/* Parrain (qui l'a parrainé) */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Icon icon="mdi:account-arrow-left" className="text-2xl text-gray-500" />
                <div>
                  <p className="text-sm font-bold text-gray-800">Parraine par</p>
                  <p className="text-sm text-gray-600 font-mono">
                    {chauffeur.referal || "Aucun parrain"}
                  </p>
                </div>
              </div>

              {/* Filleuls */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Icon icon="mdi:account-multiple-plus" className="text-gray-500" />
                    Filleuls ({filleuls.length})
                  </p>
                </div>

                {filleulsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600"></div>
                  </div>
                ) : filleuls.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {filleuls.map((filleul) => (
                      <div
                        key={filleul.id}
                        onClick={() => router.push(`/parametres/chauffeurs/${filleul.matricule}`)}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {filleul.avatar ? (
                              <img src={filleul.avatar} alt={filleul.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-gray-500">{filleul.name?.charAt(0)?.toUpperCase()}</span>
                            )}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${filleul.isOnline ? "bg-green-500" : "bg-gray-400"}`}></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{filleul.name}</p>
                          <p className="text-xs text-gray-500">{filleul.phone}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          filleul.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                          filleul.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {filleul.status === "ACTIVE" ? "Actif" : filleul.status === "PENDING" ? "En attente" : filleul.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Icon icon="mdi:account-multiple-outline" className="text-4xl text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucun filleul</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Documents */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Icon icon="mdi:file-document-multiple" className="text-yellow-400" />
                Documents ({documents.length})
              </h3>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                <Icon icon="mdi:plus" />
                Ajouter
              </button>
            </div>

            <div className="p-4 max-h-[600px] overflow-y-auto">
              {documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc) => {
                    const docStatus = getDocStatusConfig(doc.status);
                    return (
                      <div key={doc.id} className="border-2 border-gray-100 rounded-2xl p-4 hover:border-gray-300 transition-all hover:shadow-md">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                              <Icon icon="mdi:file-document" className="text-2xl text-gray-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{doc.DocumentType?.title || "Document"}</p>
                              <p className="text-xs text-gray-400">ID: {doc.id}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${docStatus.bg} ${docStatus.text}`}>
                            <Icon icon={docStatus.icon} />
                            {docStatus.label}
                          </span>
                        </div>

                        {/* Images */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {doc.frontImage && (
                            <button
                              onClick={() => openImagePreview(doc.frontImage!, `${doc.DocumentType?.title || "Document"} - Recto`)}
                              className="relative group overflow-hidden rounded-xl border-2 border-gray-200 hover:border-gray-400 transition-all"
                            >
                              <img
                                src={doc.frontImage}
                                alt="Recto"
                                className="w-full h-24 object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <Icon icon="mdi:eye" className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Recto</span>
                            </button>
                          )}
                          {doc.backImage && (
                            <button
                              onClick={() => openImagePreview(doc.backImage!, `${doc.DocumentType?.title || "Document"} - Verso`)}
                              className="relative group overflow-hidden rounded-xl border-2 border-gray-200 hover:border-gray-400 transition-all"
                            >
                              <img
                                src={doc.backImage}
                                alt="Verso"
                                className="w-full h-24 object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <Icon icon="mdi:eye" className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Verso</span>
                            </button>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {doc.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleDocumentAction("approve", doc)}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                              >
                                <Icon icon="mdi:check" />
                                Approuver
                              </button>
                              <button
                                onClick={() => handleDocumentAction("reject", doc)}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                              >
                                <Icon icon="mdi:close" />
                                Rejeter
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDocumentAction("delete", doc)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                          >
                            <Icon icon="mdi:delete" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="mdi:file-document-outline" className="text-5xl text-gray-400" />
                  </div>
                  <p className="text-xl font-bold text-gray-600 mb-2">Aucun document</p>
                  <p className="text-gray-400 mb-6">Ce chauffeur n'a pas encore de documents</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                  >
                    <Icon icon="mdi:plus" className="inline mr-2" />
                    Ajouter un document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historique des courses */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Icon icon="mdi:history" className="text-yellow-400" />
              Historique des courses ({driverCourses.length})
            </h3>
          </div>

          {coursesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-600"></div>
            </div>
          ) : driverCourses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                    <th className="px-6 py-3">Course</th>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Trajet</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3">Prix</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {driverCourses.map((course) => {
                    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                      DONE: { bg: "bg-green-100", text: "text-green-700", label: "Terminee" },
                      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En attente" },
                      ACCEPTED: { bg: "bg-cyan-100", text: "text-cyan-700", label: "Acceptee" },
                      IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700", label: "En cours" },
                      CANCELED: { bg: "bg-red-100", text: "text-red-700", label: "Annulee" },
                      CANCELED_BY_CUSTOMER: { bg: "bg-orange-100", text: "text-orange-700", label: "Annulee client" },
                      CANCELED_BY_DRIVER: { bg: "bg-purple-100", text: "text-purple-700", label: "Annulee chauffeur" },
                    };
                    const sc = statusConfig[course.status] || { bg: "bg-gray-100", text: "text-gray-700", label: course.status };

                    return (
                      <tr
                        key={course.id}
                        onClick={() => router.push(`/reservations/reservations/${course.code_booking}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-800">#{course.code_booking}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 text-xs font-bold">
                              {course.customer.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{course.customer.name}</p>
                              <p className="text-xs text-gray-400">{course.customer.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 max-w-[200px]">
                            <p className="truncate flex items-center gap-1">
                              <Icon icon="mdi:map-marker" className="text-green-500 flex-shrink-0" />
                              {course.pickup_location.address || "N/A"}
                            </p>
                            <p className="truncate flex items-center gap-1 mt-0.5">
                              <Icon icon="mdi:map-marker" className="text-red-500 flex-shrink-0" />
                              {course.dropoff_location.address || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-800">{course.price.toLocaleString()} FCFA</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-500">
                            {new Date(course.created_at).toLocaleDateString("fr-FR")}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(course.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon icon="mdi:car-clock" className="text-6xl mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600">Aucune course</p>
              <p className="text-sm text-gray-400 mt-1">Ce chauffeur n'a pas encore effectue de course</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {showImageModal && previewImage && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-black/90" onClick={() => setShowImageModal(false)} />
          <div className="relative max-w-5xl w-full">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setShowImageModal(false)}
                className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors"
              >
                <Icon icon="mdi:close" className="text-2xl" />
              </button>
            </div>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-white">{previewTitle}</h3>
            </div>
            <img
              src={previewImage}
              alt={previewTitle}
              className="max-w-full max-h-[80vh] mx-auto rounded-2xl shadow-2xl object-contain"
            />
            <div className="flex justify-center gap-4 mt-4">
              <a
                href={previewImage}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                <Icon icon="mdi:open-in-new" />
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowUploadModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-900 px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Icon icon="mdi:file-plus" />
                  Ajouter un document
                </h2>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <Icon icon="mdi:close" className="text-xl text-white" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUploadDocument} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Type de document <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={uploadData.documentTypeId}
                  onChange={(e) => setUploadData({ ...uploadData, documentTypeId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-100 outline-none transition-all text-lg"
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
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Fichier <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    required
                    accept="image/*,.pdf"
                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-100 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Date d'expiration (optionnel)
                </label>
                <input
                  type="date"
                  value={uploadData.expiryDate}
                  onChange={(e) => setUploadData({ ...uploadData, expiryDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-100 outline-none transition-all text-lg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
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

      {/* Confirm Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                confirmAction.type === "approve" || confirmAction.type === "activate" || confirmAction.type === "ambassadeur" ? "bg-green-100" :
                confirmAction.type === "reject" || confirmAction.type === "deactivate" || confirmAction.type === "remove_ambassadeur" ? "bg-orange-100" : "bg-red-100"
              }`}>
                <Icon
                  icon={
                    confirmAction.type === "ambassadeur" ? "mdi:account-star" :
                    confirmAction.type === "remove_ambassadeur" ? "mdi:account-star-outline" :
                    confirmAction.type === "approve" || confirmAction.type === "activate" ? "mdi:check-circle" :
                    confirmAction.type === "reject" || confirmAction.type === "deactivate" ? "mdi:close-circle" : "mdi:delete"
                  }
                  className={`text-5xl ${
                    confirmAction.type === "approve" || confirmAction.type === "activate" || confirmAction.type === "ambassadeur" ? "text-green-600" :
                    confirmAction.type === "reject" || confirmAction.type === "deactivate" || confirmAction.type === "remove_ambassadeur" ? "text-orange-600" : "text-red-600"
                  }`}
                />
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {confirmAction.type === "approve" ? "Approuver le document" :
                 confirmAction.type === "reject" ? "Rejeter le document" :
                 confirmAction.type === "delete" ? "Supprimer le document" :
                 confirmAction.type === "activate" ? "Activer le chauffeur" :
                 confirmAction.type === "deactivate" ? "Desactiver le chauffeur" :
                 confirmAction.type === "ambassadeur" ? "Promouvoir ambassadeur" :
                 "Retirer le statut ambassadeur"}
              </h3>

              <p className="text-gray-600 mb-4">
                {confirmAction.type === "approve"
                  ? `Voulez-vous approuver "${confirmAction.document?.DocumentType?.title || "ce document"}" ?`
                  : confirmAction.type === "reject"
                  ? `Voulez-vous rejeter "${confirmAction.document?.DocumentType?.title || "ce document"}" ?`
                  : confirmAction.type === "delete"
                  ? `Voulez-vous supprimer "${confirmAction.document?.DocumentType?.title || "ce document"}" ?`
                  : confirmAction.type === "activate"
                  ? `Voulez-vous activer le compte de ${chauffeur.name || "ce chauffeur"} ?`
                  : confirmAction.type === "deactivate"
                  ? `Voulez-vous desactiver le compte de ${chauffeur.name || "ce chauffeur"} ?`
                  : confirmAction.type === "ambassadeur"
                  ? `Voulez-vous definir ${chauffeur.name || "ce chauffeur"} comme ambassadeur ? Il pourra parrainer d'autres chauffeurs.`
                  : `Voulez-vous retirer le statut ambassadeur de ${chauffeur.name || "ce chauffeur"} ?`}
              </p>

              {confirmAction.type === "reject" && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Raison du rejet (optionnel)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
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
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={executeAction}
                  disabled={actionLoading}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all ${
                    confirmAction.type === "approve" || confirmAction.type === "activate" || confirmAction.type === "ambassadeur"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : confirmAction.type === "reject" || confirmAction.type === "deactivate" || confirmAction.type === "remove_ambassadeur"
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    confirmAction.type === "approve" ? "Approuver" :
                    confirmAction.type === "reject" ? "Rejeter" :
                    confirmAction.type === "delete" ? "Supprimer" :
                    confirmAction.type === "activate" ? "Activer" :
                    confirmAction.type === "deactivate" ? "Desactiver" :
                    confirmAction.type === "ambassadeur" ? "Promouvoir" : "Retirer"
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
