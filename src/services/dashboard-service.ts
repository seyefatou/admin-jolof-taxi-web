import Axios from "./caller";
import { DashResponse } from "@/types/dashboard-types";

const getDataDash = async () => {
  const res = await Axios.get<DashResponse>("dashboard_service/dashboard");
  return res.data;
};

export const SERVICE_DASH = {
  getDataDash,
};
