"use client";

import { ReactNode, useState, useEffect, FC } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

interface LayoutAuthProps {
  children: ReactNode;
}

export const LayoutAuth: FC<LayoutAuthProps> = ({ children }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <>
      <ToastContainer />

      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center flex-auto min-w-0 sm:flex-row md:items-start sm:justify-center sm:min-h-screen md:justify-start">
          {/* Cote gauche avec fond jaune */}
          <div className="relative z-10 flex items-center justify-center flex-auto h-full min-h-screen p-10 overflow-hidden text-white bg-yellow-300 md:flex">
            {/* Element decoratif */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              <div className="absolute w-64 h-64 bg-yellow-300 rounded-full opacity-10 -top-10 -left-10"></div>
              <div className="absolute bottom-0 right-0 bg-yellow-300 rounded-full w-96 h-96 opacity-5"></div>
            </div>

            <div
              className={`relative rounded-full transition-all duration-1000 transform ${
                animate
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <Image
                src="/logos/jolof.jpeg"
                alt="logo jolof"
                width={300}
                height={300}
                className={`rounded-full border-4 border-yellow-300 object-cover object-center transition-transform duration-700 ease-in-out ${
                  animate ? "scale-100" : "scale-90"
                }`}
              />
            </div>
          </div>

          {/* Cote droit avec le contenu */}
          <div
            className={`flex items-center justify-center w-full min-h-screen p-8 border-l border-black lg:w-2/6 sm:w-auto md:h-full md:p-10 lg:p-8 sm:rounded-lg md:rounded-none bg-white shadow-lg transition-all duration-1000 ${
              animate ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
            }`}
          >
            <div className="w-full">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
};
