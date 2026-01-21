"use client";

import { useState, useEffect } from "react";
import InputIcon from "@/components/inputs/input-icon";
import BtnPrimary from "@/components/buttons/btn-primary";
import { SERVICE_FORGET_PASSWORD } from "@/services/forget-password";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LayoutAuth } from "@/components/layouts/layout-auth";
import { useRouter } from "next/navigation";
import { AUTH } from "@/common/urls/auth";
import { ChevronLeft } from "lucide-react";

export default function ForgetPasswordIdentify() {
  const [identify, setIdentify] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedIdentify = localStorage.getItem("identify");
      if (savedIdentify) setIdentify(savedIdentify);
    }
  }, []);

  const goBack = () => {
    router.back();
  };

  const handleForgetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (identify) {
        setLoading(true);
        const res = await SERVICE_FORGET_PASSWORD.forgetPassword(identify);
        if (res.data === true) {
          router.push(`${AUTH.CodeOTP}/${identify}`);
        } else {
          toast.error(`Identifiant invalide`, {
            position: "top-center",
            autoClose: 5000,
            pauseOnFocusLoss: true,
            closeButton: true,
            pauseOnHover: false,
            hideProgressBar: false,
            closeOnClick: true,
            draggable: true,
          });
        }
      }
    } catch (error: any) {
      if (error.code === "ECONNABORTED" && error.name === "AxiosError") {
        toast.info(`Reseau instable`, {
          position: "top-center",
          autoClose: 5000,
        });
      } else if (error.code === "ERR_NETWORK" && error.name === "AxiosError") {
        toast.info(`Vous n'etes pas connecte a internet`, {
          position: "top-center",
          autoClose: 5000,
        });
      } else if (error.code === "ERR_BAD_REQUEST" && error.name === "AxiosError") {
        toast.error(`Identifiant invalide`, {
          position: "top-center",
          autoClose: 5000,
        });
      }
    }
    setLoading(false);
  };

  return (
    <LayoutAuth>
      <div className="w-full md:h-full lg:p-14">
        <h1 className="mb-2 text-3xl font-bold">Mot de passe oublie</h1>
        <h4 className="pb-6 text-gray-400 text-sm">
          Saisissez votre adresse email pour recevoir un lien de reinitialisation
        </h4>

        <form onSubmit={handleForgetPassword}>
          <InputIcon
            id="name"
            error={error}
            required={true}
            icon="hugeicons:mail-02"
            placeholder="Identifiant"
            className=""
            value={identify}
            setValue={setIdentify}
          />

          <BtnPrimary
            text="Valider"
            loading={loading}
            type="submit"
            className="mt-5 mb-3 font-bold"
          />
        </form>

        <div
          onClick={goBack}
          className="flex align-middle text-center gap-2 mt-4 cursor-pointer items-center"
        >
          <ChevronLeft className="text-yellow-400 w-5 h-5" />
          <span className="text-gray-400 text-sm">
            Revenir a la page de connexion
          </span>
        </div>
      </div>
    </LayoutAuth>
  );
}
