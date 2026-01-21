"use client";

import { useEffect, useState } from "react";
import { CardDashmini } from "@/components/cards/dash-card";
import { SERVICE_DASH } from "@/services/dashboard-service";
import formaterPrixCFAAbrege from "@/utils/number-format";
import { DataDash } from "@/types/dashboard-types";

const initialData: DataDash = {
  users: {
    today: { customers: 0, drivers: 0 },
    month: { customers: 0, drivers: 0 },
    year: { customers: 0, drivers: 0 },
    all: { customers: 0, drivers: 0 },
  },
  bookings: {
    today: {
      total: 0,
      completed: 0,
      processing: 0,
      cancelled: 0,
      totalRevenue: 0,
      totalCommission: 0,
      services: [],
    },
    month: {
      total: 0,
      completed: 0,
      processing: 0,
      cancelled: 0,
      totalRevenue: 0,
      totalCommission: 0,
      services: [],
    },
    year: {
      total: 0,
      completed: 0,
      processing: 0,
      cancelled: 0,
      totalRevenue: 0,
      totalCommission: 0,
      services: [],
    },
    total: {
      total: 0,
      completed: 0,
      processing: 0,
      cancelled: 0,
      totalRevenue: 0,
      totalCommission: 0,
      services: [],
    },
  },
};

export default function Dashboard() {
  const [data, setData] = useState<DataDash>(initialData);
  const [role, setRole] = useState<string | null>("");

  const getAll = async () => {
    try {
      const res = await SERVICE_DASH.getDataDash();
      setData(res.data);
      console.log(res, "res");
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const getRole = localStorage.getItem("role");
      setRole(getRole);
    }
    getAll();
  }, []);

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
          <div className="grid grid-cols-2 gap-5 mt-5 mb-5 max-sm:grid-cols-1 max-md:grid-cols-1 max-lg:grid-cols-2 max-xl:grid-cols-2">
            <CardDashmini
              h1="Courses Terminee"
              classname="text-black"
              bgColor="bg-gray-50"
              icon="pajamas:check-circle-filled"
              number={`${data?.bookings?.total.completed || 0}`}
            />
            <CardDashmini
              h1="Courses annulees"
              icon="line-md:cancel-twotone"
              classname="text-black"
              bgColor="bg-gray-50"
              number={`${data?.bookings?.total.cancelled || 0}`}
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
          <div className="grid grid-cols-2 gap-5 mt-5 mb-5 max-sm:grid-cols-1 max-md:grid-cols-1 max-lg:grid-cols-2 max-xl:grid-cols-2">
            <CardDashmini
              h1="Courses Terminee"
              classname="text-black"
              bgColor="bg-gray-50"
              icon="pajamas:check-circle-filled"
              number={`${data?.bookings?.today.completed || 0}`}
            />
            <CardDashmini
              h1="Courses annulees"
              icon="line-md:cancel-twotone"
              classname="text-black"
              bgColor="bg-gray-50"
              number={`${data?.bookings?.today.cancelled || 0}`}
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
          <div className="grid grid-cols-2 gap-5 mt-5 mb-5 max-sm:grid-cols-1 max-md:grid-cols-1 max-lg:grid-cols-2 max-xl:grid-cols-2">
            <CardDashmini
              h1="Courses Terminee"
              classname="text-black"
              bgColor="bg-gray-50"
              icon="pajamas:check-circle-filled"
              number={`${data?.bookings?.month.completed || 0}`}
            />
            <CardDashmini
              h1="Courses annulees"
              icon="line-md:cancel-twotone"
              classname="text-black"
              bgColor="bg-gray-50"
              number={`${data?.bookings?.month.cancelled || 0}`}
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
