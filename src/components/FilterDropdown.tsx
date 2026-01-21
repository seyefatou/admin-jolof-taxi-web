"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
}

interface FilterDropdownProps {
  label: string;
  icon: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function FilterDropdown({
  label,
  icon,
  options,
  value,
  onChange,
  placeholder = "Selectionner...",
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const isActive = value !== "ALL" && value !== "";

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-500 mb-2">
        <Icon icon={icon} className="inline mr-1" />
        {label}
      </label>

      {/* Bouton du dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 pr-10 border rounded-xl text-left transition-all duration-200 ${
          isActive
            ? "border-yellow-400 bg-yellow-50"
            : "border-gray-300 bg-white hover:border-gray-400"
        } ${isOpen ? "border-yellow-400 ring-2 ring-yellow-200" : ""}`}
      >
        <span className={`block truncate ${!selectedOption ? "text-gray-400" : "text-gray-900"}`}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-6">
          <Icon
            icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
            className={`text-lg transition-transform duration-200 ${
              isActive ? "text-yellow-600" : "text-gray-400"
            }`}
          />
        </span>
      </button>

      {/* Liste des options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-2 transition-colors duration-150 ${
                    value === option.value
                      ? "bg-yellow-100 text-yellow-800"
                      : "text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                  }`}
                >
                  {option.icon && (
                    <Icon
                      icon={option.icon}
                      className={`text-lg ${
                        value === option.value ? "text-yellow-600" : "text-gray-400"
                      }`}
                    />
                  )}
                  <span className="flex-1">{option.label}</span>
                  {value === option.value && (
                    <Icon icon="mdi:check" className="text-yellow-600 text-lg" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
