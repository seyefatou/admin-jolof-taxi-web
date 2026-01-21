"use client";

import { LayoutGlobal } from "@/layouts/layout-principal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ToastContainer />
      <LayoutGlobal>{children}</LayoutGlobal>
    </>
  );
}
