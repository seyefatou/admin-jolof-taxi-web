"use client";

import { Icon } from "@iconify/react";
import React, { useEffect, useState } from "react";

// Composant pour les lignes animées
export const AnimatedTableRow: React.FC<{
  children: React.ReactNode;
  index: number;
  className?: string;
  onClick?: () => void;
}> = ({ children, index, className = "", onClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <tr
      onClick={onClick}
      className={`
        border-t border-gray-100
        transition-all duration-300 ease-out
        hover:bg-gradient-to-r hover:from-yellow-50/50 hover:to-transparent
        hover:shadow-sm
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      style={{ transitionDelay: `${index * 30}ms` }}
    >
      {children}
    </tr>
  );
};

// Badge de statut stylé
export const StatusBadge: React.FC<{
  status: string;
  customConfig?: Record<string, { bg: string; text: string; icon: string; label: string }>;
}> = ({ status, customConfig }) => {
  const defaultConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    ACTIVE: {
      bg: "bg-gradient-to-r from-green-100 to-emerald-100 border-green-200",
      text: "text-green-700",
      icon: "mdi:check-circle",
      label: "Actif"
    },
    PENDING: {
      bg: "bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200",
      text: "text-yellow-700",
      icon: "mdi:clock-outline",
      label: "En attente"
    },
    DEACTIVATED: {
      bg: "bg-gradient-to-r from-gray-100 to-slate-100 border-gray-200",
      text: "text-gray-700",
      icon: "mdi:account-off",
      label: "Desactive"
    },
    BANNED: {
      bg: "bg-gradient-to-r from-red-100 to-rose-100 border-red-200",
      text: "text-red-700",
      icon: "mdi:account-cancel",
      label: "Banni"
    },
  };

  const config = customConfig || defaultConfig;
  const c = config[status] || {
    bg: "bg-gray-100 border-gray-200",
    text: "text-gray-700",
    icon: "mdi:help-circle",
    label: status
  };

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1.5
      rounded-full text-xs font-semibold
      border shadow-sm
      transition-all duration-200 hover:scale-105
      ${c.bg} ${c.text}
    `}>
      <Icon icon={c.icon} className="text-sm" />
      {c.label}
    </span>
  );
};

// Badge en ligne / hors ligne
export const OnlineBadge: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  return isOnline ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      En ligne
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 border border-gray-200 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-gray-400"></span>
      Hors ligne
    </span>
  );
};

// Avatar avec indicateur en ligne
export const AvatarWithStatus: React.FC<{
  name: string;
  avatar?: string | null;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
  rating?: number;
}> = ({ name, avatar, isOnline, size = "md", rating }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14",
  };

  const indicatorSizes = {
    sm: "w-2.5 h-2.5 border",
    md: "w-3.5 h-3.5 border-2",
    lg: "w-4 h-4 border-2",
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative group">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden ring-2 ring-gray-100 group-hover:ring-yellow-200 transition-all duration-300`}>
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=FEF08A&color=713F12&bold=true`}
              alt={name || "User"}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        {isOnline !== undefined && (
          <div className={`absolute bottom-0 right-0 ${indicatorSizes[size]} ${isOnline ? "bg-green-500" : "bg-gray-400"} border-white rounded-full shadow-sm`}>
            {isOnline && (
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
            )}
          </div>
        )}
      </div>
      <div>
        <span className="font-semibold text-gray-800 group-hover:text-yellow-600 transition-colors">
          {name || <span className="text-gray-400 italic font-normal">Indisponible</span>}
        </span>
        {rating !== undefined && rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Icon icon="mdi:star" className="text-yellow-500 text-sm" />
            <span className="text-xs text-gray-500 font-medium">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Carte de statistiques animée
export const StatCard: React.FC<{
  title: string;
  value: number;
  icon: string;
  color: "gray" | "green" | "blue" | "yellow" | "red" | "purple";
  index?: number;
}> = ({ title, value, icon, color, index = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOut * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, isVisible]);

  const colorConfig = {
    gray: { bg: "bg-gray-100", iconBg: "bg-gray-200", text: "text-gray-600", value: "text-gray-800" },
    green: { bg: "bg-green-50", iconBg: "bg-green-100", text: "text-green-600", value: "text-green-700" },
    blue: { bg: "bg-blue-50", iconBg: "bg-blue-100", text: "text-blue-600", value: "text-blue-700" },
    yellow: { bg: "bg-yellow-50", iconBg: "bg-yellow-100", text: "text-yellow-600", value: "text-yellow-700" },
    red: { bg: "bg-red-50", iconBg: "bg-red-100", text: "text-red-600", value: "text-red-700" },
    purple: { bg: "bg-purple-50", iconBg: "bg-purple-100", text: "text-purple-600", value: "text-purple-700" },
  };

  const c = colorConfig[color];

  return (
    <div
      className={`
        relative overflow-hidden p-5 rounded-2xl border border-gray-200 shadow-sm
        bg-white hover:shadow-lg transition-all duration-300
        hover:scale-[1.02] hover:-translate-y-1
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Background decoration */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${c.bg} rounded-full opacity-50`}></div>

      <div className="relative flex items-center gap-4">
        <div className={`p-3 ${c.iconBg} rounded-xl`}>
          <Icon icon={icon} className={`text-2xl ${c.text}`} />
        </div>
        <div>
          <p className={`text-3xl font-bold ${c.value}`}>{displayValue.toLocaleString()}</p>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
        </div>
      </div>
    </div>
  );
};

// Conteneur de tableau avec style
export const TableContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

// En-tête de tableau stylé
export const TableHeader: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
      <tr>
        {children}
      </tr>
    </thead>
  );
};

// Cellule d'en-tête de tableau
export const TableHeaderCell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <th className={`px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
};

// Cellule de tableau
export const TableCell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <td className={`px-5 py-4 ${className}`}>
      {children}
    </td>
  );
};

// Message vide stylé
export const EmptyState: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  return (
    <tr>
      <td colSpan={100} className="px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Icon icon={icon} className="text-4xl text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700">{title}</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm">{description}</p>
        </div>
      </td>
    </tr>
  );
};

// Header de page stylé
export const PageHeader: React.FC<{
  title: string;
  icon: string;
  count?: number;
  action?: React.ReactNode;
}> = ({ title, icon, count, action }) => {
  return (
    <div className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 shadow-lg rounded-2xl mb-6 overflow-hidden">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded-xl">
            <Icon icon={icon} className="text-2xl text-yellow-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            {count !== undefined && (
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-yellow-600">{count}</span> elements
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      {/* Decorative line */}
      <div className="h-1 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300"></div>
    </div>
  );
};

// Bouton d'ajout stylé
export const AddButton: React.FC<{
  onClick: () => void;
  label: string;
}> = ({ onClick, label }) => {
  return (
    <button
      onClick={onClick}
      className="group px-5 py-2.5 bg-gradient-to-r from-yellow-300 to-yellow-400 text-black font-semibold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105"
    >
      <Icon icon="mdi:plus" className="text-lg group-hover:rotate-90 transition-transform duration-300" />
      {label}
    </button>
  );
};
