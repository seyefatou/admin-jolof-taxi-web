import axios, { AxiosInstance } from "axios";
import { AxiosCallerUrls } from "@/common/urls/env-axios";

const Axios: AxiosInstance = axios.create({
  baseURL: AxiosCallerUrls.BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

Axios.interceptors.request.use((request) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }
  }
  return request;
});

export default Axios;
