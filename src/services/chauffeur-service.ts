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

export type DocumentTypeInfo = {
  id: number;
  title: string;
  backSide: boolean;
  frontSide: boolean;
  status: boolean;
};

export type DriverDocumentInfo = {
  id: number;
  status: string;
  backImage: string | null;
  frontImage: string | null;
  documentTypeId: number | null;
  driverId: number | null;
  number: string | null;
  DocumentType: DocumentTypeInfo;
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
  driverDocument: DriverDocumentInfo[];
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

export type TrackingDriver = {
  name: string;
  phone: string;
  matricule: string;
  latitude: number | null;
  longitude: number | null;
  vehicule: VehicleInfo[];
};

type TrackingResponse = {
  message: string;
  status: number;
  data: {
    total: number;
    drivers: TrackingDriver[];
  };
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

// Mapper les données de l'API vers le format attendu par le frontend
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapChauffeurData = (driver: any): ChauffeurProps => {
  return {
    id: driver.id,
    matricule: driver.matricule,
    name: driver.fullName || driver.name || "",
    email: driver.email || null,
    phone: driver.phone || "",
    status: driver.status || "PENDING",
    isOnline: driver.isOnline || false,
    avatar: driver.avatar || null,
    rating: driver.rating || 0,
    vehicule: driver.vehicle || driver.vehicule || null,
    wallet: driver.wallet || null,
    garageAffiliation: driver.garage || driver.garageAffiliation || null,
    driverDocument: driver.driverDocument || [],
  };
};

// Liste de tous les chauffeurs
const getAll = async () => {
  const res = await Axios.get<ChauffeurListResponse>(
    `auth_service/users/drivers`
  );
  // Mapper les données pour s'assurer que les champs sont correctement nommés
  const mappedData = res.data.data?.map(mapChauffeurData) || [];
  return {
    ...res.data,
    data: mappedData,
  };
};

// Recherche de chauffeurs
const search = async (recherche: string) => {
  const res = await Axios.get<ChauffeurListResponse>(
    `auth_service/users/drivers/search?search=${recherche}`
  );
  const mappedData = res.data.data?.map(mapChauffeurData) || [];
  return {
    ...res.data,
    data: mappedData,
  };
};

// Chauffeurs en ligne (live tracking)
const getLiveTracking = async () => {
  const res = await Axios.get<TrackingResponse>(
    `auth_service/users/drivers/live_tracking`
  );
  return res.data;
};

// Détails d'un chauffeur
const getOne = async (matricule: string) => {
  const res = await Axios.get<ChauffeurOneResponse>(
    `auth_service/users/drivers/${matricule}/detail`
  );
  return {
    ...res.data,
    data: res.data.data ? mapChauffeurData(res.data.data) : null,
  };
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

// Créer ou modifier un chauffeur (si matricule present dans le FormData, c'est une modification)
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
  // Supprimer les champs undefined pour eviter les erreurs backend
  const body = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
  );
  const res = await Axios.put<ChauffeurOneResponse>(
    `auth_service/users/drivers/registration`,
    body
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
