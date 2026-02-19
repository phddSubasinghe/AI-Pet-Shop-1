import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AdminAnalyticsResponse } from "@/lib/api/admin";

const LKR = (n: number) => `LKR ${n.toLocaleString()}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * Generate admin analytics/donation report PDF and trigger download.
 */
export function downloadAdminAnalyticsReportPdf(data: AdminAnalyticsResponse): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 20;

  // ----- Title -----
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Admin Analytics Report", margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Date range: ${data.startDate} to ${data.endDate}`, margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Generated on ${formatDate(new Date().toISOString())}`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 14;

  // ----- Donations by month -----
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Donations by month", margin, y);
  y += 2;

  const donationMonthRows = data.donationsByMonth.map((d) => [
    d.month,
    LKR(d.amount),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Month", "Amount (LKR)"]],
    body: donationMonthRows.length ? donationMonthRows : [["No data", "—"]],
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50 },
    },
  });

  let tableEnd = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y = tableEnd + 14;

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // ----- Adoption requests by status -----
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Adoption requests by status", margin, y);
  y += 2;

  const adoptionRows = data.adoptionRequestsByStatus.map((s) => [s.status, String(s.count)]);

  autoTable(doc, {
    startY: y,
    head: [["Status", "Count"]],
    body: adoptionRows.length ? adoptionRows : [["No data", "—"]],
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 30 },
    },
  });

  tableEnd = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y = tableEnd + 14;

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // ----- Most adopted pet types -----
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Most adopted pet types", margin, y);
  y += 2;

  const petTypeRows = data.topAdoptedPetTypes.map((t) => [t.species, String(t.count)]);

  autoTable(doc, {
    startY: y,
    head: [["Species", "Count"]],
    body: petTypeRows.length ? petTypeRows : [["No data", "—"]],
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50 },
    },
  });

  tableEnd = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y = tableEnd + 14;

  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  // ----- Summary -----
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Average AI compatibility score: ${data.averageAiCompatibilityScore}%`, margin, y);
  y += 6;
  doc.text(`Total users: ${data.totalUsers}`, margin, y);
  y += 6;
  doc.text(`Verified shelters: ${data.verifiedShelters}`, margin, y);
  y += 6;
  doc.text(`Verified sellers: ${data.verifiedSellers}`, margin, y);
  y += 6;
  doc.text(`Active pets listed: ${data.activePetsListed}`, margin, y);

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Page ${p} of ${totalPages} · PawPop Admin Analytics`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);
  }

  const filename = `pawpop-analytics-${data.startDate}-to-${data.endDate}.pdf`;
  doc.save(filename);
}
