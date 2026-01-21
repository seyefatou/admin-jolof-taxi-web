import Axios from "./caller";

export type GaragesProps = {
  id: number;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  responsiblePerson: string;
  status: boolean;
  phoneNumber: string;
};

type GaragesList = {
  message: string;
  status: number;
  data: GaragesProps[];
};

type GaragesOne = {
  message: string;
  status: number;
  data: GaragesProps;
};

const getAll = async () => {
  const res = await Axios.get<GaragesList>(`auth_service/extra/garages`);
  return res.data;
};

const getOne = async (code_garage: string) => {
  const res = await Axios.get<GaragesOne>(
    `auth_service/extra/garages/${code_garage}/detail`
  );
  return res.data;
};

const create = async (
  name: string,
  address: string,
  latitude: number,
  longitude: number,
  city: string,
  responsiblePerson: string,
  status: boolean,
  phoneNumber: string
) => {
  const res = await Axios.post<GaragesOne>(`auth_service/extra/garages/add`, {
    name,
    address,
    latitude,
    longitude,
    city,
    responsiblePerson,
    status,
    phoneNumber,
  });
  return res.data;
};

const update = async (
  code_garage: string,
  name: string,
  address: string,
  latitude: number,
  longitude: number,
  city: string,
  responsiblePerson: string,
  status: boolean,
  phoneNumber: string
) => {
  const res = await Axios.put<GaragesOne>(
    `auth_service/extra/garages/${code_garage}/update`,
    {
      name,
      address,
      latitude,
      longitude,
      city,
      responsiblePerson,
      status,
      phoneNumber,
    }
  );
  return res.data;
};

export const SERVICE_GARAGES = {
  getAll,
  getOne,
  create,
  update,
};
