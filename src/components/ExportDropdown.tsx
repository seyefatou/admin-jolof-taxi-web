"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

type ExportFormat = "pdf" | "excel";

interface ExportDropdownProps {
  onExport: (format: ExportFormat) => void;
}

export default function ExportDropdown({ onExport }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (format: ExportFormat) => {
    onExport(format);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
      >
        <Icon icon="mdi:download" className="text-lg" />
        Exporter
        <Icon
          icon="mdi:chevron-down"
          className={`text-lg transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 animate-fadeIn">
          <button
            onClick={() => handleSelect("pdf")}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center gap-3 transition-colors"
          >
            <Icon icon="mdi:file-pdf-box" className="text-red-500 text-xl" />
            <span className="font-medium">Exporter en PDF</span>
          </button>
          <button
            onClick={() => handleSelect("excel")}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-green-50 flex items-center gap-3 transition-colors"
          >
            <Icon icon="mdi:file-excel-box" className="text-green-600 text-xl" />
            <span className="font-medium">Exporter en Excel</span>
          </button>
        </div>
      )}
    </div>
  );
}
