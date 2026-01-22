import Axios from "./caller";

export type ClientProps = {
  id: number;
  matricule: string;
  name: string;
  email: string | null;
  phone: string;
  status: string;
  isOnline: boolean;
  avatar: string | null;
  totalRides?: number;
  createdAt?: string;
};

export type CreateClientData = {
  name: string;
  phone: string;
  email?: string;
};

export type UpdateClientData = {
  matricule: string;
  name: string;
  phone: string;
  email?: string;
};

type ClientListResponse = {
  message: string;
  status: number;
  data: ClientProps[];
};

type ClientOneResponse = {
  message: string;
  status: number;
  data: ClientProps;
};

type BaseResponse = {
  message: string;
  status: number;
};

// Liste de tous les clients
const getAll = async () => {
  const res = await Axios.get<ClientListResponse>(
    `auth_service/users/customers`
  );
  return res.data;
};

// Recherche de clients
const search = async (recherche: string) => {
  const res = await Axios.get<ClientListResponse>(
    `auth_service/users/customers/search?search=${recherche}`
  );
  return res.data;
};

// Détails d'un client
const getOne = async (matricule: string) => {
  const res = await Axios.get<ClientOneResponse>(
    `auth_service/users/customers/${matricule}/detail`
  );
  return res.data;
};

// Créer un client
const create = async (data: CreateClientData) => {
  const res = await Axios.post<ClientOneResponse>(
    `auth_service/users/customers/registration`,
    data
  );
  return res.data;
};

// Modifier un client
const update = async (data: UpdateClientData) => {
  const res = await Axios.put<ClientOneResponse>(
    `auth_service/users/customers/registration`,
    data
  );
  return res.data;
};

// Supprimer un client
const remove = async (matricule: string) => {
  const res = await Axios.delete<BaseResponse>(
    `auth_service/users/customers/${matricule}/delete`
  );
  return res.data;
};

// Activer un client
const activate = async (matricule: string) => {
  const res = await Axios.put<ClientOneResponse>(
    `auth_service/users/customers/${matricule}/change_status_account`,
    { status: "ACTIVE" }
  );
  return res.data;
};

// Désactiver un client
const deactivate = async (matricule: string) => {
  const res = await Axios.put<ClientOneResponse>(
    `auth_service/users/customers/${matricule}/change_status_account`,
    { status: "DEACTIVATED" }
  );
  return res.data;
};

// Bannir un client
const ban = async (matricule: string) => {
  const res = await Axios.put<ClientOneResponse>(
    `auth_service/users/customers/${matricule}/change_status_account`,
    { status: "BANNED" }
  );
  return res.data;
};

// Mettre en attente un client
const setPending = async (matricule: string) => {
  const res = await Axios.put<ClientOneResponse>(
    `auth_service/users/customers/${matricule}/change_status_account`,
    { status: "PENDING" }
  );
  return res.data;
};

export const SERVICE_CLIENT = {
  getAll,
  search,
  getOne,
  create,
  update,
  remove,
  activate,
  deactivate,
  ban,
  setPending,
};
