import Axios from "./caller";

export type LocationInfo = {
  address: string;
  latitude: number;
  longitude: number;
};

export type UserInfo = {
  matricule: string;
  name: string;
  phone: string;
  avatar?: string | null;
};

export type PaymentMethodInfo = {
  id: number;
  name: string;
  code?: string;
};

export type CourseProps = {
  id: number;
  code_booking: string;
  customer: UserInfo;
  driver: UserInfo | null;
  pickup_location: LocationInfo;
  dropoff_location: LocationInfo;
  status: string;
  payment_method: PaymentMethodInfo | null;
  payment_status?: string;
  price: number;
  distance: number;
  duration: number;
  commission: number;
  rating?: number;
  review?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
};

type CourseListResponse = {
  message: string;
  status: number;
  data: CourseProps[];
};

type CourseOneResponse = {
  message: string;
  status: number;
  data: CourseProps;
};

type CourseStatsResponse = {
  message: string;
  status: number;
  data: {
    total: number;
    done: number;
    pending: number;
    in_progress: number;
    canceled: number;
    total_revenue: number;
    total_commission: number;
  };
};

type BaseResponse = {
  message: string;
  status: number;
};

// Liste des courses avec filtres
const getAll = async (params?: {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.status && params.status !== "ALL") {
    queryParams.append("status", params.status);
  }
  if (params?.date_from) {
    queryParams.append("date_from", params.date_from);
  }
  if (params?.date_to) {
    queryParams.append("date_to", params.date_to);
  }
  if (params?.search) {
    queryParams.append("search", params.search);
  }

  const res = await Axios.get<CourseListResponse>(
    `booking_service/bookings?${queryParams.toString()}`
  );
  return res.data;
};

// Details d'une course
const getOne = async (codeBooking: string) => {
  const res = await Axios.get<CourseOneResponse>(
    `booking_service/bookings/${codeBooking}/detail`
  );
  return res.data;
};

// Statistiques des courses
const getStats = async () => {
  const res = await Axios.get<CourseStatsResponse>(
    `booking_service/bookings/stats`
  );
  return res.data;
};

// Annuler une course
const cancel = async (codeBooking: string, reason: string) => {
  const res = await Axios.put<CourseOneResponse>(
    `booking_service/bookings/${codeBooking}/cancel`,
    { reason }
  );
  return res.data;
};

// Assigner un chauffeur
const assignDriver = async (codeBooking: string, driverMatricule: string) => {
  const res = await Axios.put<CourseOneResponse>(
    `booking_service/bookings/${codeBooking}/assign_driver`,
    { driver_matricule: driverMatricule }
  );
  return res.data;
};

// Demarrer une course
const startRide = async (codeBooking: string) => {
  const res = await Axios.put<CourseOneResponse>(
    `booking_service/bookings/${codeBooking}/start`
  );
  return res.data;
};

// Terminer une course
const completeRide = async (codeBooking: string) => {
  const res = await Axios.put<CourseOneResponse>(
    `booking_service/bookings/${codeBooking}/complete`
  );
  return res.data;
};

// Courses d'un client
const getByCustomer = async (customerMatricule: string) => {
  const res = await Axios.get<CourseListResponse>(
    `booking_service/bookings/customer/${customerMatricule}`
  );
  return res.data;
};

// Courses d'un chauffeur
const getByDriver = async (driverMatricule: string) => {
  const res = await Axios.get<CourseListResponse>(
    `booking_service/bookings/driver/${driverMatricule}`
  );
  return res.data;
};

// Courses en cours (live)
const getLive = async () => {
  const res = await Axios.get<CourseListResponse>(
    `booking_service/bookings/live`
  );
  return res.data;
};

export const SERVICE_COURSE = {
  getAll,
  getOne,
  getStats,
  cancel,
  assignDriver,
  startRide,
  completeRide,
  getByCustomer,
  getByDriver,
  getLive,
};
