"use client";

import { Icon } from "@iconify/react";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  loading?: boolean;
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "warning",
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const config = {
    danger: {
      icon: "mdi:alert-circle",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      confirmBg: "bg-red-500 hover:bg-red-600",
      confirmText: "text-white",
    },
    warning: {
      icon: "mdi:alert",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      confirmBg: "bg-yellow-300 hover:bg-yellow-400",
      confirmText: "text-black",
    },
    info: {
      icon: "mdi:information",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      confirmBg: "bg-blue-500 hover:bg-blue-600",
      confirmText: "text-white",
    },
    success: {
      icon: "mdi:check-circle",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      confirmBg: "bg-green-500 hover:bg-green-600",
      confirmText: "text-white",
    },
  };

  const c = config[type];

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className={`mx-auto w-16 h-16 ${c.iconBg} rounded-full flex items-center justify-center mb-4`}>
            <Icon icon={c.icon} className={`text-3xl ${c.iconColor}`} />
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 ${c.confirmBg} ${c.confirmText} rounded-xl transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  Traitement...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
