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

// Types bruts de l'API
type ApiCourse = {
  id: number;
  clientId: number;
  client: {
    id: number;
    matricule: string;
    name: string;
    phone: string;
    avatar?: string | null;
    status?: string;
    isOnline?: boolean;
  };
  driverId: number | null;
  driver: {
    id: number;
    matricule: string;
    name: string;
    phone: string;
    avatar?: string | null;
    status?: string;
    isOnline?: boolean;
  } | null;
  pickupLocation: LocationInfo;
  dropOffLocation: LocationInfo;
  status: string;
  paymentMethodId: number | null;
  paymentMethod: {
    id: number;
    name: string;
    image?: string;
    status?: boolean;
  } | null;
  totalPrice: number;
  distanceKm: number;
  durationMn: number;
  additionalFees?: number | null;
  raceStartTime?: string | null;
  raceEndTime?: string | null;
  waitTimeMn?: number | null;
  typeCar?: {
    id: number;
    type: string;
    image?: string | null;
    ratePrice: number;
    priceMn: number;
  };
  created_at: string;
  updated_at?: string;
};

// Mapper API -> CourseProps
const mapApiToCourse = (api: ApiCourse): CourseProps => ({
  id: api.id,
  code_booking: api.id.toString(),
  customer: {
    matricule: api.client?.matricule || "",
    name: api.client?.name || "Inconnu",
    phone: api.client?.phone || "",
    avatar: api.client?.avatar || null,
  },
  driver: api.driver
    ? {
        matricule: api.driver.matricule || "",
        name: api.driver.name || "Inconnu",
        phone: api.driver.phone || "",
        avatar: api.driver.avatar || null,
      }
    : null,
  pickup_location: api.pickupLocation || { address: "", latitude: 0, longitude: 0 },
  dropoff_location: api.dropOffLocation || { address: "", latitude: 0, longitude: 0 },
  status: (api.status || "").replace(/ /g, "_"),
  payment_method: api.paymentMethod
    ? { id: api.paymentMethod.id, name: api.paymentMethod.name }
    : null,
  price: api.totalPrice || 0,
  distance: api.distanceKm || 0,
  duration: api.durationMn || 0,
  commission: 0,
  created_at: api.created_at,
  updated_at: api.updated_at || api.created_at,
  started_at: api.raceStartTime || undefined,
  completed_at: api.raceEndTime || undefined,
});

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

  // 1. Premier appel pour recuperer le total
  queryParams.append("take", "1");
  const firstRes = await Axios.get(`booking_service/bookings?${queryParams.toString()}`);
  const total = firstRes.data?.data?.total || 0;

  // 2. Deuxieme appel pour recuperer TOUTES les courses
  queryParams.set("take", total.toString());
  const res = await Axios.get(`booking_service/bookings?${queryParams.toString()}`);

  // Structure API: res.data = { message, status, data: { data: [...], pagination, total } }
  const rawCourses = Array.isArray(res.data?.data?.data)
    ? res.data.data.data
    : [];

  const mappedData: CourseProps[] = rawCourses.map(mapApiToCourse);

  // Trier du plus recent au plus ancien
  mappedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    message: res.data?.message || "",
    status: res.data?.status || res.status,
    data: mappedData,
  };
};

// Details d'une course
const getOne = async (courseId: string) => {
  const res = await Axios.get<{ message: string; status: number; data: ApiCourse }>(
    `booking_service/bookings/${courseId}/detail`
  );

  return {
    message: res.data.message,
    status: res.data.status,
    data: mapApiToCourse(res.data.data),
  };
};

// Statistiques des courses
const getStats = async () => {
  const res = await Axios.get<CourseStatsResponse>(
    `booking_service/bookings/stats`
  );
  return res.data;
};

// Statistiques d'un chauffeur
const getDriverStats = async (driverId: number) => {
  const res = await Axios.get(
    `booking_service/bookings/statistics/driver/${driverId}`
  );
  return res.data;
};

// Annuler une course
const cancel = async (courseId: string, reason: string) => {
  const res = await Axios.put<{ message: string; status: number; data: ApiCourse }>(
    `booking_service/bookings/${courseId}/cancel`,
    { reason }
  );
  return {
    message: res.data.message,
    status: res.data.status,
    data: mapApiToCourse(res.data.data),
  };
};

// Assigner un chauffeur
const assignDriver = async (courseId: string, driverMatricule: string) => {
  const res = await Axios.put<{ message: string; status: number; data: ApiCourse }>(
    `booking_service/bookings/${courseId}/assign_driver`,
    { driver_matricule: driverMatricule }
  );
  return {
    message: res.data.message,
    status: res.data.status,
    data: mapApiToCourse(res.data.data),
  };
};

// Demarrer une course
const startRide = async (courseId: string) => {
  const res = await Axios.put<{ message: string; status: number; data: ApiCourse }>(
    `booking_service/bookings/${courseId}/start`
  );
  return {
    message: res.data.message,
    status: res.data.status,
    data: mapApiToCourse(res.data.data),
  };
};

// Terminer une course
const completeRide = async (courseId: string) => {
  const res = await Axios.put<{ message: string; status: number; data: ApiCourse }>(
    `booking_service/bookings/${courseId}/complete`
  );
  return {
    message: res.data.message,
    status: res.data.status,
    data: mapApiToCourse(res.data.data),
  };
};

// Helper pour extraire les courses depuis la reponse API (gere les 2 formats possibles)
const extractCourses = (resData: any): ApiCourse[] => {
  // Format pagine: { data: { data: [...], pagination, total } }
  if (Array.isArray(resData?.data?.data)) return resData.data.data;
  // Format simple: { data: [...] }
  if (Array.isArray(resData?.data)) return resData.data;
  return [];
};

// Courses d'un client
const getByCustomer = async (customerMatricule: string) => {
  const res = await Axios.get(
    `booking_service/bookings/customer/${customerMatricule}`
  );
  const raw = extractCourses(res.data);
  const mapped = raw.map(mapApiToCourse);
  mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return {
    message: res.data?.message || "",
    status: res.data?.status || res.status,
    data: mapped,
  };
};

// Courses d'un chauffeur
const getByDriver = async (driverMatricule: string) => {
  const res = await Axios.get(
    `booking_service/bookings/driver/${driverMatricule}`
  );
  const raw = extractCourses(res.data);
  const mapped = raw.map(mapApiToCourse);
  mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return {
    message: res.data?.message || "",
    status: res.data?.status || res.status,
    data: mapped,
  };
};

// Courses en cours (live)
const getLive = async () => {
  const res = await Axios.get(
    `booking_service/bookings/live`
  );
  const raw = extractCourses(res.data);
  const mapped = raw.map(mapApiToCourse);
  mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return {
    message: res.data?.message || "",
    status: res.data?.status || res.status,
    data: mapped,
  };
};

export const SERVICE_COURSE = {
  getAll,
  getOne,
  getStats,
  getDriverStats,
  cancel,
  assignDriver,
  startRide,
  completeRide,
  getByCustomer,
  getByDriver,
  getLive,
};
