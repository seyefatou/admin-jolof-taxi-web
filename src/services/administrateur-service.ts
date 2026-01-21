import Axios from "./caller";

type Role = {
  id: number;
  codeRole: string;
  nameRole: string;
};

export type AdminProps = {
  name: string;
  matricule: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  role: Role;
};

type AdminListResponse = {
  message: string;
  status: number;
  data: AdminProps[];
};

type AdminOneResponse = {
  message: string;
  status: number;
  data: AdminProps;
};

const getAll = async (recherche: string = "") => {
  const res = await Axios.get<AdminListResponse>(
    `auth_service/users/admins/search?search=${recherche}`
  );
  return res.data;
};

const getOne = async (matricule: string) => {
  const res = await Axios.get<AdminOneResponse>(
    `auth_service/users/admins/${matricule}/detail`
  );
  return res.data;
};

const create = async (
  name: string,
  email: string,
  phone: string,
  address: string
) => {
  const res = await Axios.post<AdminOneResponse>(
    `auth_service/users/admins/register`,
    {
      name,
      email,
      phone,
      address,
      role: "Sudo",
      status: "ACTIVE",
    }
  );
  return res.data;
};

const update = async (
  matricule: string,
  name: string,
  email: string,
  phone: string,
  address: string
) => {
  const res = await Axios.put<AdminOneResponse>(
    `auth_service/users/admins/${matricule}/update`,
    {
      name,
      email,
      phone,
      address,
    }
  );
  return res.data;
};

const updateStatus = async (
  matricule: string,
  status: "ACTIVE" | "DEACTIVATED" | "BANNED"
) => {
  const res = await Axios.put<AdminOneResponse>(
    `auth_service/users/admins/${matricule}/change_status_account`,
    {
      status,
    }
  );
  return res.data;
};

export const SERVICE_ADMINISTRATEUR = {
  getAll,
  getOne,
  create,
  update,
  updateStatus,
};
