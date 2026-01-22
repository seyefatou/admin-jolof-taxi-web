import Axios from "./caller";

export type VehicleInfo = {
  id: number;
  brand: string;
  model: string;
  type: string | null;
  year: number;
  licensePlateNumber: string;
  licenseNumber: string;
  status: string;
  color: string | null;
  isAvailable: boolean;
};

export type WalletInfo = {
  id: number;
  balance: string;
};

export type GarageInfo = {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string;
};

export type ChauffeurProps = {
  id: number;
  matricule: string;
  name: string;
  email: string | null;
  phone: string;
  status: string;
  isOnline: boolean;
  avatar: string | null;
  rating: number;
  vehicule: VehicleInfo | null;
  wallet: WalletInfo | null;
  garageAffiliation: GarageInfo | null;
};

export type CreateChauffeurData = {
  fullName: string;
  phone: string;
  gender: string;
  address: string;
  latitude: number;
  longitude: number;
  have_vehicule: boolean;
  garageId?: number;
  // Vehicle info (if have_vehicule)
  brand?: string;
  model?: string;
  year?: string;
  typeService?: string;
  licensePlate?: string;
  licenseNumber?: string;
  // Files
  file_permit_recto?: File;
  file_permit_verso?: File;
  file_car_registration_recto?: File;
  file_car_registration_verso?: File;
  file_booklet?: File;
};

export type UpdateChauffeurData = {
  matricule: string;
  name: string;
  phone: string;
  email?: string;
  garageId?: number;
};

type ChauffeurListResponse = {
  message: string;
  status: number;
  data: ChauffeurProps[];
};

type ChauffeurOneResponse = {
  message: string;
  status: number;
  data: ChauffeurProps;
};

type BaseResponse = {
  message: string;
  status: number;
};

// Liste de tous les chauffeurs
const getAll = async () => {
  const res = await Axios.get<ChauffeurListResponse>(
    `auth_service/users/drivers`
  );
  return res.data;
};

// Recherche de chauffeurs
const search = async (recherche: string) => {
  const res = await Axios.get<ChauffeurListResponse>(
    `auth_service/users/drivers/search?search=${recherche}`
  );
  return res.data;
};

// Chauffeurs en ligne (live tracking)
const getLiveTracking = async () => {
  const res = await Axios.get<ChauffeurListResponse>(
    `auth_service/users/drivers/live_tracking`
  );
  return res.data;
};

// Détails d'un chauffeur
const getOne = async (matricule: string) => {
  const res = await Axios.get<ChauffeurOneResponse>(
    `auth_service/users/drivers/${matricule}/detail`
  );
  return res.data;
};

// Activer un chauffeur
const activate = async (matricule: string) => {
  const res = await Axios.put<ChauffeurOneResponse>(
    `auth_service/users/drivers/${matricule}/change_status_account`,
    { status: "ACTIVE" }
  );
  return res.data;
};

// Désactiver un chauffeur
const deactivate = async (matricule: string) => {
  const res = await Axios.put<ChauffeurOneResponse>(
    `auth_service/users/drivers/${matricule}/change_status_account`,
    { status: "DEACTIVATED" }
  );
  return res.data;
};

// Bannir un chauffeur
const ban = async (matricule: string) => {
  const res = await Axios.put<ChauffeurOneResponse>(
    `auth_service/users/drivers/${matricule}/change_status_account`,
    { status: "BANNED" }
  );
  return res.data;
};

// Créer un chauffeur
const create = async (formData: FormData) => {
  const res = await Axios.post<ChauffeurOneResponse>(
    `auth_service/users/drivers/registration`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};

// Modifier un chauffeur
const update = async (data: UpdateChauffeurData) => {
  const res = await Axios.put<ChauffeurOneResponse>(
    `auth_service/users/drivers/registration`,
    data
  );
  return res.data;
};

// Supprimer un chauffeur
const remove = async (matricule: string) => {
  const res = await Axios.delete<BaseResponse>(
    `auth_service/users/drivers/${matricule}/delete`
  );
  return res.data;
};

// Mettre en attente un chauffeur
const setPending = async (matricule: string) => {
  const res = await Axios.put<ChauffeurOneResponse>(
    `auth_service/users/drivers/${matricule}/change_status_account`,
    { status: "PENDING" }
  );
  return res.data;
};

export const SERVICE_CHAUFFEUR = {
  getAll,
  search,
  getLiveTracking,
  getOne,
  activate,
  deactivate,
  ban,
  create,
  update,
  remove,
  setPending,
};
