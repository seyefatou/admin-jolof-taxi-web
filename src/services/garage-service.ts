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

export type GarageWalletProps = {
  id: number;
  balance: number;
};

export type GarageTransactionProps = {
  id: number;
  transactionId: string;
  type: string;
  libelle: string;
  amount: number;
  status: string;
  date: string;
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

type GarageWalletResponse = {
  message: string;
  status: number;
  data: GarageWalletProps;
};

type GarageTransactionsResponse = {
  message: string;
  status: number;
  data: GarageTransactionProps[];
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

const search = async (terme: string) => {
  const res = await Axios.get<GaragesList>(
    `auth_service/extra/garages/search?search=${encodeURIComponent(terme)}`
  );
  return res.data;
};

const activate = async (code: string, sender: "SMS" | "WHATSAPP") => {
  const res = await Axios.post<GaragesOne>(
    `auth_service/extra/garages/${code}/activate`,
    { sender }
  );
  return res.data;
};

const getWallet = async (code: string) => {
  const res = await Axios.get<GarageWalletResponse>(
    `auth_service/extra/garages/${code}/wallet`
  );
  return res.data;
};

const getWalletTransactions = async (
  code: string,
  page: number = 1,
  limit: number = 10
) => {
  const res = await Axios.get<GarageTransactionsResponse>(
    `auth_service/extra/garages/${code}/wallet/transactions?page=${page}&limit=${limit}`
  );
  return res.data;
};

export const SERVICE_GARAGES = {
  getAll,
  getOne,
  create,
  update,
  search,
  activate,
  getWallet,
  getWalletTransactions,
};
