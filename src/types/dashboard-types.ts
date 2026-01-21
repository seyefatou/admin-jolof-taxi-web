export interface DataDash {
  users: {
    today: {
      customers: number;
      drivers: number;
    };
    month: {
      customers: number;
      drivers: number;
    };
    year: {
      customers: number;
      drivers: number;
    };
    all: {
      customers: number;
      drivers: number;
    };
  };
  bookings: {
    today: BookingPeriod;
    month: BookingPeriod;
    year: BookingPeriod;
    total: BookingPeriod;
  };
}

export interface BookingPeriod {
  total: number;
  completed: number;
  processing: number;
  cancelled: number;
  totalRevenue: number;
  totalCommission: number;
  services: ServiceCount[];
}

export interface ServiceCount {
  service: string;
  count: number;
}

export interface DashResponse {
  status: number;
  message: string;
  data: DataDash;
}
