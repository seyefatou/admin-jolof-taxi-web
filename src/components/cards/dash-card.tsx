"use client";

import { Icon } from "@iconify/react";
import React from "react";

type DashProps = {
  h1: string;
  h3?: string;
  icon: string;
  number: string;
  classname?: string;
  bgColor?: string;
};

export const CardDashmini: React.FC<DashProps> = ({
  h1,
  h3,
  icon,
  number,
  classname,
  bgColor,
}) => {
  return (
    <div
      className={`${classname} bg-gray-50 shadow-md dark:text-gray-400 dark:bg-neutral-800 dark:ring-neutral-600 ring-1 ring-gray-200 rounded-xl`}
    >
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-sm font-bold">{h1}</h1>
          <span className="text-xl font-extrabold">{number}</span>
          {h3 && <h3 className="text-xs font-semibold text-gray-400">{h3}</h3>}
        </div>
        <div
          className={`h-14 w-14 border border-gray-200 flex items-center rounded-full ${bgColor} p-3`}
        >
          <Icon icon={icon} className={`${classname} text-3xl`} />
        </div>
      </div>
    </div>
  );
};
