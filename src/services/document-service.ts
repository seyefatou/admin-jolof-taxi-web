import Axios from "./caller";

export type DocumentType = {
  id: number;
  code: string;
  name: string;
  title: string;
  description: string | null;
  isRequired: boolean;
};

export type DriverDocument = {
  id: number;
  documentType: DocumentType;
  documentUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  expiryDate: string | null;
  uploadedAt: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
};

export type AddDocumentData = {
  driverId: number;
  documentTypeId: number;
  number: string;
  file: File;
  backFile?: File;
  expiryDate?: string;
};

type DocumentTypeListResponse = {
  message: string;
  status: number;
  data: DocumentType[];
};

type DriverDocumentListResponse = {
  message: string;
  status: number;
  data: DriverDocument[];
};

type DriverDocumentOneResponse = {
  message: string;
  status: number;
  data: DriverDocument;
};

type BaseResponse = {
  message: string;
  status: number;
};

// Liste des types de documents
const getDocumentTypes = async () => {
  const res = await Axios.get<DocumentTypeListResponse>(
    `auth_service/settings/document-types`
  );
  return res.data;
};

// Documents d'un chauffeur
const getDriverDocuments = async (matricule: string) => {
  const res = await Axios.get<DriverDocumentListResponse>(
    `auth_service/driver-documents/${matricule}`
  );
  return res.data;
};

// Ajouter un document
const addDocument = async (data: AddDocumentData) => {
  const formData = new FormData();
  formData.append("driverId", data.driverId.toString());
  formData.append("documentTypeId", data.documentTypeId.toString());
  formData.append("number", data.number);
  formData.append("status", "PENDING");
  formData.append("frontImage", data.file);
  if (data.backFile) {
    formData.append("backImage", data.backFile);
  }
  if (data.expiryDate) {
    formData.append("expiryDate", data.expiryDate);
  }

  const res = await Axios.post<DriverDocumentOneResponse>(
    `auth_service/driver-documents/add`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};

// Approuver un document
const approveDocument = async (documentId: number) => {
  const res = await Axios.put<DriverDocumentOneResponse>(
    `auth_service/driver-documents/${documentId}/status`,
    { status: "APPROVED" }
  );
  return res.data;
};

// Rejeter un document
const rejectDocument = async (documentId: number, reason?: string) => {
  const res = await Axios.put<DriverDocumentOneResponse>(
    `auth_service/driver-documents/${documentId}/status`,
    reason ? { status: "REJECTED", rejectionReason: reason } : { status: "REJECTED" }
  );
  return res.data;
};

// Supprimer un document
const deleteDocument = async (documentId: number) => {
  const res = await Axios.delete<BaseResponse>(
    `auth_service/driver-documents/${documentId}/delete`
  );
  return res.data;
};

export const SERVICE_DOCUMENT = {
  getDocumentTypes,
  getDriverDocuments,
  addDocument,
  approveDocument,
  rejectDocument,
  deleteDocument,
};
