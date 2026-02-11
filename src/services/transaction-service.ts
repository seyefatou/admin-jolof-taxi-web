import Axios from "./caller";

export type TransactionProps = {
  id: number;
  transactionId: string;
  type: string;
  libelle: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paymentReference: string;
  date: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapTransaction = (raw: any): TransactionProps => ({
  id: raw.id,
  transactionId: raw.transactionId || raw.transaction_id || raw.id?.toString() || "",
  type: raw.type || "",
  libelle: raw.libelle || raw.label || raw.description || "",
  amount: raw.amount || 0,
  paymentMethod:
    typeof raw.paymentMethod === "object" && raw.paymentMethod !== null
      ? raw.paymentMethod.name || ""
      : raw.paymentMethod || raw.payment_method || "",
  status: raw.status || "",
  paymentReference: raw.paymentReference || raw.payment_reference || "",
  date: raw.date || raw.created_at || raw.createdAt || "",
});

type TransactionListResponse = {
  message: string;
  status: number;
  data: TransactionProps[];
};

const getAll = async () => {
  const res = await Axios.get(`payment_service/transactions`);

  // API can return: direct array, { data: [...] }, or { data: { data: [...] } }
  let rawData: unknown[];
  if (Array.isArray(res.data)) {
    rawData = res.data;
  } else if (Array.isArray(res.data?.data?.data)) {
    rawData = res.data.data.data;
  } else if (Array.isArray(res.data?.data)) {
    rawData = res.data.data;
  } else {
    rawData = [];
  }

  const mapped: TransactionProps[] = rawData.map(mapTransaction);

  // Sort by most recent first
  mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    message: res.data?.message || "",
    status: res.data?.status || res.status,
    data: mapped,
  } as TransactionListResponse;
};

export const SERVICE_TRANSACTION = {
  getAll,
};
