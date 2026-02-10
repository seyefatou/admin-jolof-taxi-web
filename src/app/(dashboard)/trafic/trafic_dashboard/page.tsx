"use client";

import { useEffect, useState } from "react";
import { CardDashmini } from "@/components/cards/dash-card";
import { SERVICE_DASH } from "@/services/dashboard-service";
import { SERVICE_COURSE, CourseProps } from "@/services/course-service";
import formaterPrixCFAAbrege from "@/utils/number-format";
import { DataDash, BookingPeriod } from "@/types/dashboard-types";

const emptyStats: BookingStats = {
  total: 0,
  completed: 0,
  processing: 0,
  cancelled: 0,
  cancelledByCustomer: 0,
  cancelledByDriver: 0,
  totalRevenue: 0,
  totalCommission: 0,
  services: [],
};

type DashData = {
  users: DataDash["users"];
  bookings: {
    today: BookingStats;
    month: BookingStats;
    year: BookingStats;
    total: BookingStats;
  };
};

const initialData: DashData = {
  users: {
    today: { customers: 0, drivers: 0 },
    month: { customers: 0, drivers: 0 },
    year: { customers: 0, drivers: 0 },
    all: { customers: 0, drivers: 0 },
  },
  bookings: {
    today: { ...emptyStats },
    month: { ...emptyStats },
    year: { ...emptyStats },
    total: { ...emptyStats },
  },
};

type BookingStats = BookingPeriod & {
  cancelledByCustomer: number;
  cancelledByDriver: number;
};

