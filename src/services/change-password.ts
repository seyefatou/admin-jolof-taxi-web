import Axios from "./caller";

type ChangePasswordResponse = {
  statusCode: string;
  success: boolean;
  message?: string;
};

const changePassword = async (
  password: string,
  password_confirm: string,
  token: string,
  matricule: string,
  token_expire: string
) => {
  const res = await Axios.put<ChangePasswordResponse>(
    `/admin/signin/forgetpassword/${token}/by/${matricule}/at/${token_expire}`,
    {
      password_admin: password,
      password_admin_confirm: password_confirm,
    }
  );
  return res.data;
};

export const SERVICE_UPDATE_PASSWORD = {
  changePassword,
};
