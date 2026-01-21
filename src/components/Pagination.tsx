"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const itemsPerPageOptions = [
  { value: 5, label: "5 par page" },
  { value: 10, label: "10 par page" },
  { value: 25, label: "25 par page" },
  { value: 50, label: "50 par page" },
];

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const selectedOption = itemsPerPageOptions.find((opt) => opt.value === itemsPerPage);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSelect = (value: number) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(value);
    }
    setIsDropdownOpen(false);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Affichage de <strong>{startItem}</strong> a <strong>{endItem}</strong> sur{" "}
          <strong>{totalItems}</strong> elements
        </span>
        {onItemsPerPageChange && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-all duration-200 ${
                isDropdownOpen
                  ? "border-yellow-400 ring-2 ring-yellow-200 bg-yellow-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <span>{selectedOption?.label || "10 par page"}</span>
              <Icon
                icon={isDropdownOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                className={`text-base transition-transform duration-200 ${
                  isDropdownOpen ? "text-yellow-600" : "text-gray-400"
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-50 bottom-full mb-1 left-0 min-w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <ul className="py-1">
                  {itemsPerPageOptions.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors duration-150 ${
                          itemsPerPage === option.value
                            ? "bg-yellow-100 text-yellow-800"
                            : "text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                        }`}
                      >
                        <span>{option.label}</span>
                        {itemsPerPage === option.value && (
                          <Icon icon="mdi:check" className="text-yellow-600" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Premiere page"
        >
          <Icon icon="mdi:chevron-double-left" className="text-lg" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Page precedente"
        >
          <Icon icon="mdi:chevron-left" className="text-lg" />
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`min-w-[40px] h-10 rounded-lg border text-sm font-medium transition-colors ${
              page === currentPage
                ? "bg-yellow-300 border-yellow-400 text-black"
                : page === "..."
                ? "border-transparent cursor-default"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Page suivante"
        >
          <Icon icon="mdi:chevron-right" className="text-lg" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Derniere page"
        >
          <Icon icon="mdi:chevron-double-right" className="text-lg" />
        </button>
      </div>
    </div>
  );
}
