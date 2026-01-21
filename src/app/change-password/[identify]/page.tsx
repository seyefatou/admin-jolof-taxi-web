"use client";

import { useState } from "react";
import InputPassword from "@/components/inputs/input-password";
import BtnPrimary from "@/components/buttons/btn-primary";
import { SERVICE_UPDATE_PASSWORD } from "@/services/change-password";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LayoutAuth } from "@/components/layouts/layout-auth";
import { useRouter } from "next/navigation";
import { AUTH } from "@/common/urls/auth";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";

export default function ChangePassword() {
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false);
  const router = useRouter();
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");

  const goBack = () => {
    router.back();
  };

  const goHome = () => {
    router.push(AUTH.Login);
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const code = localStorage.getItem("code");
      const code_expire = localStorage.getItem("code_expiration");
      const matricule = localStorage.getItem("matricule");

      if (code && code_expire && matricule) {
        setLoading(true);
        const res = await SERVICE_UPDATE_PASSWORD.changePassword(
          password,
          passwordConfirm,
          code,
          matricule,
          code_expire
        );
        if (res.success) {
          localStorage.removeItem("matricule");
          localStorage.removeItem("code_expiration");
          localStorage.removeItem("code");
          setModal(true);
        }
      }
    } catch (error: any) {
      console.log(error);
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
        toast.error(`${error.response.data.message}`, {
          position: "top-center",
          autoClose: 5000,
        });
      }
    }
    setLoading(false);
  };

  return (
    <>
      {modal && (
        <div className="z-10 bg-opacity-50 fixed w-full h-full bg-black">
          <div className="flex justify-center h-full items-center content-center">
            <div className="block items-center text-center bg-white w-4/12 rounded-2xl p-16">
              <div>
                <div className="text-center flex justify-center">
                  <Image
                    src="/logos/jolof.svg"
                    alt="logo jolof"
                    width={100}
                    height={100}
                    className="mb-2"
                  />
                </div>
                <h2 className="flex justify-center text-2xl font-medium text-black">
                  Jolof Taxi
                </h2>
              </div>
              <h5 className="flex justify-center mt-4 font-medium text-black">
                Felicitations
              </h5>
              <h5 className="flex justify-center text-sm mt-4 font-light text-black">
                Votre mot de passe a ete modifie avec succes
              </h5>
              <BtnPrimary
                text="Retour a la page de connexion"
                className="w-80 mt-10"
                onClick={goHome}
                type="button"
              />
            </div>
          </div>
        </div>
      )}

      <LayoutAuth>
        <div className="w-full md:h-full lg:p-14">
          <h1 className="mb-3 text-3xl font-bold">
            Changer votre mot de passe
          </h1>
          <p className="text-sm mb-4 text-gray-400">
            Votre nouveau mot de passe doit etre different de celui precedemment
            utilise.
          </p>
          <form onSubmit={handleChangePassword}>
            <InputPassword
              error={error}
              id="password"
              required={true}
              placeholder="Nouveau mot de passe"
              className=""
              value={password}
              setValue={setPassword}
            />
            <div className="mb-5"></div>
            <InputPassword
              error={error}
              id="passwordConfirm"
              required={true}
              placeholder="Confirmer votre mot de passe"
              className=""
              value={passwordConfirm}
              setValue={setPasswordConfirm}
            />

            <BtnPrimary
              text="Changer le mot de passe"
              loading={loading}
              type="submit"
              className="mt-5 font-bold"
            />
          </form>
          <div
            onClick={goBack}
            className="flex align-middle text-center gap-2 mt-8 cursor-pointer items-center"
          >
            <ChevronLeft className="text-yellow-400 w-5 h-5" />
            <span className="text-gray-400 text-sm">
              Revenir a la page de verification
            </span>
          </div>
          <div className="bg-error mb-2 mt-6 text-gray-400 text-sm">
            <h5 className="mb-2">Doit contenir au moins:</h5>
            <h5 className="invalid mb-2">
              - Minimum <b className="text-yellow-400">8 caracteres</b>
            </h5>
            <h5 className="invalid mb-2">
              - Lettres <b className="text-yellow-400">minuscule</b> entre (a-z)
            </h5>
            <h5 className="invalid mb-2">
              - Lettres <b className="text-yellow-400">majuscules</b> entre (A-Z)
            </h5>
            <h5 className="invalid mb-0">
              - Des <b className="text-yellow-400">nombre</b> compris entre (0-9)
            </h5>
          </div>
        </div>
      </LayoutAuth>
    </>
  );
}
