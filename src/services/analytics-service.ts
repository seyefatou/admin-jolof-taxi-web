import Axios from "./caller";

export type AnalyticsPeriod = "today" | "week" | "month";
export type HeatmapType = "pickup" | "dropoff";

export type ServiceRateResp = {
  total: number;
  completed: number;
  rate: number;
};

export type AcceptanceRateResp = {
  total: number;
  accepted: number;
  rate: number;
};

export type CancellationRateResp = {
  total: number;
  cancelled_by_client: number;
  cancelled_by_driver: number;
  cancelled_by_system: number;
  rate_client: number;
  rate_driver: number;
};

export type WaitTimeResp = {
  average_minutes: number;
  sample_size: number;
};

export type ClientsAnalyticsResp = {
  active: number;
  recurring: number;
  new_clients: number;
  returning_clients: number;
};

export type ActiveDriversResp = {
  active: number;
  with_completed_ride: number;
};

export type HeatmapPoint = {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  count?: number;
  weight?: number;
  [key: string]: unknown;
};

export type DriversOnlineByHourEntry = {
  hour: number;
  count: number;
};

type ApiEnvelope<T> = {
  message?: string;
  status?: number;
  data: T;
};

const getServiceRate = async (period: AnalyticsPeriod = "today") => {
  const res = await Axios.get<ApiEnvelope<ServiceRateResp>>(
    `booking_service/analytics/service-rate`,
    { params: { period } }
  );
  return res.data;
};

const getAcceptanceRate = async (period: AnalyticsPeriod = "today") => {
  const res = await Axios.get<ApiEnvelope<AcceptanceRateResp>>(
    `booking_service/analytics/acceptance-rate`,
    { params: { period } }
  );
  return res.data;
};

const getCancellationRate = async (period: AnalyticsPeriod = "today") => {
  const res = await Axios.get<ApiEnvelope<CancellationRateResp>>(
    `booking_service/analytics/cancellation-rate`,
    { params: { period } }
  );
  return res.data;
};

const getWaitTime = async (period: AnalyticsPeriod = "today") => {
  const res = await Axios.get<ApiEnvelope<WaitTimeResp>>(
    `booking_service/analytics/wait-time`,
    { params: { period } }
  );
  return res.data;
};

const getClientsAnalytics = async (period: AnalyticsPeriod = "today") => {
  const res = await Axios.get<ApiEnvelope<ClientsAnalyticsResp>>(
    `booking_service/analytics/clients`,
    { params: { period } }
  );
  return res.data;
};

const getActiveDrivers = async (period: AnalyticsPeriod = "today") => {
  const res = await Axios.get<ApiEnvelope<ActiveDriversResp>>(
    `booking_service/analytics/active-drivers`,
    { params: { period } }
  );
  return res.data;
};

const getHeatmap = async (type: HeatmapType = "pickup") => {
  const res = await Axios.get<ApiEnvelope<HeatmapPoint[]>>(
    `booking_service/analytics/heatmap`,
    { params: { type } }
  );
  return res.data;
};

const getDriversOnlineByHour = async () => {
  const res = await Axios.get<ApiEnvelope<DriversOnlineByHourEntry[]>>(
    `auth_service/statistics/drivers/online-by-hour`
  );
  return res.data;
};

export const SERVICE_ANALYTICS = {
  getServiceRate,
  getAcceptanceRate,
  getCancellationRate,
  getWaitTime,
  getClientsAnalytics,
  getActiveDrivers,
  getHeatmap,
  getDriversOnlineByHour,
};
