import { useState, useCallback } from "react";

type PopupType = "error" | "warning" | "info" | "success";

type ErrorPopupState = {
  isOpen: boolean;
  message: string;
  title: string;
  type: PopupType;
};

export function useErrorPopup() {
  const [errorPopup, setErrorPopup] = useState<ErrorPopupState>({
    isOpen: false,
    message: "",
    title: "",
    type: "error",
  });

  const showPopup = useCallback(
    (message: string, title?: string, type: PopupType = "error") => {
      setErrorPopup({ isOpen: true, message, title: title || "", type });
    },
    []
  );

  const showError = useCallback((message: string, title?: string) => {
    showPopup(message, title || "Erreur", "error");
  }, [showPopup]);

  const showWarning = useCallback((message: string, title?: string) => {
    showPopup(message, title || "Attention", "warning");
  }, [showPopup]);

  const showInfo = useCallback((message: string, title?: string) => {
    showPopup(message, title || "Information", "info");
  }, [showPopup]);

  const showSuccess = useCallback((message: string, title?: string) => {
    showPopup(message, title || "Succes", "success");
  }, [showPopup]);

  const closePopup = useCallback(() => {
    setErrorPopup((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Helper pour gérer les erreurs API
  const handleApiError = useCallback((error: any, defaultMessage: string = "Une erreur est survenue") => {
    const errorMessage = error.response?.data?.message || defaultMessage;
    const statusCode = error.response?.status;

    switch (statusCode) {
      case 400:
        showWarning(errorMessage, "Donnees invalides");
        break;
      case 401:
        showError("Votre session a expire. Veuillez vous reconnecter.", "Session expiree");
        break;
      case 403:
        showError("Vous n'avez pas les permissions necessaires", "Acces refuse");
        break;
      case 404:
        showError("La ressource demandee n'existe pas", "Introuvable");
        break;
      case 409:
        showError(errorMessage, "Conflit");
        break;
      case 422:
        showWarning(errorMessage, "Validation echouee");
        break;
      case 500:
        showError("Une erreur serveur est survenue. Veuillez reessayer.", "Erreur serveur");
        break;
      default:
        showError(errorMessage, "Erreur");
    }
  }, [showError, showWarning]);

  return {
    errorPopup,
    showError,
    showWarning,
    showInfo,
    showSuccess,
    closePopup,
    handleApiError,
  };
}
