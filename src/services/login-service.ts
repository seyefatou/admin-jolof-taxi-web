import { UserResponse, LoginResponse } from "@/types/login-types";
import Axios from "./caller";

const saveToken = (token: string) => {
  localStorage.setItem("token", token);
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
