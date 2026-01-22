"use client";

import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

type ErrorPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "error" | "warning" | "info" | "success";
};

const typeConfig = {
  error: {
    icon: "mdi:close-circle",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    titleColor: "text-red-800",
    textColor: "text-red-700",
    buttonBg: "bg-red-500 hover:bg-red-600",
  },
  warning: {
    icon: "mdi:alert-circle",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-500",
    titleColor: "text-yellow-800",
    textColor: "text-yellow-700",
    buttonBg: "bg-yellow-500 hover:bg-yellow-600",
  },
  info: {
    icon: "mdi:information",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
    titleColor: "text-blue-800",
    textColor: "text-blue-700",
    buttonBg: "bg-blue-500 hover:bg-blue-600",
  },
  success: {
    icon: "mdi:check-circle",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    iconBg: "bg-green-100",
    iconColor: "text-green-500",
    titleColor: "text-green-800",
    textColor: "text-green-700",
    buttonBg: "bg-green-500 hover:bg-green-600",
  },
};

const defaultTitles = {
  error: "Erreur",
  warning: "Attention",
  info: "Information",
  success: "Succes",
};

export default function ErrorPopup({
  isOpen,
  onClose,
  title,
  message,
  type = "error",
}: ErrorPopupProps) {
  const config = typeConfig[type];
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      {/* Overlay sombre */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Contenu du popup */}
      <div
        className={`
          relative
          ${config.bgColor}
          ${config.borderColor}
          border-2
          rounded-2xl
          shadow-2xl
          w-full
          max-w-md
          ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
          transition-all duration-300 ease-out
        `}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/10 transition-colors"
        >
          <Icon icon="mdi:close" className="text-xl text-gray-500" />
        </button>

        <div className="p-6 pt-8">
          {/* Icone */}
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${config.iconBg}`}>
              <Icon icon={config.icon} className={`text-5xl ${config.iconColor}`} />
            </div>
          </div>

          {/* Titre */}
          <h3 className={`text-xl font-bold text-center mb-3 ${config.titleColor}`}>
            {title || defaultTitles[type]}
          </h3>

          {/* Message */}
          <p className={`text-center mb-6 ${config.textColor} leading-relaxed`}>
            {message}
          </p>

          {/* Bouton */}
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 ${config.buttonBg} text-white font-semibold rounded-xl transition-colors shadow-lg`}
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
}
