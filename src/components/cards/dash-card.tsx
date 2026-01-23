"use client";

import { Icon } from "@iconify/react";
import React, { useEffect, useState, useRef } from "react";

type DashProps = {
  h1: string;
  h3?: string;
  icon: string;
  number: string;
  classname?: string;
  bgColor?: string;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
};

// Hook pour animer les chiffres
const useCountUp = (end: number, duration: number = 1500, startOnView: boolean = true) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasStarted]);

  return { count, ref };
};

// Fonction pour extraire le nombre d'une chaîne
const extractNumber = (str: string): number => {
  const cleaned = str.replace(/[^\d.,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
};

// Fonction pour formater le nombre avec le suffixe original
const formatWithSuffix = (count: number, original: string): string => {
  // Vérifie si c'est un montant avec suffixe (K, M, etc.)
  const suffixMatch = original.match(/[KMB]$/i);
  const suffix = suffixMatch ? suffixMatch[0] : "";

  // Vérifie si c'est un montant CFA
  if (original.includes("CFA") || original.includes("F")) {
    return `${count.toLocaleString("fr-FR")} ${original.includes("CFA") ? "CFA" : "F"}`;
  }

  if (suffix) {
    return `${count}${suffix}`;
  }

  return count.toLocaleString("fr-FR");
};

export const CardDashmini: React.FC<DashProps> = ({
  h1,
  h3,
  icon,
  number,
  classname,
  bgColor,
  iconColor,
  trend,
  trendValue,
}) => {
  const numericValue = extractNumber(number);
  const { count, ref } = useCountUp(numericValue, 1200);
  const displayNumber = formatWithSuffix(count, number);

  // Couleurs d'icônes basées sur le type de carte
  const getIconStyles = () => {
    if (iconColor) return iconColor;

    const lowerH1 = h1.toLowerCase();
    if (lowerH1.includes("terminee") || lowerH1.includes("completed") || lowerH1.includes("actif")) {
      return "text-green-500";
    }
    if (lowerH1.includes("annul") || lowerH1.includes("cancel")) {
      return "text-red-500";
    }
    if (lowerH1.includes("gain") || lowerH1.includes("revenue") || lowerH1.includes("commission")) {
      return "text-yellow-500";
    }
    if (lowerH1.includes("user") || lowerH1.includes("client")) {
      return "text-blue-500";
    }
    if (lowerH1.includes("chauffeur") || lowerH1.includes("driver")) {
      return "text-purple-500";
    }
    if (lowerH1.includes("course") || lowerH1.includes("booking")) {
      return "text-indigo-500";
    }
    return "text-gray-600";
  };

  const getIconBgStyles = () => {
    const lowerH1 = h1.toLowerCase();
    if (lowerH1.includes("terminee") || lowerH1.includes("completed") || lowerH1.includes("actif")) {
      return "bg-green-100 border-green-200";
    }
    if (lowerH1.includes("annul") || lowerH1.includes("cancel")) {
      return "bg-red-100 border-red-200";
    }
    if (lowerH1.includes("gain") || lowerH1.includes("revenue") || lowerH1.includes("commission")) {
      return "bg-yellow-100 border-yellow-200";
    }
    if (lowerH1.includes("user") || lowerH1.includes("client")) {
      return "bg-blue-100 border-blue-200";
    }
    if (lowerH1.includes("chauffeur") || lowerH1.includes("driver")) {
      return "bg-purple-100 border-purple-200";
    }
    if (lowerH1.includes("course") || lowerH1.includes("booking")) {
      return "bg-indigo-100 border-indigo-200";
    }
    return "bg-gray-100 border-gray-200";
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === "up") return "mdi:trending-up";
    if (trend === "down") return "mdi:trending-down";
    return "mdi:minus";
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend === "up") return "text-green-500";
    if (trend === "down") return "text-red-500";
    return "text-gray-500";
  };

  return (
    <div
      ref={ref}
      className={`${classname} group relative overflow-hidden bg-white dark:bg-neutral-800 shadow-md hover:shadow-xl dark:text-gray-400 ring-1 ring-gray-200 dark:ring-neutral-600 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Decorative accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

      <div className="relative flex items-center justify-between p-5">
        <div className="flex-1">
          <h1 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {h1}
          </h1>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
              {displayNumber}
            </span>
            {trend && trendValue && (
              <span className={`flex items-center text-xs font-medium ${getTrendColor()}`}>
                <Icon icon={getTrendIcon()!} className="w-4 h-4 mr-0.5" />
                {trendValue}
              </span>
            )}
          </div>
          {h3 && (
            <h3 className="text-xs font-medium text-gray-400 mt-1">{h3}</h3>
          )}
        </div>

        <div
          className={`h-14 w-14 flex items-center justify-center rounded-2xl ${getIconBgStyles()} border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
        >
          <Icon
            icon={icon}
            className={`text-2xl ${getIconStyles()} transition-all duration-300`}
          />
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-gray-100/50 to-transparent rounded-tl-full opacity-50" />
    </div>
  );
};
