import Axios from "./caller";

export type ConfigProps = {
  key: string;
  value: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ResponseConfigList = {
  message: string;
  status: number;
  data: ConfigProps[];
};

type ResponseConfigOne = {
  message: string;
  status: number;
  data: ConfigProps;
};

const getAll = async () => {
  const res = await Axios.get<ResponseConfigList>(`booking_service/config`);
  return res.data;
};

const update = async (key: string, value: string) => {
  const res = await Axios.patch<ResponseConfigOne>(
    `booking_service/config/${key}`,
    { value }
  );
  return res.data;
};

const seed = async () => {
  const res = await Axios.get(`booking_service/config/seed`);
  return res.data;
};

export const SERVICE_CONFIG = {
  getAll,
  update,
  seed,
};
