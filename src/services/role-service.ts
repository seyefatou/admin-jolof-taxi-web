import Axios from "./caller";

export type RoleProps = {
  nom: string;
  code: string;
  permissions: string[];
};

export type PermissionProps = {
  groupe: string;
  namePermission: string;
  codePermission: string;
};

type RoleListResponse = {
  message: string;
  status: number;
  data: RoleProps[];
};

type PermissionListResponse = {
  message: string;
  status: number;
  data: PermissionProps[];
};

const getAll = async () => {
  const res = await Axios.get<RoleListResponse>(`auth_service/secures/roles`);
  return res.data;
};

const getPermissions = async () => {
  const res = await Axios.get<PermissionListResponse>(
    `auth_service/secures/permissions`
  );
  return res.data;
};

const create = async (name: string, permissions: string[]) => {
  const res = await Axios.post<RoleListResponse>(
    `auth_service/secures/roles/store`,
    {
      nom: name,
      permissions: permissions,
    }
  );
  return res.data;
};

const update = async (
  name: string,
  permissions: string[],
  code_role: string
) => {
  const res = await Axios.put<RoleListResponse>(
    `auth_service/secures/roles/${code_role}/update`,
    {
      nom: name,
      permissions: permissions,
    }
  );
  return res.data;
};

export const SERVICE_ROLE = {
  getAll,
  getPermissions,
  create,
  update,
};
