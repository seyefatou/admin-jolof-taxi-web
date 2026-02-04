export type UserResponse = {
  message: string;
  status: number;
  data: UserData;
};

export type UserData = {
  name: string;
  matricule: string;
  phone: string;
  email: string;
  adresse: string;
  status: string;
  role: Role;
};

export type Role = {
  nom: string;
  nameRole?: string;
  code: string;
  permissions: string[];
};

export type LoginResponse = {
  message: string;
  status: number;
  data: LoginData;
};

export type LoginData = {
  access_token: string;
  refresh_token: string;
  refresh_expire_at: string;
};
