"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dynamic from "next/dynamic";
import Pagination from "@/components/Pagination";
import ErrorPopup from "@/components/ErrorPopup";
import {
  SERVICE_GARAGES,
  GaragesProps,
  GarageWalletProps,
  GarageTransactionProps,
} from "@/services/garage-service";
import {
  AnimatedTableRow,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableCell,
  EmptyState,
} from "@/components/ui/AnimatedTable";

const GarageMap = dynamic(() => import("@/components/GarageMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-200"></div>
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-yellow-400 absolute top-0 left-0"></div>
      </div>
    </div>
  ),
});

export default function GarageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [loading, setLoading] = useState(true);
  const [garage, setGarage] = useState<GaragesProps | null>(null);
  const [wallet, setWallet] = useState<GarageWalletProps | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "transactions">("info");

  // Transactions
  const [transactions, setTransactions] = useState<GarageTransactionProps[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Activation
  const [modalActivate, setModalActivate] = useState(false);
  const [activateSender, setActivateSender] = useState<"SMS" | "WHATSAPP">("SMS");
  const [submitting, setSubmitting] = useState(false);

  // Error popup
  const [errorPopup, setErrorPopup] = useState({
    isOpen: false,
    message: "",
    title: "",
    type: "error" as "error" | "warning" | "info" | "success",
  });

  const showError = (message: string, title?: string) => {
    setErrorPopup({ isOpen: true, message, title: title || "Erreur", type: "error" });
  };

  const closeErrorPopup = () => {
    setErrorPopup({ ...errorPopup, isOpen: false });
  };

  const formatBalance = (balance: string | number) => {
    const num = typeof balance === "string" ? parseFloat(balance) : balance;
    return isNaN(num) ? "0" : num.toLocaleString();
  };

  const loadGarage = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_GARAGES.getOne(code);
      if (res.status === 200) {
        setGarage(res.data);
      } else {
        toast.error("Garage non trouve");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement du garage");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    try {
      const res = await SERVICE_GARAGES.getWallet(code);
      if (res.status === 200) {
        setWallet(res.data);
      }
    } catch {
      // Wallet non disponible - on affiche solde 0
      setWallet(null);
    }
  };

  const loadTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const res = await SERVICE_GARAGES.getWalletTransactions(code, currentPage, itemsPerPage);
      setTransactions(res.data || []);
    } catch {
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      loadGarage();
      loadWallet();
    }
  }, [code]);

  useEffect(() => {
    if (activeTab === "transactions") {
      loadTransactions();
    }
  }, [activeTab, currentPage, itemsPerPage]);

  const executeActivate = async () => {
    try {
      setSubmitting(true);
      const res = await SERVICE_GARAGES.activate(code, activateSender);
      if (res.status === 200 || res.status === 201) {
        toast.success("Garage active avec succes. Les identifiants ont ete envoyes.");
        setModalActivate(false);
        loadGarage();
      } else if (res.status === 409) {
        setModalActivate(false);
        setErrorPopup({
          isOpen: true,
          message: "Le compte partenaire de ce garage est deja active. Le responsable peut se connecter avec son numero de telephone et le mot de passe recu lors de la premiere activation.",
          title: "Compte deja active",
          type: "info",
        });
      } else {
        showError(res.message || "Erreur lors de l'activation", "Erreur");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Erreur lors de l'activation";
      showError(errorMessage, "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  if (!garage) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:garage-alert" className="text-6xl mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-600">Garage non trouve</p>
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

      <ErrorPopup
        isOpen={errorPopup.isOpen}
        onClose={closeErrorPopup}
        title={errorPopup.title}
        message={errorPopup.message}
        type={errorPopup.type}
      />

      {/* Modal d'activation */}
      {modalActivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 animate-fadeIn">
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-200 rounded-xl">
                  <Icon icon="mdi:account-check" className="text-2xl text-green-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Activer le garage</h2>
                  <p className="text-sm text-gray-500">Creer le compte partenaire</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-3">
                  <Icon icon="mdi:account-key" className="text-blue-600 text-xl mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800">
                    L&apos;activation va <strong>creer un compte partenaire</strong> pour ce garage.
                    Le responsable recevra son <strong>identifiant (numero de telephone)</strong> et
                    son <strong>mot de passe</strong> par le canal choisi ci-dessous.
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-3">Canal d&apos;envoi des identifiants :</p>
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setActivateSender("SMS")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 ${
                    activateSender === "SMS"
                      ? "border-green-400 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Icon icon="mdi:message-text" className="text-xl" />
                  SMS
                </button>
                <button
                  onClick={() => setActivateSender("WHATSAPP")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 ${
                    activateSender === "WHATSAPP"
                      ? "border-green-400 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Icon icon="mdi:whatsapp" className="text-xl" />
                  WhatsApp
                </button>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModalActivate(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={executeActivate}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold rounded-xl hover:from-green-500 hover:to-green-600 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 shadow-md"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Activation...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:send" />
                      Activer et envoyer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md mb-6">
        <div className="p-6">
          <button
            onClick={() => router.push("/parametres/garages")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <Icon icon="mdi:arrow-left" />
            Retour a la liste
          </button>

          <div className="flex items-start gap-6">
            <div className="p-4 bg-yellow-100 rounded-2xl">
              <Icon icon="mdi:garage" className="text-4xl text-yellow-600" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{garage.name}</h1>
                {garage.status ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                    Actif
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                    Inactif
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Code</p>
                  <p className="font-medium">{garage.code}</p>
                </div>
                <div>
                  <p className="text-gray-500">Responsable</p>
                  <p className="font-medium">{garage.responsiblePerson}</p>
                </div>
                <div>
                  <p className="text-gray-500">Telephone</p>
                  <p className="font-medium">{garage.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Region</p>
                  <p className="font-medium">{garage.city}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setModalActivate(true)}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
            >
              <Icon icon="mdi:account-key" />
              {garage.status ? "Renvoyer les identifiants" : "Activer le compte partenaire"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 text-center font-medium transition-all duration-200 ${
              activeTab === "info"
                ? "border-b-2 border-yellow-400 text-yellow-700 bg-yellow-50/50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon icon="mdi:information" className="inline mr-2" />
            Informations
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-1 py-3 text-center font-medium transition-all duration-200 ${
              activeTab === "transactions"
                ? "border-b-2 border-yellow-400 text-yellow-700 bg-yellow-50/50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon icon="mdi:swap-horizontal" className="inline mr-2" />
            Transactions
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Infos garage */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:garage" className="text-yellow-500" />
              Informations du garage
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Icon icon="mdi:tag" className="text-gray-400 text-xl" />
                <div>
                  <p className="text-xs text-gray-500">Nom</p>
                  <p className="font-medium">{garage.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Icon icon="mdi:map-marker" className="text-gray-400 text-xl" />
                <div>
                  <p className="text-xs text-gray-500">Adresse</p>
                  <p className="font-medium">{garage.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Icon icon="mdi:city" className="text-gray-400 text-xl" />
                <div>
                  <p className="text-xs text-gray-500">Ville</p>
                  <p className="font-medium">{garage.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Icon icon="mdi:account" className="text-gray-400 text-xl" />
                <div>
                  <p className="text-xs text-gray-500">Responsable</p>
                  <p className="font-medium">{garage.responsiblePerson}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Icon icon="mdi:phone" className="text-gray-400 text-xl" />
                <div>
                  <p className="text-xs text-gray-500">Telephone</p>
                  <p className="font-medium">{garage.phoneNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Icon icon="mdi:crosshairs-gps" className="text-gray-400 text-xl" />
                <div>
                  <p className="text-xs text-gray-500">Coordonnees</p>
                  <p className="font-medium">
                    {garage.latitude}, {garage.longitude}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet + Map */}
          <div className="space-y-6">
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
                    <p className="text-xs text-white/60">
                      Wallet ID: {wallet?.id || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-4xl md:text-5xl font-bold">
                    {wallet ? formatBalance(wallet.balance) : "0"}
                    <span className="text-2xl ml-2">FCFA</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Icon icon="mdi:map-marker" className="text-yellow-400" />
                  Localisation
                </h3>
              </div>
              <div className="p-4">
                <GarageMap
                  garages={[garage]}
                  onEdit={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <TableContainer>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600"></div>
            </div>
          ) : (
            <>
              <table className="w-full">
                <TableHeader>
                  <TableHeaderCell>ID</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Libelle</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Montant</TableHeaderCell>
                  <TableHeaderCell>Statut</TableHeaderCell>
                </TableHeader>
                <tbody>
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((tx, index) => (
                      <AnimatedTableRow key={tx.id} index={index}>
                        <TableCell>
                          <span className="font-mono text-sm text-gray-600">
                            {tx.transactionId}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(tx.date).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{tx.libelle}</span>
                        </TableCell>
                        <TableCell>
                          {tx.type?.toLowerCase() === "credit" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                              <Icon icon="mdi:arrow-down" className="text-sm" />
                              Credit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                              <Icon icon="mdi:arrow-up" className="text-sm" />
                              Debit
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              tx.type?.toLowerCase() === "credit"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {tx.type?.toLowerCase() === "credit" ? "+" : "-"}
                            {Math.abs(tx.amount).toLocaleString()} FCFA
                          </span>
                        </TableCell>
                        <TableCell>
                          {tx.status?.toLowerCase() === "success" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                              <Icon icon="mdi:check-circle" className="text-sm" />
                              Succes
                            </span>
                          ) : tx.status?.toLowerCase() === "pending" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                              <Icon icon="mdi:clock-outline" className="text-sm" />
                              En attente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                              <Icon icon="mdi:close-circle" className="text-sm" />
                              Echoue
                            </span>
                          )}
                        </TableCell>
                      </AnimatedTableRow>
                    ))
                  ) : (
                    <EmptyState
                      icon="mdi:swap-horizontal"
                      title="Aucune transaction"
                      description="Les transactions du portefeuille apparaitront ici"
                    />
                  )}
                </tbody>
              </table>

              {transactions.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={transactions.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </>
          )}
        </TableContainer>
      )}
    </div>
  );
}
