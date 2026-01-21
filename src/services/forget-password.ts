import Axios from "./caller";

type ForgetPasswordResponse = {
  statusCode: string;
  success: boolean;
  message?: string;
  data: boolean;
};

const forgetPassword = async (identifiant: string) => {
  const res = await Axios.post<ForgetPasswordResponse>(
    "auth_service/auth/admin/signin/forget_password",
    {
      identifier: identifiant,
    }
  );
  return res.data;
};

export const SERVICE_FORGET_PASSWORD = {
  forgetPassword,
};
