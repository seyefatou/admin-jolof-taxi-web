"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

interface InputPasswordProps {
  id: string;
  placeholder: string;
  className?: string;
  value: string;
  setValue: (e: string) => void;
  required?: boolean;
  error?: boolean;
}

const InputPassword: React.FC<InputPasswordProps> = ({
  id,
  placeholder,
  className,
  value,
  error,
  setValue,
  required,
}) => {
  const [hidden, setHidden] = useState(true);

  const handleHidden = () => {
    setHidden(!hidden);
  };

  return (
    <div>
      <div className="relative flex items-center content-center">
        <Icon
          icon="solar:lock-keyhole-linear"
          className="absolute left-3 text-xl text-gray-400"
        />
        <input
          id={id}
          required={required}
          className={`${className} border border-black focus:outline-none focus:border-transparent ${
            error ? "border-red-400" : ""
          } block pl-9 p-3 rounded-xl focus:ring-yellow-200 focus:ring-2 bg-gray-50 w-full placeholder:text-sm`}
          placeholder={placeholder}
          type={hidden ? "password" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          onClick={handleHidden}
          className="absolute flex items-center content-center text-gray-400 align-middle right-3 focus:outline-none"
          type="button"
        >
          {hidden ? (
            <Icon
              icon="material-symbols-light:visibility-off-outline-rounded"
              width="24"
              height="24"
            />
          ) : (
            <Icon
              icon="material-symbols-light:visibility-outline-rounded"
              width="24"
              height="24"
            />
          )}
        </button>
      </div>
    </div>
  );
};

export default InputPassword;
