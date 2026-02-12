"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_LOGIN } from "@/services/login-service";
import { SERVICE_ADMINISTRATEUR } from "@/services/administrateur-service";

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [matricule, setMatricule] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");

  // Change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await SERVICE_LOGIN.getinfoConnectUser();
      if (res.status === 200) {
        const user = res.data.data;
        const mat = user.matricule || localStorage.getItem("matricule") || "";
        setMatricule(mat);
        setName(user.name || "");
        setEmail(user.email || "");
        setPhone(user.phone?.replace("+221", "") || "");
        setAddress(user.adresse || "");
        setRole(user.role?.nameRole || "");
      }
    } catch (error) {
      const storedMatricule = localStorage.getItem("matricule");
      const storedName = localStorage.getItem("name");
      const storedEmail = localStorage.getItem("email");
      const storedRole = localStorage.getItem("role");
      if (storedMatricule) setMatricule(storedMatricule);
      if (storedName) setName(storedName);
      if (storedEmail) setEmail(storedEmail);
      if (storedRole) setRole(storedRole);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      setSubmitting(true);
      const phoneFormatted = phone.startsWith("+221") ? phone : `+221${phone}`;
      const res = await SERVICE_ADMINISTRATEUR.update(matricule, name, email, phoneFormatted, address);
      if (res.status === 200) {
        toast.success("Profil mis a jour avec succes");
        localStorage.setItem("name", name);
        localStorage.setItem("email", email);
        setEditing(false);
        await loadProfile();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la mise a jour");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    try {
      setSubmittingPassword(true);
      const res = await SERVICE_LOGIN.changePassword(oldPassword, newPassword, confirmPassword);
      if (res.status === 200) {
        toast.success("Mot de passe modifie avec succes");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors du changement de mot de passe");
    } finally {
      setSubmittingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <ToastContainer position="bottom-right" />

      <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl mb-6">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            <Icon icon="mdi:account-circle" className="inline mr-2" />
            Mon Profil
          </h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              <Icon icon="mdi:pencil" className="inline mr-1" />
              Modifier
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-32 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-5xl font-bold text-yellow-500">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-20 px-8 pb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{name}</h2>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {role || "Administrateur"}
            </span>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telephone
                  </label>
                  <div className="flex">
                    <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                      +221
                    </span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300"
                      maxLength={9}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
                >
                  {submitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:account" className="text-2xl text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nom complet</p>
                    <p className="font-medium text-gray-800">{name || "Non defini"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:email" className="text-2xl text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{email || "Non defini"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:phone" className="text-2xl text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telephone</p>
                    <p className="font-medium text-gray-800">
                      {phone ? `+221 ${phone}` : "Non defini"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:map-marker" className="text-2xl text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="font-medium text-gray-800">{address || "Non defini"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Change Password Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden mt-6">
        <div className="p-4 flex items-center justify-between bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            <Icon icon="mdi:lock-reset" className="inline mr-2" />
            Changer le mot de passe
          </h2>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="px-4 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              <Icon icon="mdi:pencil" className="inline mr-1" />
              Modifier
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300"
                  placeholder="Entrez votre mot de passe actuel"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon icon={showOldPassword ? "mdi:eye-off" : "mdi:eye"} className="text-xl" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300"
                  placeholder="Entrez votre nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon icon={showNewPassword ? "mdi:eye-off" : "mdi:eye"} className="text-xl" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300"
                  placeholder="Confirmez votre nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"} className="text-xl" />
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-400 space-y-1">
              <p>Doit contenir au moins :</p>
              <p>- Minimum <span className="text-yellow-500 font-medium">8 caracteres</span></p>
              <p>- Lettres <span className="text-yellow-500 font-medium">minuscules</span> (a-z)</p>
              <p>- Lettres <span className="text-yellow-500 font-medium">majuscules</span> (A-Z)</p>
              <p>- Des <span className="text-yellow-500 font-medium">nombres</span> (0-9)</p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submittingPassword}
                className="px-6 py-3 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
              >
                {submittingPassword ? "Enregistrement..." : "Changer le mot de passe"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
