import Axios from "./caller";

type ChangePasswordResponse = {
  statusCode: string;
  success: boolean;
  message?: string;
};

const changePassword = async (
  identifier: string,
  password: string,
  password_confirm: string
) => {
  const res = await Axios.post<ChangePasswordResponse>(
    `/auth_service/auth/admin/signin/reset-password`,
    {
      identifier,
      password,
      password_confirm,
    }
  );
  return res.data;
};

export const SERVICE_UPDATE_PASSWORD = {
  changePassword,
};
