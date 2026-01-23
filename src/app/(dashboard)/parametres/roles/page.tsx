"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_ROLE, RoleProps, PermissionProps } from "@/services/role-service";
import {
  AnimatedTableRow,
  StatCard,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableCell,
  EmptyState,
  PageHeader,
  AddButton,
} from "@/components/ui/AnimatedTable";

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

const permissionColors = [
  { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
];

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

  // Stats
  const stats = {
    total: roleList.length,
    totalPermissions: Object.values(permissions).flat().length,
    categories: Object.keys(permissions).length,
  };

  const renderModal = (isEdit: boolean) => {
    const title = isEdit ? `Modifier le role ${nomRole}` : "Ajouter un nouveau role";
    const submitHandler = isEdit ? submitEdit : submitAdd;
    const closeHandler = () => {
      isEdit ? setModalEdit(false) : setModalAdd(false);
      resetForm();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4 animate-fadeIn">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 border-b border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-200 rounded-xl">
                <Icon icon={isEdit ? "mdi:pencil" : "mdi:shield-plus"} className="text-2xl text-yellow-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-500">
                  {isEdit ? "Modifiez les permissions du role" : "Definissez un nouveau role avec ses permissions"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={submitHandler} className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Icon icon="mdi:tag" className="inline mr-2 text-yellow-500" />
                  Nom du role
                </label>
                <input
                  type="text"
                  value={nomRole}
                  onChange={(e) => setNomRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-200"
                  placeholder="Nom du role"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon="mdi:shield-check" className="text-yellow-600 text-xl" />
                  <h3 className="text-lg font-semibold text-gray-800">Liste des autorisations</h3>
                  <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                    {selectedPermissions.length} selectionnee(s)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(permissions).map((groupe, groupIndex) => (
                    <div key={groupe} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-gradient-to-r from-yellow-100 to-amber-100 px-4 py-3 border-b border-yellow-200">
                        <div className="flex items-center gap-2">
                          <Icon icon="mdi:folder-key" className="text-yellow-600" />
                          <span className="font-semibold text-gray-800">{groupe.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        {permissions[groupe].map((perm) => (
                          <label
                            key={perm.codePermission}
                            className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-all duration-200 ${
                              selectedPermissions.includes(perm.namePermission)
                                ? "bg-yellow-50 border border-yellow-200"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.namePermission)}
                              onChange={() => togglePermission(perm.namePermission)}
                              className="w-5 h-5 accent-yellow-400 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">
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

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={closeHandler}
                className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors duration-200"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-yellow-300 to-yellow-400 text-black font-semibold rounded-xl hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                    Chargement...
                  </>
                ) : (
                  <>
                    <Icon icon={isEdit ? "mdi:check" : "mdi:plus"} />
                    {isEdit ? "Modifier" : "Enregistrer"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-400 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ToastContainer position="bottom-right" />
      {modalAdd && renderModal(false)}
      {modalEdit && renderModal(true)}

      {/* Header */}
      <PageHeader
        title="Roles et Permissions"
        icon="mdi:shield-account"
        count={roleList.length}
        action={<AddButton onClick={handleAddRole} label="Nouveau Role" />}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Roles" value={stats.total} icon="mdi:shield-account" color="yellow" index={0} />
        <StatCard title="Permissions" value={stats.totalPermissions} icon="mdi:key" color="blue" index={1} />
        <StatCard title="Categories" value={stats.categories} icon="mdi:folder-multiple" color="purple" index={2} />
      </div>

      {/* Tableau */}
      <TableContainer>
        <table className="w-full">
          <TableHeader>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Permissions</TableHeaderCell>
            <TableHeaderCell className="text-center">Actions</TableHeaderCell>
          </TableHeader>
          <tbody>
            {roleList.length > 0 ? (
              roleList.map((role, index) => (
                <AnimatedTableRow key={role.code} index={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Icon icon="mdi:shield-account" className="text-xl text-yellow-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">{role.nom}</span>
                        <p className="text-xs text-gray-400 font-mono">{role.code}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.slice(0, 3).map((perm, idx) => {
                        const colorSet = permissionColors[idx % permissionColors.length];
                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full ${colorSet.bg} ${colorSet.text} border ${colorSet.border} shadow-sm`}
                          >
                            <Icon icon="mdi:check-circle" className="text-xs" />
                            {perm}
                          </span>
                        );
                      })}
                      {role.permissions.length > 3 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full border border-yellow-200 shadow-sm">
                          <Icon icon="mdi:plus-circle" className="text-xs" />
                          +{role.permissions.length - 3} autres
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="p-2.5 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 rounded-xl hover:from-yellow-200 hover:to-yellow-300 transition-all duration-200 hover:scale-110 shadow-sm"
                    >
                      <Icon icon="mdi:pencil" className="text-lg" />
                    </button>
                  </TableCell>
                </AnimatedTableRow>
              ))
            ) : (
              <EmptyState
                icon="mdi:shield-off"
                title="Aucun role disponible"
                description="Les roles apparaitront ici une fois ajoutes"
              />
            )}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
