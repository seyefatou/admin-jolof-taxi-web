import Axios from "./caller";

export type PaiementProps = {
  id: number;
  name: string;
  status: boolean;
};

type PaiementListResponse = {
  message: string;
  status: number;
  data: PaiementProps[];
};

type PaiementOneResponse = {
  message: string;
  status: number;
  data: PaiementProps;
};

const getAll = async () => {
  const res = await Axios.get<PaiementListResponse>(
    `payment_service/paymentMethods`
  );
  return res.data;
};

const getOne = async (id: number) => {
  const res = await Axios.get<PaiementOneResponse>(
    `payment_service/paymentMethods/${id}/detail`
  );
  return res.data;
};

const create = async (name: string) => {
  const res = await Axios.post<PaiementOneResponse>(
    `payment_service/paymentMethods/store`,
    {
      name: name,
      status: true,
    }
  );
  return res.data;
};

const update = async (name: string, id: number, status: boolean) => {
  const res = await Axios.put<PaiementOneResponse>(
    `payment_service/paymentMethods/${id}/update`,
    {
      name: name,
      status: status,
    }
  );
  return res.data;
};

export const SERVICE_PAIEMENT = {
  getAll,
  getOne,
  create,
  update,
};
