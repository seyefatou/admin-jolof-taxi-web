"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { ChauffeurProps } from "@/services/chauffeur-service";
import { GaragesProps } from "@/services/garage-service";
import { VehiculeTypeResp } from "@/services/vehicule-service";

// Fonction pour compresser une image
const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Si ce n'est pas une image, retourner le fichier tel quel
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Calculer les nouvelles dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              console.log(`Image compressee: ${file.size} -> ${compressedFile.size} bytes`);
              resolve(compressedFile);
            } else {
              reject(new Error("Erreur de compression"));
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

type ChauffeurFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  chauffeur?: ChauffeurProps | null;
  garages: GaragesProps[];
  vehicleTypes: VehiculeTypeResp[];
  loading?: boolean;
};

export default function ChauffeurFormModal({
  isOpen,
  onClose,
  onSubmit,
  chauffeur,
  garages,
  vehicleTypes,
  loading = false,
}: ChauffeurFormModalProps) {
  const isEditMode = !!chauffeur;

  // Form data state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    gender: "Homme",
    address: "",
    latitude: 0,
    longitude: 0,
  });

  // Options
  const [hasGarage, setHasGarage] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [selectedGarageId, setSelectedGarageId] = useState<string>("");

  // Vehicle info
  const [vehicleData, setVehicleData] = useState({
    brand: "",
    model: "",
    year: "",
    typeService: "",
    licensePlate: "",
    licenseNumber: "",
  });

  // Files
  const [permitRecto, setPermitRecto] = useState<File | null>(null);
  const [permitVerso, setPermitVerso] = useState<File | null>(null);
  const [carRegRecto, setCarRegRecto] = useState<File | null>(null);
  const [carRegVerso, setCarRegVerso] = useState<File | null>(null);
  const [booklet, setBooklet] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // Reset form or populate with chauffeur data when modal opens
  useEffect(() => {
    if (isOpen && chauffeur) {
      // Mode edition: pre-remplir avec les donnees existantes
      setFormData({
        fullName: chauffeur.name || "",
        phone: chauffeur.phone?.replace(/^\+221/, "") || "",
        email: chauffeur.email || "",
        gender: "Homme",
        address: "",
        latitude: 0,
        longitude: 0,
      });
      setHasGarage(!!chauffeur.garageAffiliation);
      setSelectedGarageId(chauffeur.garageAffiliation?.id?.toString() || "");
      setHasVehicle(!!chauffeur.vehicule);
      setVehicleData({
        brand: chauffeur.vehicule?.brand || "",
        model: chauffeur.vehicule?.model || "",
        year: chauffeur.vehicule?.year?.toString() || "",
        typeService: chauffeur.vehicule?.type || "",
        licensePlate: chauffeur.vehicule?.licensePlateNumber || "",
        licenseNumber: chauffeur.vehicule?.licenseNumber || "",
      });
      setPermitRecto(null);
      setPermitVerso(null);
      setCarRegRecto(null);
      setCarRegVerso(null);
      setBooklet(null);
    } else if (isOpen && !chauffeur) {
      // Mode creation: reinitialiser le formulaire
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        gender: "Homme",
        address: "",
        latitude: 0,
        longitude: 0,
      });
      setHasGarage(false);
      setHasVehicle(false);
      setSelectedGarageId("");
      setVehicleData({
        brand: "",
        model: "",
        year: "",
        typeService: "",
        licensePlate: "",
        licenseNumber: "",
      });
      setPermitRecto(null);
      setPermitVerso(null);
      setCarRegRecto(null);
      setCarRegVerso(null);
      setBooklet(null);
    }
  }, [isOpen, chauffeur]);

  // Validation
  const isPersonalInfoValid =
    formData.fullName.trim() !== "" &&
    formData.phone.trim().length >= 9 &&
    formData.gender !== "" &&
    formData.address.trim() !== "";

  const isVehicleInfoValid =
    !hasVehicle ||
    (vehicleData.brand !== "" &&
      vehicleData.model !== "" &&
      vehicleData.year !== "" &&
      vehicleData.typeService !== "" &&
      vehicleData.licensePlate !== "" &&
      vehicleData.licenseNumber !== "");

  const isDocumentsValid =
    isEditMode ||
    (permitRecto !== null &&
      permitVerso !== null &&
      (!hasVehicle || (carRegRecto !== null && carRegVerso !== null && booklet !== null)));

  const isFormValid = isPersonalInfoValid && isVehicleInfoValid && isDocumentsValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    try {
      const submitFormData = new FormData();

      // Personal info
      submitFormData.append("fullName", formData.fullName);
      submitFormData.append("phone", `+221${formData.phone.replace(/^\+221/, "")}`);
      if (formData.email) {
        submitFormData.append("email", formData.email);
      }
      submitFormData.append("gender", formData.gender);
      submitFormData.append("address", formData.address);
      submitFormData.append("latitude", formData.latitude.toString());
      submitFormData.append("longitude", formData.longitude.toString());
      submitFormData.append("have_vehicule", hasVehicle.toString());

      // Garage
      if (hasGarage && selectedGarageId) {
        submitFormData.append("garageId", selectedGarageId);
      }

      // Vehicle info
      if (hasVehicle) {
        submitFormData.append("brand", vehicleData.brand);
        submitFormData.append("model", vehicleData.model);
        submitFormData.append("year", vehicleData.year);
        submitFormData.append("typeService", vehicleData.typeService);
        submitFormData.append("licensePlate", vehicleData.licensePlate);
        submitFormData.append("licenseNumber", vehicleData.licenseNumber);
      }

      // Fichiers - Permis de conduire
      if (permitRecto) {
        const compressed = await compressImage(permitRecto);
        submitFormData.append("file_permit_recto", compressed);
      } else if (isEditMode && existingPermitRecto) {
        submitFormData.append("keep_existing_file_permit_recto", "true");
      }
      if (permitVerso) {
        const compressed = await compressImage(permitVerso);
        submitFormData.append("file_permit_verso", compressed);
      } else if (isEditMode && existingPermitVerso) {
        submitFormData.append("keep_existing_file_permit_verso", "true");
      }

      // Fichiers - Documents vehicule
      if (hasVehicle) {
        if (carRegRecto) {
          const compressed = await compressImage(carRegRecto);
          submitFormData.append("file_car_registration_recto", compressed);
        } else if (isEditMode && existingCarRegRecto) {
          submitFormData.append("keep_existing_file_car_registration_recto", "true");
        }
        if (carRegVerso) {
          const compressed = await compressImage(carRegVerso);
          submitFormData.append("file_car_registration_verso", compressed);
        } else if (isEditMode && existingCarRegVerso) {
          submitFormData.append("keep_existing_file_car_registration_verso", "true");
        }
        if (booklet) {
          const compressed = await compressImage(booklet);
          submitFormData.append("file_booklet", compressed);
        } else if (isEditMode && existingBooklet) {
          submitFormData.append("keep_existing_file_booklet", "true");
        }
      }

      await onSubmit(submitFormData);
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Extraire les URLs des documents existants du chauffeur
  const getExistingDocUrl = (keywords: string[], imageType: "front" | "back"): string | null => {
    if (!chauffeur?.driverDocument) return null;
    const doc = chauffeur.driverDocument.find((d) => {
      const title = d.DocumentType?.title?.toLowerCase() || "";
      return keywords.some((kw) => title.includes(kw.toLowerCase()));
    });
    if (!doc) return null;
    return imageType === "front" ? doc.frontImage : doc.backImage;
  };

  // Log les documents pour debug
  useEffect(() => {
    if (isOpen && chauffeur?.driverDocument) {
      console.log("Documents du chauffeur:", chauffeur.driverDocument.map((d) => ({
        id: d.id,
        type: d.DocumentType?.title,
        typeId: d.documentTypeId,
        front: d.frontImage ? "oui" : "non",
        back: d.backImage ? "oui" : "non",
      })));
    }
  }, [isOpen, chauffeur]);

  const existingPermitRecto = getExistingDocUrl(["permis", "permit", "driving", "licence", "license"], "front");
  const existingPermitVerso = getExistingDocUrl(["permis", "permit", "driving", "licence", "license"], "back");
  const existingCarRegRecto = getExistingDocUrl(["carte grise", "carte_grise", "registration", "grise", "immatriculation"], "front");
  const existingCarRegVerso = getExistingDocUrl(["carte grise", "carte_grise", "registration", "grise", "immatriculation"], "back");
  const existingBooklet = getExistingDocUrl(["livret", "booklet", "carnet"], "front");

  const FileUploadBox = ({
    label,
    file,
    setFile,
    side,
    existingImageUrl,
  }: {
    label: string;
    file: File | null;
    setFile: (f: File | null) => void;
    side: string;
    existingImageUrl?: string | null;
  }) => {
    const maxSize = 5 * 1024 * 1024; // 5MB max
    const isTooBig = file && file.size > maxSize;

    return (
      <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
        isTooBig ? "border-red-400 bg-red-50" : file ? "border-green-400 bg-green-50" : existingImageUrl ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:border-yellow-400"
      }`}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          id={`file-${label}-${side}`}
        />
        <label htmlFor={`file-${label}-${side}`} className="cursor-pointer block">
          {file ? (
            <div className="flex flex-col items-center gap-1">
              <div className={`flex items-center gap-2 ${isTooBig ? "text-red-600" : "text-green-600"}`}>
                <Icon icon={isTooBig ? "mdi:alert-circle" : "mdi:check-circle"} className="text-xl" />
                <span className="text-sm truncate max-w-[120px]">{file.name}</span>
              </div>
              <span className={`text-xs ${isTooBig ? "text-red-500" : "text-gray-500"}`}>
                {formatFileSize(file.size)}
                {isTooBig && " (trop gros, sera compresse)"}
              </span>
            </div>
          ) : existingImageUrl ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={existingImageUrl}
                alt={side}
                className="w-20 h-16 object-cover rounded-lg border border-blue-200"
              />
              <div className="flex items-center gap-1 text-blue-600">
                <Icon icon="mdi:image-check" className="text-sm" />
                <span className="text-xs font-medium">Document actuel</span>
              </div>
              <span className="text-[10px] text-gray-400">Cliquer pour remplacer</span>
            </div>
          ) : (
            <div className="text-gray-500">
              <Icon icon="mdi:cloud-upload" className="text-3xl mx-auto mb-1" />
              <p className="text-xs">{side}</p>
              <p className="text-xs text-gray-400">Max 5MB</p>
            </div>
          )}
        </label>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-yellow-300 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon
                  icon={isEditMode ? "mdi:account-edit" : "mdi:account-plus"}
                  className="text-2xl text-black"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">
                  {isEditMode ? "Modifier le chauffeur" : "Creation d'un chauffeur"}
                </h2>
                <p className="text-sm text-black/70">Enregistrer les donnees du chauffeur</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <Icon icon="mdi:close" className="text-xl text-black" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Personal Info Section */}
          <div className="border border-gray-300 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-500 mb-3">Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="col-span-2">
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Prenom et Nom *"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+221</span>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, "") })}
                  placeholder="7X XXX XX XX *"
                  className="w-full pl-14 pr-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                />
              </div>

              {/* Email */}
              <div className="col-span-2">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email (optionnel)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                />
              </div>

              {/* Gender */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl cursor-pointer hover:border-yellow-400 flex-1">
                  <input
                    type="radio"
                    name="gender"
                    value="Homme"
                    checked={formData.gender === "Homme"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="text-yellow-500 focus:ring-yellow-400"
                  />
                  <span className="text-sm">Homme</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl cursor-pointer hover:border-yellow-400 flex-1">
                  <input
                    type="radio"
                    name="gender"
                    value="Femme"
                    checked={formData.gender === "Femme"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="text-yellow-500 focus:ring-yellow-400"
                  />
                  <span className="text-sm">Femme</span>
                </label>
              </div>

              {/* Address */}
              <div className="col-span-2">
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Adresse *"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Coordonnees: {formData.latitude || "0"}, {formData.longitude || "0"}
                </p>
              </div>
            </div>

            {/* Personal Info Valid Indicator */}
            <div className="flex items-center gap-2 mt-3">
              <Icon
                icon={isPersonalInfoValid ? "mdi:check-circle" : "mdi:circle-outline"}
                className={isPersonalInfoValid ? "text-green-500" : "text-gray-300"}
              />
              <span className={`text-xs ${isPersonalInfoValid ? "text-green-500" : "text-gray-400"}`}>
                Informations personnelles {isPersonalInfoValid ? "completes" : "incompletes"}
              </span>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasGarage}
                onChange={(e) => setHasGarage(e.target.checked)}
                className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400"
              />
              <span className="text-sm text-gray-700">Le chauffeur fait partie d'un garage?</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasVehicle}
                onChange={(e) => setHasVehicle(e.target.checked)}
                className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400"
              />
              <span className="text-sm text-gray-700">Le chauffeur possede un vehicule</span>
            </label>
          </div>

          {/* Garage Selection */}
          {hasGarage && (
            <div className="border border-gray-300 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-bold text-gray-500 mb-3">Selection du garage</h3>
              <select
                value={selectedGarageId}
                onChange={(e) => setSelectedGarageId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
              >
                <option value="">Selectionner un garage</option>
                {garages.map((garage) => (
                  <option key={garage.id} value={garage.id}>
                    {garage.name} - {garage.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Vehicle Info Section */}
          {hasVehicle && (
            <div className="border border-gray-300 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-bold text-gray-500 mb-3">Informations du vehicule</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={vehicleData.brand}
                  onChange={(e) => setVehicleData({ ...vehicleData, brand: e.target.value })}
                  placeholder="Marque *"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                />
                <input
                  type="text"
                  value={vehicleData.model}
                  onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                  placeholder="Modele *"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                />
                <input
                  type="number"
                  value={vehicleData.year}
                  onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                  placeholder="Annee *"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                />
                <select
                  value={vehicleData.typeService}
                  onChange={(e) => setVehicleData({ ...vehicleData, typeService: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                >
                  <option value="">Type de service *</option>
                  {vehicleTypes.map((type) => (
                    <option key={type.id} value={type.type}>
                      {type.type}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={vehicleData.licensePlate}
                  onChange={(e) => setVehicleData({ ...vehicleData, licensePlate: e.target.value.toUpperCase() })}
                  placeholder="Immatriculation *"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                />
                <input
                  type="text"
                  value={vehicleData.licenseNumber}
                  onChange={(e) => setVehicleData({ ...vehicleData, licenseNumber: e.target.value })}
                  placeholder="Numero de licence *"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none"
                />
              </div>

              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-500">
                  * Seuls les taxis de moins de 2 ans peuvent faire partie du service <strong>CONFORT+</strong>
                </p>
                <p className="text-xs text-red-500">
                  * Seuls les taxis de moins de 10 ans peuvent faire partie du service <strong>CONFORT</strong>
                </p>
              </div>

              {/* Vehicle Info Valid Indicator */}
              <div className="flex items-center gap-2 mt-3">
                <Icon
                  icon={isVehicleInfoValid ? "mdi:check-circle" : "mdi:circle-outline"}
                  className={isVehicleInfoValid ? "text-green-500" : "text-gray-300"}
                />
                <span className={`text-xs ${isVehicleInfoValid ? "text-green-500" : "text-gray-400"}`}>
                  Informations vehicule {isVehicleInfoValid ? "completes" : "incompletes"}
                </span>
              </div>
            </div>
          )}

          {/* Documents - Permis de conduire (required) */}
          <div className="border border-gray-300 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-500 mb-3">
              Permis de conduire {isEditMode ? "" : "*"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FileUploadBox label="permit" file={permitRecto} setFile={setPermitRecto} side="Recto" existingImageUrl={existingPermitRecto} />
              <FileUploadBox label="permit" file={permitVerso} setFile={setPermitVerso} side="Verso" existingImageUrl={existingPermitVerso} />
            </div>
          </div>

          {/* Documents - Vehicle docs (if hasVehicle) */}
          {hasVehicle && (
            <>
              <div className="border border-gray-300 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-bold text-gray-500 mb-3">
                  Carte Grise {isEditMode ? "" : "*"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FileUploadBox label="carReg" file={carRegRecto} setFile={setCarRegRecto} side="Recto" existingImageUrl={existingCarRegRecto} />
                  <FileUploadBox label="carReg" file={carRegVerso} setFile={setCarRegVerso} side="Verso" existingImageUrl={existingCarRegVerso} />
                </div>
              </div>

              <div className="border border-gray-300 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-bold text-gray-500 mb-3">
                  Livret {isEditMode ? "" : "*"}
                </h3>
                <FileUploadBox label="booklet" file={booklet} setFile={setBooklet} side="Document" existingImageUrl={existingBooklet} />
              </div>
            </>
          )}

          {/* Documents Valid Indicator */}
          <div className="flex items-center gap-2 mb-4">
            <Icon
              icon={isDocumentsValid ? "mdi:check-circle" : "mdi:circle-outline"}
              className={isDocumentsValid ? "text-green-500" : "text-gray-300"}
            />
            <span className={`text-xs ${isDocumentsValid ? "text-green-500" : "text-gray-400"}`}>
              Documents {isDocumentsValid ? "complets" : "incomplets"}
            </span>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isFormValid || submitting || loading}
              className={`flex-1 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                isFormValid
                  ? "bg-yellow-300 text-black hover:bg-yellow-400"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Icon icon="mdi:check" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
