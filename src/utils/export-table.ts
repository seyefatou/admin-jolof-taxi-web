import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ---------- Types ----------

export type ExportColumn<T> = {
  header: string;
  accessor: (item: T) => string | number;
};

export type ExportConfig<T> = {
  fileName: string;
  title: string;
  columns: ExportColumn<T>[];
  data: T[];
};

// ---------- Status labels ----------

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  PENDING: "En attente",
  DEACTIVATED: "Desactive",
  BANNED: "Banni",
  INACTIVE: "Inactif",
};

export const ONLINE_LABELS: Record<string, string> = {
  GOOD: "Bonne connexion",
  POOR: "Mauvaise connexion",
  DISCONNECTED: "Deconnecte",
};

// ---------- Helpers ----------

function todaySuffix(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------- Excel export ----------

export function exportToExcel<T>(config: ExportConfig<T>): void {
  const { fileName, title, columns, data } = config;

  const rows = data.map((item) =>
    columns.reduce(
      (acc, col) => {
        acc[col.header] = col.accessor(item);
        return acc;
      },
      {} as Record<string, string | number>
    )
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title);

  XLSX.writeFile(workbook, `${fileName}_${todaySuffix()}.xlsx`);
}

// ---------- PDF export ----------

export function exportToPDF<T>(config: ExportConfig<T>): void {
  const { fileName, title, columns, data } = config;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header bar (Jolof yellow branding)
  doc.setFillColor(250, 204, 21); // yellow-400
  doc.rect(0, 0, 297, 18, "F");
  doc.setTextColor(113, 63, 18); // yellow-900
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Jolof Taxi — ${title}`, 10, 12);

  // Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Exporte le ${todaySuffix()}`, 250, 12);

  // Table
  const head = [columns.map((c) => c.header)];
  const body = data.map((item) => columns.map((c) => String(c.accessor(item))));

  autoTable(doc, {
    startY: 24,
    head,
    body,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: {
      fillColor: [250, 204, 21],
      textColor: [113, 63, 18],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [255, 251, 235] }, // yellow-50
    margin: { left: 10, right: 10 },
  });

  doc.save(`${fileName}_${todaySuffix()}.pdf`);
}
