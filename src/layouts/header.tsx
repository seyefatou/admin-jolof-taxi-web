"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Image from "next/image";

type HeaderProps = {
  menuPetit: boolean;
  setMenuPetit: (e: boolean) => void;
};

export const Header: React.FC<HeaderProps> = ({ menuPetit, setMenuPetit }) => {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setName(localStorage.getItem("name") || "");
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fermer le menu profil quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const toggleMenu = () => {
    localStorage.setItem("burger", `${!menuPetit}`);
    setMenuPetit(!menuPetit);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    router.push("/");
  };

  return (
    <header
      className={`fixed transition-all z-40 border-b duration-500 flex items-center justify-between h-16 bg-white ${
        menuPetit ? "w-[calc(100%-6rem)]" : "w-[calc(100%-15rem)]"
      } ml-auto`}
    >
      {/* Gauche */}
      <div className="flex items-center px-6">
        <button onClick={toggleMenu}>
          <Icon
            icon="carbon:menu"
            className="text-xl text-gray-700 transition-all duration-300 dark:text-yellow-300"
          />
        </button>

        <div className="ml-4">
          <h2 className="text-lg font-semibold text-yellow-300">Dashboard</h2>
          <p className="text-xs text-gray-500">
            Bienvenue, {name || "Utilisateur"}
          </p>
        </div>
      </div>

      {/* Droite */}
      <div className="flex items-center mr-6 space-x-4">
        <Icon
          icon="ion:chevron-back-circle"
          className="cursor-pointer text-neutral-800 rounded-full"
          onClick={() => router.back()}
          height="36"
        />
        <Icon
          icon="ion:chevron-forward-circle"
          className="cursor-pointer text-neutral-800 rounded-full"
          onClick={() => router.forward()}
          height="36"
        />

        {/* Heure actuelle */}
        <div className="hidden px-3 py-1 mr-2 font-mono text-sm text-yellow-300 rounded-full bg-neutral-800 md:block">
          {formattedTime}
        </div>

        {/* Avatar */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={toggleProfile}
            className="relative overflow-hidden transition-all duration-300 transform rounded-full ring-2 ring-yellow-300 hover:ring-yellow-300 hover:scale-110 focus:outline-none"
          >
            <Image
              src={`https://ui-avatars.com/api/?name=${
                name || "User"
              }&background=FFF100&color=333`}
              alt="Profile"
              width={40}
              height={40}
              className="w-10 h-10"
            />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div
              className="absolute right-0 z-50 w-56 mt-2 transition-all duration-300 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fadeIn"
              role="menu"
            >
              <div className="py-2">
                {/* En-tete du profil */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    {name || "Utilisateur"}
                  </p>
                  <p className="text-xs text-gray-500">Connecte</p>
                </div>

                {/* Liens rapides */}
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    router.push("/profil");
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-yellow-100"
                >
                  <Icon icon="carbon:user-avatar" className="mr-3 text-yellow-300" />
                  Mon profil
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    router.push("/parametres/administrateurs");
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-yellow-100"
                >
                  <Icon icon="carbon:settings" className="mr-3 text-yellow-300" />
                  Parametres
                </button>

                {/* Separateur */}
                <div className="my-1 border-t border-gray-200"></div>

                {/* Deconnexion */}
                <form onSubmit={handleLogout}>
                  <button
                    type="submit"
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-red-100"
                  >
                    <Icon icon="carbon:logout" className="mr-3 text-red-500" />
                    Deconnexion
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
