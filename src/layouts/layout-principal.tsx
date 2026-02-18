"use client";

import { ReactNode, useEffect, useState } from "react";
import { Header } from "./header";
import { MenuVertical } from "./menu-vertical";
import { useRouter } from "next/navigation";
import { SERVICE_LOGIN } from "@/services/login-service";

interface LayoutGlobalProps {
  children: ReactNode;
}

export const LayoutGlobal: React.FC<LayoutGlobalProps> = ({ children }) => {
  const router = useRouter();
  const [menuPetit, setMenuPetit] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("burger");
      setMenuPetit(savedState ? savedState === "true" : false);
      setIsMobile(window.innerWidth < 768);
      setIsLoaded(true);
    }
  }, []);

  // TODO: Décommenter après test - Vérification auth désactivée temporairement
  // useEffect(() => {
  //   const isloged = SERVICE_LOGIN.isLoggedIn();
  //   if (!isloged) {
  //     router.push(`/`);
  //   }
  // }, [router]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (mobile && !menuPetit) {
        setMenuPetit(true);
        localStorage.setItem("burger", "true");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuPetit]);

  const handleToggleMenu = () => {
    const newMenuState = !menuPetit;
    localStorage.setItem("burger", newMenuState.toString());
    setMenuPetit(newMenuState);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-neutral-800">
      {/* Menu vertical */}
      <MenuVertical petitMenu={menuPetit} onToggleMenu={handleToggleMenu} />

      {/* Contenu principal */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-500 ${
          isMobile ? "ml-0" : menuPetit ? "ml-24" : "ml-60"
        }`}
      >
        {/* Header */}
        <Header menuPetit={menuPetit} setMenuPetit={setMenuPetit} />

        {/* Zone de contenu principal */}
        <main className="flex-1 p-4 mt-16 transition-all duration-500 bg-white md:p-6 overflow-x-hidden">
          <div className="w-full min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
};
