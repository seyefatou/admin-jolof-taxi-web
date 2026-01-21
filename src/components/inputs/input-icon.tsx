"use client";

import { Icon } from "@iconify/react";

interface InputIconProps {
  id: string;
  placeholder: string;
  className?: string;
  value: string;
  icon: string;
  setValue: (e: string) => void;
  required?: boolean;
  error?: boolean;
}

const InputIcon: React.FC<InputIconProps> = ({
  id,
  placeholder,
  className,
  value,
  icon,
  required,
  setValue,
  error,
}) => {
  return (
    <div className="grid gap-2 relative">
      <Icon
        className="mt-4 ml-3 absolute text-xl text-gray-400"
        icon={icon}
      />
      <input
        id={id}
        required={required}
        className={`${className} border border-black focus:outline-none block focus:border-transparent rounded-xl pl-9 p-3 focus:ring-yellow-200 focus:ring-2 ${
          error ? "border-red-400" : ""
        } bg-gray-50 w-auto placeholder:text-sm`}
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};

export default InputIcon;
