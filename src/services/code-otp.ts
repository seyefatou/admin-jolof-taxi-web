import Axios from "./caller";

type CodeOTPResponse = {
  status: number;
  message?: string;
};

const validateOTP = async (code: string, identifierr: string) => {
  const res = await Axios.post<CodeOTPResponse>(
    `auth_service/auth/admin/signin/check_code`,
    {
      identifier: identifierr,
      code: code,
    }
  );
  return res.data;
};

export const SERVICE_CODE_OTP = {
  validateOTP,
};
