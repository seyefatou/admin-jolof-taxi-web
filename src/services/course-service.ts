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
  accepted_at?: string;
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
  acceptedAt?: string | null;
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
  cancelReason?: string | null;
  cancel_reason?: string | null;
  reason?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

// Normaliser les statuts de l'API vers les statuts internes
const normalizeStatus = (status: string): string => {
  const normalized = (status || "").replace(/ /g, "_");
  const statusMap: Record<string, string> = {
    RACE_STARTED: "IN_PROGRESS",
    RACE_ENDED: "DONE",
  };
  return statusMap[normalized] || normalized;
};

// Mapper API -> CourseProps (gere les formats camelCase et snake_case)
const mapApiToCourse = (api: ApiCourse): CourseProps => {
  const createdAt = api.created_at || api.createdAt || "";
  const updatedAt = api.updated_at || api.updatedAt || "";

  return {
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
    status: normalizeStatus(api.status),
    payment_method: api.paymentMethod
      ? { id: api.paymentMethod.id, name: api.paymentMethod.name }
      : null,
    price: api.totalPrice || 0,
    distance: api.distanceKm || 0,
    duration: api.durationMn || 0,
    commission: 0,
    created_at: createdAt,
    updated_at: updatedAt && updatedAt !== createdAt ? updatedAt : createdAt,
    cancel_reason: api.cancelReason || api.cancel_reason || api.reason || undefined,
    accepted_at: api.acceptedAt || undefined,
    started_at: api.raceStartTime || undefined,
    completed_at: api.raceEndTime || undefined,
  };
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
  try {
    const res = await Axios.get(
      `booking_service/bookings/${customerMatricule}/list?take=1000`
    );
    const raw = extractCourses(res.data);
    const mapped = raw.map(mapApiToCourse);
    mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return {
      message: res.data?.message || "",
      status: res.data?.status || res.status,
      data: mapped,
    };
  } catch {
    // Fallback: recuperer toutes les courses et filtrer par client
    const allRes = await getAll();
    const filtered = allRes.data.filter(
      (c) => c.customer?.matricule === customerMatricule
    );
    return {
      message: allRes.message,
      status: allRes.status,
      data: filtered,
    };
  }
};

// Courses d'un chauffeur
const getByDriver = async (driverMatricule: string) => {
  try {
    // Essayer l'endpoint dedie au chauffeur
    const res = await Axios.get(
      `booking_service/bookings/${driverMatricule}/driver_list?take=1000`
    );
    const raw = extractCourses(res.data);
    const mapped = raw.map(mapApiToCourse);
    mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return {
      message: res.data?.message || "",
      status: res.data?.status || res.status,
      data: mapped,
    };
  } catch {
    // Fallback: recuperer toutes les courses et filtrer par chauffeur
    const allRes = await getAll();
    const filtered = allRes.data.filter(
      (c) => c.driver?.matricule === driverMatricule
    );
    return {
      message: allRes.message,
      status: allRes.status,
      data: filtered,
    };
  }
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

// Annuler une course (v2 - avec motif et statut)
const cancelV2 = async (courseId: string, reason: string, status: string = "CANCELED BY CUSTOMER") => {
  const res = await Axios.post<{ message: string; status: number; data: ApiCourse }>(
    `booking_service/bookings/${courseId}/cancel_customer_v2`,
    { status, reason }
  );
  return {
    message: res.data.message,
    status: res.data.status,
    data: mapApiToCourse(res.data.data),
  };
};

// Trace GPS d'une course
export type TripLocation = {
  id: number;
  latitude: number;
  longitude: number;
  timestamp: string;
};

const getTripLocations = async (bookingId: string) => {
  const res = await Axios.get<{ message: string; status: number; data: TripLocation[] }>(
    `booking_service/bookings/${bookingId}/trip-locations`
  );
  return {
    message: res.data.message,
    status: res.data.status,
    data: res.data.data || [],
  };
};

export const SERVICE_COURSE = {
  getAll,
  getOne,
  getStats,
  getDriverStats,
  cancel,
  cancelV2,
  assignDriver,
  startRide,
  completeRide,
  getByCustomer,
  getByDriver,
  getLive,
  getTripLocations,
};
