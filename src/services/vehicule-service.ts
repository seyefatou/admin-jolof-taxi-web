import Axios from "./caller";
import { GaragesProps } from "./garage-service";

type Tarifs = {
  minKm: number;
  maxKm: number;
  pricePerKm: number;
};

export type VehiculeTypeResp = {
  id: number;
  type: string;
  image: string;
  priceKm?: number;
  ratePrice: number;
  priceMn: number;
  status: boolean;
  tarifs: Tarifs[];
};

type Addresse = {
  city: string;
  latitude: number;
  longitude: number;
};

type Owner = {
  id: number;
  name: string;
  matricule: string;
  email: string | null;
  phone: string;
  address: Addresse;
  status: string;
  isOnline: boolean;
  avatar: string | null;
  garageAffiliation: GaragesProps | null;
};

export type VehiculeResp = {
  id: number;
  brand: string;
  model: string;
  year: number;
  licensePlateNumber: string;
  licenseNumber: string;
  isAvailable: boolean;
  color: string | null;
  status: string;
  owner: Owner;
};

type ResponseVehiculeTypeList = {
  message: string;
  status: number;
  data: VehiculeTypeResp[];
};

type ResponseVehiculeTypeOne = {
  message: string;
  status: number;
  data: VehiculeTypeResp;
};

type ResponseVehiculeList = {
  message: string;
  status: number;
  data: VehiculeResp[];
};

const createType = async (formData: FormData) => {
  const res = await Axios.post(`booking_service/type_vehicules/add`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

const updateType = async (formData: FormData, id: number) => {
  const res = await Axios.put(
    `booking_service/type_vehicules/${id}/update`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};

const getTypeList = async () => {
  const res = await Axios.get<ResponseVehiculeTypeList>(
    `booking_service/type_vehicules`
  );
  return res.data;
};

const getTypeOne = async (id: number) => {
  const res = await Axios.get<ResponseVehiculeTypeOne>(
    `booking_service/type_vehicules/${id}/detail`
  );
  return res.data;
};

const getAll = async () => {
  const res = await Axios.get<ResponseVehiculeList>(`auth_service/users/vehicles`);
  return res.data;
};

const updateTypeStatus = async (id: number) => {
  const res = await Axios.put(`booking_service/type_vehicules/${id}/change-status`, {
    status: "ACTIVE",
  });
  return res.data;
};

export const SERVICE_VEHICULES = {
  createType,
  updateType,
  getTypeList,
  getTypeOne,
  getAll,
  updateTypeStatus,
};