// Calculer les stats d'une liste de courses
function computeBookingStats(courses: CourseProps[]): BookingStats {
  let completed = 0;
  let cancelled = 0;
  let cancelledByCustomer = 0;
  let cancelledByDriver = 0;
  let processing = 0;
  let totalRevenue = 0;
  let totalCommission = 0;

  for (const c of courses) {
    const s = (c.status || "").toUpperCase().replace(/ /g, "_");
    if (s === "DONE" || s === "COMPLETED") {
      completed++;
      totalRevenue += c.price || 0;
      totalCommission += c.commission || 0;
    } else if (s === "CANCELED_BY_CUSTOMER") {
      cancelledByCustomer++;
      cancelled++;
    } else if (s === "CANCELED_BY_DRIVER") {
      cancelledByDriver++;
      cancelled++;
    } else if (s === "CANCELED" || s === "CANCELLED") {
      cancelled++;
    } else if (s === "IN_PROGRESS" || s === "PROCESSING" || s === "PENDING" || s === "ACCEPTED") {
      processing++;
    }
  }

  return {
    total: courses.length,
    completed,
    processing,
    cancelled,
    cancelledByCustomer,
    cancelledByDriver,
    totalRevenue,
    totalCommission,
    services: [],
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashData>(initialData);
  const [role, setRole] = useState<string | null>("");
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);

      // Appels en parallele : users depuis auth_service, courses depuis booking_service
      const [dashRes, coursesRes] = await Promise.all([
        SERVICE_DASH.getDataDash(),
        SERVICE_COURSE.getAll(),
      ]);

      const allCourses = coursesRes.data || [];

      // Bornes de dates
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const todayCourses = allCourses.filter(
        (c) => new Date(c.created_at) >= todayStart
      );
      const monthCourses = allCourses.filter(
        (c) => new Date(c.created_at) >= monthStart
      );
      const yearCourses = allCourses.filter(
        (c) => new Date(c.created_at) >= yearStart
      );

      setData({
        users: dashRes.data?.users || initialData.users,
        bookings: {
          today: computeBookingStats(todayCourses),
          month: computeBookingStats(monthCourses),
          year: computeBookingStats(yearCourses),
          total: computeBookingStats(allCourses),
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const getRole = localStorage.getItem("role");
      setRole(getRole);
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-400 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div>
        {/* Statistiques Total */}
        <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl">
          <div className="p-4">
            <h1 className="text-xl font-semibold text-gray-800">
              Statistiques Total
            </h1>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-5 mt-5 mb-5 max-sm:grid-cols-1 max-md:grid-cols-1 max-lg:grid-cols-3 max-xl:grid-cols-3">
            <CardDashmini
              h1="Courses Terminee"
              classname="text-black"
              bgColor="bg-gray-50"
              icon="pajamas:check-circle-filled"
              number={`${data?.bookings?.total.completed || 0}`}
            />
            <CardDashmini
              h1="Annulees par client"
              icon="mdi:account-cancel"
              classname="text-black"
              bgColor="bg-gray-50"
              number={`${data?.bookings?.total.cancelledByCustomer || 0}`}
            />
            <CardDashmini
              h1="Annulees par chauffeur"
              icon="mdi:account-cancel"
              classname="text-black"
              bgColor="bg-gray-50"
              number={`${data?.bookings?.total.cancelledByDriver || 0}`}
            />
          </div>
          <div className="grid grid-cols-5 gap-5 mt-5 mb-5 max-sm:grid-cols-1 max-md:grid-cols-1 max-lg:grid-cols-2 max-xl:grid-cols-3 max-2xl:grid-cols-3">
            <CardDashmini
              h1="Total Courses"
              icon="mdi:locations"
              classname="text-black"
              bgColor="bg-gray-50"
              number={`${data?.bookings?.total.total || 0}`}
            />
            <CardDashmini
              h1="Total Users"
              icon="fa-solid:users"
              classname={
                role === "SUDO_DEV" || role === "BOSS"
                  ? "text-black"
                  : "text-black col-span-2"
              }
              bgColor="bg-gray-50"
              number={`${data?.users?.all.customers || 0}`}
            />
            <CardDashmini
              h1="Total Chauffeurs"
              icon="fa-solid:users"
              classname={
                role === "SUDO_DEV" || role === "BOSS"
                  ? "text-black"
                  : "text-black col-span-2"
              }
              bgColor="bg-gray-50"
              number={`${data?.users?.all.drivers || 0}`}
            />
            {(role === "SUDO_DEV" || role === "BOSS") && (
              <>
                <CardDashmini
                  h1="Gains totaux"
                  classname="text-black"
                  bgColor="bg-gray-50"
                  icon="f7:money-dollar-circle-fill"
                  number={`${
                    data?.bookings?.total.totalRevenue
                      ? formaterPrixCFAAbrege(data?.bookings?.total.totalRevenue)
                      : 0
                  }`}
                />
                <CardDashmini
                  h1="Total commissions"
                  bgColor="bg-gray-50"
                  classname="text-black"
                  icon="flat-color-icons:money-transfer"
                  number={`${
                    data?.bookings?.total.totalCommission
                      ? formaterPrixCFAAbrege(data?.bookings?.total.totalCommission)
                      : 0
                  }`}
                />
              </>
            )}
          </div>
        </div>

        {/* Statistiques du jour */}
        <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl">
          <div className="p-4">
            <h1 className="text-xl font-semibold text-gray-800">
              Statistiques du jour
            </h1>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-5 mt-5 mb-5 max-sm:grid-cols-1 max-md:grid-cols-1 max-lg:grid-cols-3 max-xl:grid-cols-3">
            <CardDashmini
              h1="Courses Terminee"
              classname="text-black"
              bgColor="bg-gray-50"
              icon="pajamas:check-circle-filled"
              number={`${data?.bookings?.today.completed || 0}`}
            />
            <CardDashmini
              h1="Annulees par client"
              icon="mdi:account-cancel"
              classname="text-black"
              bgColor="bg-gray-50"
              number={`${data?.bookings?.today.cancelledByCustomer || 0}`}
            />
            <CardDashmini
              h1="Annulees par chauffeur"
              icon="mdi:account-cancel"
              classname="text-black"
              bgColor="bg-gray-50"
              number={`${data?.bookings?.today.cancelledByDriver || 0}`}
            />
          </div>
          <div className="grid grid-cols-5 gap-5 mt-5 mb-5 max-sm:grid-cols-1 max-md:grid-cols-1 max-lg:grid-cols-2 max-xl:grid-cols-3 max-2xl:grid-cols-3">
            <CardDashmini
              h1="Total Courses"
              icon="mdi:locations"
              classname="text-black"
              bgColor="bg-gray-50"
              number={`${data?.bookings?.today.total || 0}`}
            />
            <CardDashmini
              h1="Total Users"
              icon="fa-solid:users"
              classname={
                role === "SUDO_DEV" || role === "BOSS"
                  ? "text-black"
                  : "text-black col-span-2"
              }
              bgColor="bg-gray-50"
              number={`${data?.users?.today.customers || 0}`}
            />
            <CardDashmini
              h1="Total Chauffeurs"
              icon="fa-solid:users"
              classname={
                role === "SUDO_DEV" || role === "BOSS"
                  ? "text-black"
                  : "text-black col-span-2"
              }
              bgColor="bg-gray-50"
              number={`${data?.users?.today.drivers || 0}`}
            />
            {(role === "SUDO_DEV" || role === "BOSS") && (
              <>
                <CardDashmini
                  h1="Gains totaux"
                  classname="text-black"
                  bgColor="bg-gray-50"
                  icon="f7:money-dollar-circle-fill"
                  number={`${
                    data?.bookings?.today.totalRevenue
                      ? formaterPrixCFAAbrege(data?.bookings?.today.totalRevenue)
                      : 0
                  }`}
                />
                <CardDashmini
                  h1="Total commissions"
                  bgColor="bg-gray-50"
                  classname="text-black"
                  icon="flat-color-icons:money-transfer"
                  number={`${
                    data?.bookings?.today.totalCommission
                      ? formaterPrixCFAAbrege(data?.bookings?.today.totalCommission)
                      : 0
                  }`}
                />
              </>
            )}
          </div>
        </div>

        {/* Statistiques du mois */}
        <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl">
          <div className="p-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Statistiques du mois
            </h1>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-5 mt-5 mb-5 max-sm:grid-cols-1 max-md:grid-cols-1 max-lg:grid-cols-3 max-xl:grid-cols-3">
            <CardDashmini
              h1="Courses Terminee"
              classname="text-black"
              bgColor="bg-gray-50"
              icon="pajamas:check-circle-filled"
              number={`${data?.bookings?.month.completed || 0}`}
            />
            <CardDashmini
              h1="Annulees par client"
              icon="mdi:account-cancel"
              classname="text-black"
              bgColor="bg-gray-50"
              number={`${data?.bookings?.month.cancelledByCustomer || 0}`}
            />
            <CardDashmini
              h1="Annulees par chauffeur"
              icon="mdi:account-cancel"
              classname="text-black"
              bgColor="bg-gray-50"
              number={`${data?.bookings?.month.cancelledByDriver || 0}`}
            />
          </div>
          <div className="grid grid-cols-5 gap-5 mt-5 mb-5 max-sm:grid-cols-1 max-md:grid-cols-1 max-lg:grid-cols-2 max-xl:grid-cols-3 max-2xl:grid-cols-3">
            <CardDashmini
              h1="Total Courses"
              icon="mdi:locations"
              classname="text-black"
              bgColor="bg-gray-50"
              number={`${data?.bookings?.month.total || 0}`}
            />
            <CardDashmini
              h1="Total Users"
              icon="fa-solid:users"
              classname={
                role === "SUDO_DEV" || role === "BOSS"
                  ? "text-black"
                  : "text-black col-span-2"
              }
              bgColor="bg-gray-50"
              number={`${data?.users?.month.customers || 0}`}
            />
            <CardDashmini
              h1="Total Chauffeurs"
              icon="fa-solid:users"
              classname={
                role === "SUDO_DEV" || role === "BOSS"
                  ? "text-black"
                  : "text-black col-span-2"
              }
              bgColor="bg-gray-50"
              number={`${data?.users?.month.drivers || 0}`}
            />
            {(role === "SUDO_DEV" || role === "BOSS") && (
              <>
                <CardDashmini
                  h1="Gains totaux"
                  classname="text-black"
                  bgColor="bg-gray-50"
                  icon="f7:money-dollar-circle-fill"
                  number={`${
                    data?.bookings?.month.totalRevenue
                      ? formaterPrixCFAAbrege(data?.bookings?.month.totalRevenue)
                      : 0
                  }`}
                />
                <CardDashmini
                  h1="Total commissions"
                  classname="text-black"
                  bgColor="bg-gray-50"
                  icon="flat-color-icons:money-transfer"
                  number={`${
                    data?.bookings?.month.totalCommission
                      ? formaterPrixCFAAbrege(data?.bookings?.month.totalCommission)
                      : 0
                  }`}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
