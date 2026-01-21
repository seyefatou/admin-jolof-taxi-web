"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_ROLE, RoleProps, PermissionProps } from "@/services/role-service";

type GroupedPermissions = {
  [key: string]: PermissionProps[];
};

const refactorPermissionName = (groupe: string, name: string) => {
  const mapping: Record<string, Record<string, string>> = {
    booking: {
      "CREATE_BOOKING": "Creer une reservation",
      "READ_BOOKING": "Voir les reservations",
      "UPDATE_BOOKING": "Modifier une reservation",
      "DELETE_BOOKING": "Supprimer une reservation",
    },
    user: {
      "CREATE_USER": "Creer un utilisateur",
      "READ_USER": "Voir les utilisateurs",
      "UPDATE_USER": "Modifier un utilisateur",
      "DELETE_USER": "Supprimer un utilisateur",
    },
  };
  return mapping[groupe]?.[name] || name;
};

export default function RolesPage() {
  const [loading, setLoading] = useState(true);
  const [roleList, setRoleList] = useState<RoleProps[]>([]);
  const [permissions, setPermissions] = useState<GroupedPermissions>({});
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [nomRole, setNomRole] = useState("");
  const [codeRole, setCodeRole] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        SERVICE_ROLE.getAll(),
        SERVICE_ROLE.getPermissions(),
      ]);
      setRoleList(rolesRes.data);

      const grouped = permissionsRes.data.reduce((acc: GroupedPermissions, perm: PermissionProps) => {
        if (!acc[perm.groupe]) acc[perm.groupe] = [];
        acc[perm.groupe].push(perm);
        return acc;
      }, {});
      setPermissions(grouped);
    } catch (error) {
      toast.error("Erreur lors de la recuperation des roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const resetForm = () => {
    setNomRole("");
    setCodeRole("");
    setSelectedPermissions([]);
  };

  const handleAddRole = () => {
    resetForm();
    setModalAdd(true);
  };

  const handleEditRole = (role: RoleProps) => {
    setNomRole(role.nom);
    setCodeRole(role.code);
    setSelectedPermissions(role.permissions);
    setModalEdit(true);
  };

  const togglePermission = (permissionName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomRole || selectedPermissions.length === 0) {
      toast.error("Veuillez remplir le nom et selectionner au moins une permission");
      return;
    }

    try {
      setSubmitting(true);
      const res = await SERVICE_ROLE.create(nomRole, selectedPermissions);
      if (res.status === 201) {
        toast.success("Role cree avec succes");
        setModalAdd(false);
        resetForm();
        loadRoles();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la creation");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomRole || selectedPermissions.length === 0) {
      toast.error("Veuillez remplir le nom et selectionner au moins une permission");
      return;
    }

    try {
      setSubmitting(true);
      const res = await SERVICE_ROLE.update(nomRole, selectedPermissions, codeRole);
      if (res.status === 200) {
        toast.success("Role modifie avec succes");
        setModalEdit(false);
        resetForm();
        loadRoles();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const renderModal = (isEdit: boolean) => {
    const title = isEdit ? `Modifier le role ${nomRole}` : "Ajouter un nouveau role";
    const submitHandler = isEdit ? submitEdit : submitAdd;
    const closeHandler = () => {
      isEdit ? setModalEdit(false) : setModalAdd(false);
      resetForm();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">{title}</h2>
            <form onSubmit={submitHandler}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom du role</label>
                  <input
                    type="text"
                    value={nomRole}
                    onChange={(e) => setNomRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                    placeholder="Nom du role"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Liste des autorisations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.keys(permissions).map((groupe) => (
                      <div key={groupe} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-yellow-200 px-4 py-2 font-semibold text-gray-800">
                          {groupe.toUpperCase()}
                        </div>
                        <div className="p-3 space-y-2">
                          {permissions[groupe].map((perm) => (
                            <label key={perm.codePermission} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm.namePermission)}
                                onChange={() => togglePermission(perm.namePermission)}
                                className="w-4 h-4 accent-yellow-400"
                              />
                              <span className="text-sm">
                                {refactorPermissionName(groupe, perm.namePermission)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={closeHandler}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
                >
                  {submitting ? "Chargement..." : isEdit ? "Modifier" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ToastContainer position="bottom-right" />
      {modalAdd && renderModal(false)}
      {modalEdit && renderModal(true)}

      <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl mb-6">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            <Icon icon="mdi:shield-account" className="inline mr-2" />
            Liste des Roles et Permissions
          </h1>
          <button
            onClick={handleAddRole}
            className="px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            <Icon icon="mdi:plus" className="inline mr-1" />
            Nouveau Role
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nom du role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Permissions</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {roleList.length > 0 ? (
              roleList.map((role) => (
                <tr key={role.code} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{role.nom}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 2).map((perm, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            idx === 0 ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {perm}
                        </span>
                      ))}
                      {role.permissions.length > 2 && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          +{role.permissions.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200"
                    >
                      <Icon icon="mdi:pencil" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-gray-100">
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  <Icon icon="mdi:shield-off" className="text-4xl mx-auto mb-2 text-gray-300" />
                  Aucun role disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
