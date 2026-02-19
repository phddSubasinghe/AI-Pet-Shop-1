import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AdminDonation } from "@/types/admin";

const LKR = (n: number) => `LKR ${n.toLocaleString()}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Generate donation report PDF for admin and trigger download.
 */
export function downloadAdminDonationsReportPdf(donations: AdminDonation[]): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 20;

  // ----- Title -----
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Donation Report", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${formatDate(new Date().toISOString())}`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 10;

  // ----- Summary -----
  const totalAllTime = donations.reduce((s, d) => s + d.amount, 0);
  const now = new Date();
  const thisMonthDonations = donations.filter((d) => {
    const dDate = new Date(d.date);
    return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
  });
  const totalThisMonth = thisMonthDonations.reduce((s, d) => s + d.amount, 0);
  const recurringDonors = new Set(
    donations.filter((d) => d.type === "recurring").map((d) => d.donorName)
  ).size;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Total donations: ${donations.length}`, margin, y);
  y += 5;
  doc.text(`Total raised (this month): ${LKR(totalThisMonth)}`, margin, y);
  y += 5;
  doc.text(`Total raised (all time): ${LKR(totalAllTime)}`, margin, y);
  y += 5;
  doc.text(`Recurring donors: ${recurringDonors}`, margin, y);
  y += 12;

  // ----- Donations table -----
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("All donations", margin, y);
  y += 2;

  const contact = (d: AdminDonation) => {
    const parts = [d.donorPhone, d.donorEmail].filter(Boolean);
    return parts.length ? parts.join(" · ") : "—";
  };

  const donationRows = [...donations]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((d) => [
      d.donorName.length > 25 ? d.donorName.slice(0, 22) + "…" : d.donorName,
      contact(d).length > 28 ? contact(d).slice(0, 25) + "…" : contact(d),
      LKR(d.amount),
      d.type,
      (d.shelterName && d.shelterName.length > 20 ? d.shelterName.slice(0, 17) + "…" : d.shelterName) || "—",
      (d.campaignName && d.campaignName.length > 22 ? d.campaignName.slice(0, 19) + "…" : d.campaignName) || "—",
      formatDateTime(d.date),
    ]);

  autoTable(doc, {
    startY: y,
    head: [["Donor", "Contact", "Amount", "Type", "Shelter", "Campaign", "Date"]],
    body: donationRows.length ? donationRows : [["No donations", "—", "—", "—", "—", "—", "—"]],
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 42 },
      2: { cellWidth: 28 },
      3: { cellWidth: 22 },
      4: { cellWidth: 35 },
      5: { cellWidth: 38 },
      6: { cellWidth: 35 },
    },
  });

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Page ${p} of ${totalPages} · PawPop Donation Report`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);
  }

  const filename = `pawpop-donation-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
