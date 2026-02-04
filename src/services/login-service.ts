import { UserResponse, LoginResponse } from "@/types/login-types";
import Axios from "./caller";

// Durée du cookie en jours
const COOKIE_EXPIRY_DAYS = 7;

// Fonction pour définir un cookie
const setCookie = (name: string, value: string, days: number) => {
  if (typeof window === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

// Fonction pour supprimer un cookie
const deleteCookie = (name: string) => {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

// Fonction pour récupérer un cookie
const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null;
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const saveToken = (token: string) => {
  localStorage.setItem("token", token);
  // Sauvegarder aussi dans un cookie pour le middleware
  setCookie("auth_token", token, COOKIE_EXPIRY_DAYS);
};

const refreshToken = (token: string) => {
  localStorage.setItem("token_refresh", token);
};

const isLoggedIn = () => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token");
  if (!token) return false;
  return true;
};

const IsLogout = () => {
  localStorage.clear();
  // Supprimer le cookie d'authentification
  deleteCookie("auth_token");
};

const login = async (identifiant: string, password: string) => {
  try {
    const res = await Axios.post<LoginResponse>(
      "auth_service/auth/admin/signin/identifier",
      {
        identifier: identifiant,
        password: password,
      }
    );
    console.log("Login response:", res);
    return res.data;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

const infoConnectUserUpdate = async (
  name_admin: string,
  email_admin: string,
  phone_number_admin: string,
  address_admin: string
) => {
  try {
    const res = await Axios.put<UserResponse>(
      "/auth_service/auth/admin/me/update_profile",
      {
        name: name_admin,
        email: email_admin,
        phone: phone_number_admin,
        adresse: address_admin,
      }
    );
    console.log("User info response:", res);
    return res;
  } catch (error) {
    console.error("Error during getinfoConnectUser:", error);
    throw error;
  }
};

const getinfoConnectUser = async () => {
  try {
    const res = await Axios.get<UserResponse>("auth_service/auth/admin/me", {});
    console.log("User info response:", res);
    return res;
  } catch (error) {
    console.error("Error during getinfoConnectUser:", error);
    throw error;
  }
};

export const SERVICE_LOGIN = {
  saveToken,
  refreshToken,
  isLoggedIn,
  login,
  IsLogout,
  getinfoConnectUser,
  infoConnectUserUpdate,
};
