"use client";

import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import BtnPrimary from "@/components/buttons/btn-primary";
import { SERVICE_CODE_OTP } from "@/services/code-otp";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LayoutAuth } from "@/components/layouts/layout-auth";
import { useRouter, useParams } from "next/navigation";
import { SERVICE_FORGET_PASSWORD } from "@/services/forget-password";
import { AUTH } from "@/common/urls/auth";
import { ChevronLeft } from "lucide-react";

export default function OtpConfirm() {
  const fieldsRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const identify = params.identify as string;
  const [loading, setLoading] = useState<boolean>(false);
  const [loading2, setLoading2] = useState<boolean>(false);
  const numberInput: number = 4;
  const [otpValue, setOtpValue] = useState<string>("".padEnd(numberInput, ""));
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const router = useRouter();
  const minutes: number = Math.floor(timeLeft / 60);
  const seconds: number = timeLeft % 60;

  const goBack = () => {
    router.back();
  };

  const ResendForgetPassword = async () => {
    try {
      setLoading2(true);
      const res = await SERVICE_FORGET_PASSWORD.forgetPassword(identify);
      if (res.success) {
        setTimeLeft(120);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading2(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    if (!/^\d$/.test(value)) return;

    const newOtpValue =
      otpValue.substring(0, index) + value + otpValue.substring(index + 1);
    setOtpValue(newOtpValue);

    if (value && index < numberInput - 1) {
      const nextField = fieldsRef.current?.children[
        index + 1
      ] as HTMLInputElement;
      if (nextField) nextField.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData("text");
    if (!/^\d+$/.test(pasteData)) return;

    const newOtpValue = pasteData.slice(0, numberInput);
    setOtpValue(newOtpValue);

    const elements = fieldsRef.current?.children;
    if (elements) {
      newOtpValue.split("").forEach((char: string, idx: number) => {
        if (idx < elements.length) {
          (elements[idx] as HTMLInputElement).value = char;
        }
      });
    }
  };

  const inputFocus = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    const elements = fieldsRef.current?.children;

    if (e.key === "Backspace" || e.key === "Delete") {
      const value = (e.target as HTMLInputElement).value;

      if (value) {
        setOtpValue(
          otpValue.substring(0, index) + "" + otpValue.substring(index + 1)
        );
        (e.target as HTMLInputElement).value = "";
        const prevField = elements
          ? (elements[index - 1] as HTMLInputElement)
          : null;
        if (prevField) {
          prevField.focus();
          prevField.value = "";
          setOtpValue(
            otpValue.substring(0, index - 1) + "" + otpValue.substring(index)
          );
        }
      }
    }
  };

  const ValidateChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (otpValue && identify) {
        const res = await SERVICE_CODE_OTP.validateOTP(otpValue, identify);
        console.log(res);

        if (res.status === 200) {
          router.push(`${AUTH.ChangePassword}/${identify}`);
        } else {
          toast.info(`Reseau instable`, {
            position: "top-center",
            autoClose: 5000,
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
        toast.error(`Code invalide`, {
          position: "top-center",
          autoClose: 5000,
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (timeLeft === 0) {
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  return (
    <LayoutAuth>
      <div className="w-full md:h-full xl:p-16 sm:p-16 lg:p-24">
        <h1 className="mb-2 text-3xl font-bold">Verification en 2 etapes</h1>
        <h4 className="text-sm text-gray-400">
          Nous avons envoye un code de verification a votre adresse electronique.
        </h4>
        <h4 className="mb-5 text-sm text-gray-400">
          Entrer le code de l&apos;email dans le champ ci-dessous.
        </h4>

        <form onSubmit={ValidateChangePassword}>
          <div className="flex justify-between gap-7" ref={fieldsRef}>
            {[...Array(numberInput)].map((_, index) => (
              <input
                key={index}
                type="text"
                data-index={index}
                required
                maxLength={1}
                placeholder="0"
                value={otpValue[index] || ""}
                className="block w-16 h-16 p-2 text-2xl font-medium text-center border border-gray-200 focus:outline-none bg-gray-50 focus:border-transparent rounded-xl focus:ring-yellow-200 focus:ring-2"
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => inputFocus(e, index)}
                onPaste={handlePaste}
              />
            ))}
          </div>

          <BtnPrimary
            text="Verifier mon compte"
            type="submit"
            className="mt-5 mb-3 font-bold"
            loading={loading}
          />
        </form>

        <div className="mt-2 text-sm text-center">
          {timeLeft !== 0 ? (
            <div className="mb-0 text-gray-400">
              Renvoyer un nouveau code dans{" "}
              <span className="text-yellow-400 font-semibold">
                {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 p-3 mb-0 text-gray-400">
              Je ne l&apos;ai pas encore recu?{" "}
              {loading2 ? (
                <svg
                  aria-hidden="true"
                  className="w-3 h-3 text-sm text-yellow-200 animate-spin fill-yellow-600"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              ) : (
                <button
                  onClick={ResendForgetPassword}
                  className="text-yellow-400 font-bold"
                >
                  Renvoyer un nouveau code
                </button>
              )}
            </div>
          )}
        </div>
        <div
          onClick={goBack}
          className="flex items-center gap-2 mt-8 text-center align-middle cursor-pointer"
        >
          <ChevronLeft className="text-yellow-400 w-5 h-5" />
          <span className="text-sm text-gray-400">
            Revenir a la page de verification
          </span>
        </div>
      </div>
    </LayoutAuth>
  );
}
