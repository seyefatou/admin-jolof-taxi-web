"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { PARAMETRES, SERVICE_COURSES } from "@/common/urls/parametres";
import { TRAFIC } from "@/common/urls/trafic";
import { RESERVATIONS } from "@/common/urls/reservations";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { SERVICE_LOGIN } from "@/services/login-service";

interface MenuVerticalProps {
  petitMenu: boolean;
  onToggleMenu: () => void;
}

interface MenuItem {
  path: string;
  text: string;
  icon: string;
  isActive: boolean;
  subText?: string;
}

export const MenuVertical: React.FC<MenuVerticalProps> = ({
  petitMenu,
  onToggleMenu,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsRendered(true);
    if (typeof window !== "undefined") {
      setName(localStorage.getItem("name") || "");
      setRole(localStorage.getItem("role") || "");
      setIsMobile(window.innerWidth < 768);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault();
    SERVICE_LOGIN.IsLogout();
    router.push("/");
  };

  const isPathActive = (path: string): boolean => {
    return pathname.startsWith(path);
  };

  const getParametreDetails = () => {
    if (pathname === `/parametres${PARAMETRES.ADMIN}`) {
      return {
        text: "Gestion Admin",
        icon: "carbon:user-admin",
        subText: "Configuration systeme",
      };
    } else if (pathname === `/parametres${PARAMETRES.CLIENTS}`) {
      return {
        text: "Gestion Clients",
        icon: "carbon:user-profile",
        subText: "Base clientele",
      };
    } else if (pathname === `/parametres${PARAMETRES.CHAUFFEURS}`) {
      return {
        text: "Gestion Chauffeurs",
        icon: "carbon:car",
        subText: "Equipe de conduite",
      };
    }
    return { text: "", icon: "", subText: "" };
  };

  const getDetailsPage = () => {
    if (pathname === `/parametres${PARAMETRES.CHAUFFEUR_DETAILS}/${id}`) {
      return {
        text: "Details Chauffeur",
        icon: "carbon:user-profile-alt",
        subText: "Informations personnelles",
      };
    } else if (
      pathname === `/parametres${PARAMETRES.CHAUFFEURS_DOCUMENTDETAIL}/${id}`
    ) {
      return {
        text: "Documents",
        icon: "carbon:document",
        subText: "Fichiers associes",
      };
    } else if (pathname === `/parametres${PARAMETRES.CLIENTS_DETAILS}/${id}`) {
      return {
        text: "Details Client",
        icon: "carbon:user-avatar",
        subText: "Profil complet",
      };
    }
    return { text: "", icon: "", subText: "" };
  };

  const mainMenuItems: MenuItem[] = [
    {
      path: `/trafic${TRAFIC.trafic_dashboard}`,
      text: "Dashboard",
      subText: "Apercu des activites",
      icon: "carbon:dashboard",
      isActive: isPathActive(`/trafic`),
    },
    {
      path: `/reservations${RESERVATIONS.RESERVATION_LIST}`,
      text: "Courses",
      subText: "Gestion des trajets",
      icon: "fluent:vehicle-cab-20-filled",
      isActive: isPathActive(`/reservations`),
    },
    {
      path: `/tracking${TRAFIC.live_tracking}`,
      text: "Live Tracking",
      subText: "Position des vehicules",
      icon: "gis:map-poi",
      isActive: isPathActive(`/tracking${TRAFIC.live_tracking}`),
    },
    {
      path: `/parametres${PARAMETRES.CLIENTS}`,
      text: "Clients",
      subText: "Gestion des clients",
      icon: "mdi:account-group",
      isActive: isPathActive(`/parametres/clients`),
    },
    {
      path: `/parametres${PARAMETRES.CHAUFFEURS}`,
      text: "Chauffeurs",
      subText: "Gestion des chauffeurs",
      icon: "mdi:account-tie-hat",
      isActive: isPathActive(`/parametres/chauffeurs`),
    },
    {
      path: `/parametres/garages`,
      text: "Garages",
      subText: "Gestion des garages",
      icon: "mdi:garage",
      isActive: isPathActive(`/parametres/garages`),
    },
    {
      path: `/parametres/vehicules`,
      text: "Vehicules",
      subText: "Gestion des vehicules",
      icon: "mdi:car",
      isActive: isPathActive(`/parametres/vehicules`),
    },
    {
      path: `/parametres/roles`,
      text: "Roles",
      subText: "Gestion des permissions",
      icon: "mdi:shield-account",
      isActive: isPathActive(`/parametres/roles`),
    },
    {
      path: `/parametres/paiements`,
      text: "Paiements",
      subText: "Modes de paiement",
      icon: "mdi:credit-card",
      isActive: isPathActive(`/parametres/paiements`),
    },
    {
      path: `/parametres/administrateurs`,
      text: "Administrateurs",
      subText: "Gestion des admins",
      icon: "mdi:account-tie",
      isActive: isPathActive(`/parametres/administrateurs`),
    },
    {
      path: `/finance`,
      text: "Finance",
      subText: "Rapports financiers",
      icon: "mdi:finance",
      isActive: isPathActive(`/finance`),
    },
    {
      path: `/settings`,
      text: "Parametres",
      subText: "Configuration systeme",
      icon: "mdi:cog",
      isActive: isPathActive(`/settings`),
    },
  ];

  const mainMenuItem2: MenuItem[] = [
    {
      path: `/service-courses`,
      text: "Service Courses",
      subText: "Gestion des services",
      icon: "ic:round-miscellaneous-services",
      isActive: isPathActive(`/service-courses`),
    },
    {
      path: `/profil`,
      text: "Mon Profil",
      subText: "Informations personnelles",
      icon: "mdi:account-circle",
      isActive: isPathActive(`/profil`),
    },
  ];

  const paramDetails = getParametreDetails();
  const detailsPage = getDetailsPage();

  const mobileHidden = isMobile && !petitMenu;

  return (
    <>
      {isMobile && petitMenu && (
        <div
          className="fixed inset-0 z-20 bg-yellow-300 bg-opacity-50"
          onClick={onToggleMenu}
        />
      )}

      <aside
        className={`fixed z-30 h-screen bg-white border-gray-100 border-r transition-all duration-500 ease-in-out ${
          petitMenu ? (isMobile ? "w-64" : "w-24") : "w-60"
        } ${isRendered ? "translate-x-0" : "-translate-x-full"} ${
          mobileHidden ? "-translate-x-full" : "translate-x-0"
        } flex flex-col`}
      >
        <div className="absolute top-0 right-0 w-0.5 h-full opacity-70"></div>

        <div className="relative flex flex-col h-full">
          {/* Logo - fixe en haut */}
          <div className="relative z-10 flex-shrink-0 py-6">
            <div className="relative flex flex-col items-center justify-center mb-4">
              <div
                className={`flex flex-col items-center justify-center transition-all duration-500 ${
                  petitMenu && !isMobile ? "scale-90" : "scale-100"
                }`}
              >
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-yellow-500 rounded-full opacity-30 animate-pulse"></div>
                  <Image
                    src="/logos/jolof.svg"
                    alt="Jolof Taxi Logo"
                    width={56}
                    height={56}
                    className="relative z-10 w-14 h-14"
                  />
                </div>

                <div
                  className={`overflow-hidden items-center justify-center transition-all duration-500 ${
                    petitMenu && !isMobile ? "h-0" : "h-10"
                  }`}
                >
                  <h1 className="text-xl font-bold text-black bg-clip-text animate-gradient">
                    Jolof Taxi
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation - scrollable */}
          <nav className="relative z-10 flex-1 px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <ul className="space-y-2 pb-4">
                {mainMenuItems.map((item) => (
                  <li key={item.path} className="group">
                    <Link
                      href={item.path}
                      className={`relative mb-4 flex items-center gap-3 w-full p-3 transition-all duration-300 rounded-lg overflow-hidden ${
                        item.isActive && !isPathActive(`/parametres/${id}`)
                          ? "bg-gradient-to-r border border-gray-200 shadow-md bg-gray-100 text-black"
                          : "hover:shadow-md border border-gray-200 text-gray-800 hover:bg-gray-100"
                      }`}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {hoveredItem === item.path && !item.isActive && (
                        <div className="absolute inset-0 overflow-hidden bg-gray-200/30">
                          <div className="absolute left-0 w-4 h-4 rounded-full top-1/2 bg-yellow-200/10 animate-ping"></div>
                        </div>
                      )}

                      <div
                        className={`flex-shrink-0 transition-all duration-300 ${
                          item.isActive ? "text-black" : "text-gray-800"
                        } ${
                          petitMenu && !isMobile ? "mx-auto text-xl" : "text-lg"
                        }`}
                      >
                        <Icon
                          icon={item.icon}
                          className={`transition-transform duration-300 ${
                            hoveredItem === item.path
                              ? "scale-110"
                              : "scale-100"
                          }`}
                        />
                      </div>

                      <div
                        className={`transition-all duration-500 ${
                          petitMenu && !isMobile
                            ? "opacity-0 w-0"
                            : "opacity-100 w-auto"
                        } overflow-hidden whitespace-nowrap`}
                      >
                        <span className="block font-medium">{item.text}</span>
                        <span className="text-xs opacity-80">
                          {item.subText}
                        </span>
                      </div>

                      {item.isActive && !isPathActive(`/parametres/${id}`) && (
                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      )}

                      <div
                        className={`absolute bottom-0 left-0 h-0.5 bg-yellow-400 transition-all duration-500 ${
                          hoveredItem === item.path && !item.isActive
                            ? "w-full"
                            : "w-0"
                        }`}
                      ></div>
                    </Link>
                  </li>
                ))}

                {mainMenuItem2.map((item) => (
                  <li key={item.path} className="group">
                    <Link
                      href={item.path}
                      className={`relative mb-4 flex items-center gap-3 w-full p-3 transition-all duration-300 rounded-lg overflow-hidden ${
                        item.isActive && !isPathActive(`/parametres/${id}`)
                          ? "bg-gradient-to-r border border-gray-200 shadow-md bg-gray-100 text-black"
                          : "hover:shadow-md border border-gray-200 text-gray-800 hover:bg-gray-100"
                      }`}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {hoveredItem === item.path && !item.isActive && (
                        <div className="absolute inset-0 overflow-hidden bg-gray-200/30">
                          <div className="absolute left-0 w-4 h-4 rounded-full top-1/2 bg-yellow-200/10 animate-ping"></div>
                        </div>
                      )}

                      <div
                        className={`flex-shrink-0 transition-all duration-300 ${
                          item.isActive ? "text-black" : "text-gray-800"
                        } ${
                          petitMenu && !isMobile
                            ? "mx-auto text-xl"
                            : "text-lg"
                        }`}
                      >
                          <Icon
                            icon={item.icon}
                            className={`transition-transform duration-300 ${
                              hoveredItem === item.path
                                ? "scale-110"
                                : "scale-100"
                            }`}
                          />
                        </div>

                        <div
                          className={`transition-all duration-500 ${
                            petitMenu && !isMobile
                              ? "opacity-0 w-0"
                              : "opacity-100 w-auto"
                          } overflow-hidden whitespace-nowrap`}
                        >
                          <span className="block font-medium">{item.text}</span>
                          <span className="text-xs opacity-80">
                            {item.subText}
                          </span>
                        </div>

                        {item.isActive && !isPathActive(`/parametres/${id}`) && (
                          <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                        )}

                      <div
                        className={`absolute bottom-0 left-0 h-0.5 bg-yellow-400 transition-all duration-500 ${
                          hoveredItem === item.path && !item.isActive
                            ? "w-full"
                            : "w-0"
                        }`}
                      ></div>
                    </Link>
                  </li>
                ))}

                {paramDetails.text && (
                  <li className="group">
                    <a
                      href="#"
                      className="relative flex items-center w-full gap-3 p-3 overflow-hidden text-black transition-all duration-300 bg-gray-100 border border-gray-200 rounded-lg shadow-md"
                    >
                      <div
                        className={`flex-shrink-0 text-black ${
                          petitMenu && !isMobile ? "mx-auto text-xl" : "text-lg"
                        }`}
                      >
                        <Icon icon={paramDetails.icon} />
                      </div>

                      <div
                        className={`transition-all duration-500 ${
                          petitMenu && !isMobile
                            ? "opacity-0 w-0"
                            : "opacity-100 w-auto"
                        } overflow-hidden whitespace-nowrap`}
                      >
                        <span className="block font-medium">
                          {paramDetails.text}
                        </span>
                        <span className="text-xs opacity-80">
                          {paramDetails.subText}
                        </span>
                      </div>

                      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    </a>
                  </li>
                )}

                {detailsPage.text && (
                  <li className="group">
                    <a
                      href="#"
                      className="relative flex items-center w-full gap-3 p-3 overflow-hidden text-black transition-all duration-300 bg-gray-100 border border-gray-200 rounded-lg shadow-md"
                    >
                      <div
                        className={`flex-shrink-0 text-gray-900 ${
                          petitMenu && !isMobile ? "mx-auto text-xl" : "text-lg"
                        }`}
                      >
                        <Icon icon={detailsPage.icon} />
                      </div>

                      <div
                        className={`transition-all duration-500 ${
                          petitMenu && !isMobile
                            ? "opacity-0 w-0"
                            : "opacity-100 w-auto"
                        } overflow-hidden whitespace-nowrap`}
                      >
                        <span className="block font-medium">
                          {detailsPage.text}
                        </span>
                        <span className="text-xs opacity-80">
                          {detailsPage.subText}
                        </span>
                      </div>

                      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    </a>
                  </li>
                )}
            </ul>
          </nav>

          {/* Section bas - fixe en bas */}
          <div className="relative z-10 flex-shrink-0 px-4 py-4 border-t border-gray-100">
            <div
              className={`mb-4 transition-all shadow-md rounded-lg duration-500 overflow-hidden ${
                petitMenu && !isMobile
                  ? "max-h-0 opacity-0"
                  : "max-h-40 opacity-100"
              }`}
            >
              <div className="p-3 bg-white border border-gray-200 rounded-lg backdrop-blur-sm">
                <h4 className="flex items-center mb-2 text-sm font-medium text-gray-900">
                  <Icon icon="carbon:chart-line" className="mr-2 text-gray-900" />
                  Apercu rapide
                </h4>
                <div className="flex justify-between text-xs text-gray-700">
                  <div>
                    <p>Courses aujourd&apos;hui</p>
                    <p className="text-lg font-medium text-yellow-400">0</p>
                  </div>
                  <div>
                    <p>En attente</p>
                    <p className="text-lg font-medium text-yellow-500">0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton de deconnexion */}
            <form onSubmit={handleLogout}>
              <button
                type="submit"
                className="relative flex items-center justify-center w-full gap-3 px-4 py-3 overflow-hidden text-gray-800 transition-all duration-300 border border-gray-200 rounded-lg shadow-md bg-gradient-to-r from-yellow-300 to-yellow-300 hover:text-yellow-400 group"
              >
                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-red-700/10 to-red-800/10 group-hover:opacity-100"></div>

                <Icon
                  icon="carbon:logout"
                  className={`text-lg transition-all duration-300 ${
                    petitMenu && !isMobile ? "mx-auto scale-125" : ""
                  } group-hover:scale-110`}
                />

                <span
                  className={`font-medium transition-all duration-500 ${
                    petitMenu && !isMobile
                      ? "opacity-0 w-0 overflow-hidden"
                      : "opacity-100"
                  }`}
                >
                  Deconnexion
                </span>
              </button>
            </form>

            <div
              className={`mt-4 text-center transition-all duration-500 ${
                petitMenu && !isMobile ? "opacity-0" : "opacity-60"
              }`}
            >
              <p className="text-xs text-gray-500">Jolof Taxi v2.0.7</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
