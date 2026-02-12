"use client";

import { useEffect, useState } from "react";
import InputIcon from "@/components/inputs/input-icon";
import InputPassword from "@/components/inputs/input-password";
import BtnPrimary from "@/components/buttons/btn-primary";
import { SERVICE_LOGIN } from "@/services/login-service";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LayoutAuth } from "@/components/layouts/layout-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AUTH } from "@/common/urls/auth";
import { TRAFIC } from "@/common/urls/trafic";

export default function Login() {
  const router = useRouter();
  const [identify, setIdentify] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [remember, setRemember] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedIdentify = localStorage.getItem("identify");
      const savedPassword = localStorage.getItem("password");
      const savedRemember = localStorage.getItem("remember");

      if (savedIdentify) setIdentify(savedIdentify);
      if (savedPassword) setPassword(savedPassword);
      if (savedRemember === "true") setRemember(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (identify && password) {
        console.log(identify, password);
        const res = await SERVICE_LOGIN.login(identify, password);
        if (res.data?.access_token) {
          SERVICE_LOGIN.saveToken(res.data.access_token);
          SERVICE_LOGIN.refreshToken(res.data.refresh_token);
          const user = (await SERVICE_LOGIN.getinfoConnectUser()).data;
          console.log(user);
          const tel = user.data.phone;
          const name = user.data.name;
          const role = user.data.role;
          const email = user.data.email;

          localStorage.setItem("name", name);
          localStorage.setItem("role", role.nom);
          localStorage.setItem("email", email);
          localStorage.setItem("tel", tel);
          localStorage.setItem("matricule", user.data.matricule || "");

          if (remember) {
            localStorage.setItem("password", password);
            localStorage.setItem("identify", email);
            localStorage.setItem("remember", "true");
          } else {
            localStorage.removeItem("password");
            localStorage.removeItem("identify");
            localStorage.removeItem("remember");
          }

          const islog = SERVICE_LOGIN.isLoggedIn();
          if (islog) {
            router.push(`/trafic${TRAFIC.trafic_dashboard}`);
          } else {
            router.push(AUTH.Login);
          }

          setError(false);
        } else {
          setError(true);
        }
      }
    } catch (error) {
      setError(true);
      toast.error(`Identifiant ou mot de passe incorrect.`, {
        position: "top-center",
        autoClose: 1000,
        pauseOnFocusLoss: true,
        closeButton: true,
        pauseOnHover: false,
        hideProgressBar: false,
        closeOnClick: true,
        draggable: true,
      });
    }
    setLoading(false);
  };

  const rememberOnchange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRemember(event.target.checked);
  };

  useEffect(() => {
    const isloged = SERVICE_LOGIN.isLoggedIn();
    if (isloged) {
      router.push(`/trafic${TRAFIC.trafic_dashboard}`);
    }
  }, [router]);

  return (
    <LayoutAuth>
      <div className="w-full md:h-full lg:p-14">
        <h1 className="mb-2 text-3xl font-bold">Se connecter</h1>

        <form onSubmit={handleLogin}>
          <InputIcon
            id="name"
            error={error}
            required={true}
            icon="hugeicons:mail-02"
            placeholder="Identifiant"
            className="mb-5"
            value={identify}
            setValue={setIdentify}
          />
          <InputPassword
            error={error}
            id="password"
            required={true}
            placeholder="Mot de passe"
            className=""
            value={password}
            setValue={setPassword}
          />
          <div className="flex justify-between gap-10 mt-4">
            <div className="flex items-center content-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={remember}
                onChange={rememberOnchange}
                className="w-5 h-5 mt-1 font-medium accent-yellow-400 before:checked:border-yellow-300"
              />
              <span className="text-sm whitespace-nowrap">Se Rappeler</span>
            </div>
            <Link href={AUTH.ForgetPassword}>
              <span className="text-sm text-yellow-300 cursor-pointer">
                Mot de passe oublie
              </span>
            </Link>
          </div>
          <BtnPrimary
            text="Connexion"
            loading={loading}
            type="submit"
            className="mt-5 font-bold border border-black"
          />
        </form>
      </div>
    </LayoutAuth>
  );
}
