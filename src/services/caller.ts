import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { AxiosCallerUrls } from "@/common/urls/env-axios";

const COOKIE_EXPIRY_DAYS = 7;

const setCookie = (name: string, value: string, days: number) => {
  if (typeof window === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

const Axios: AxiosInstance = axios.create({
  baseURL: AxiosCallerUrls.BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Request interceptor - ajouter le token
Axios.interceptors.request.use((request) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }
  }
  return request;
});

// Response interceptor - refresh token sur 401
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

const forceLogout = () => {
  if (typeof window === "undefined") return;
  localStorage.clear();
  deleteCookie("auth_token");
  window.location.href = "/";
};

Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Si ce n'est pas un 401 ou si c'est deja un retry, rejeter
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Ne pas tenter de refresh sur les endpoints d'auth
    if (
      originalRequest.url?.includes("/signin/") ||
      originalRequest.url?.includes("/refresh")
    ) {
      return Promise.reject(error);
    }

    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("token_refresh");
    if (!refreshToken) {
      forceLogout();
      return Promise.reject(error);
    }

    // Si un refresh est deja en cours, mettre la requete en file d'attente
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(Axios(originalRequest));
          },
          reject: (err: unknown) => {
            reject(err);
          },
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(
        `${AxiosCallerUrls.BASE_URL}auth_service/auth/admin/me/refresh_token`,
        { refresh_token: refreshToken }
      );

      const newAccessToken = res.data?.data?.access_token;
      const newRefreshToken = res.data?.data?.refresh_token;

      if (!newAccessToken) {
        throw new Error("No access token in refresh response");
      }

      // Sauvegarder les nouveaux tokens
      localStorage.setItem("token", newAccessToken);
      setCookie("auth_token", newAccessToken, COOKIE_EXPIRY_DAYS);
      if (newRefreshToken) {
        localStorage.setItem("token_refresh", newRefreshToken);
      }

      processQueue(null, newAccessToken);

      // Rejouer la requete originale avec le nouveau token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return Axios(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default Axios;
