import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type CampaignForPdf = {
  id: string;
  title: string;
  goal: number;
  raised: number;
  endDate: string;
  status?: string;
};

export type DonationForPdf = {
  id: string;
  donorName: string;
  amount: number;
  campaignName?: string | null;
  donatedAt: string;
};

const LKR = (n: number) => `LKR ${n.toLocaleString()}`;
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * Generate an interactive fundraising report PDF and trigger download.
 * Includes title, summary, campaigns table, and donations table with clear sections.
 */
export function downloadFundraisingReportPdf(
  shelterName: string,
  campaigns: CampaignForPdf[],
  donations: DonationForPdf[]
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 20;

  // ----- Title block -----
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Fundraising Report", margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(shelterName || "Shelter", margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.text(`Generated on ${formatDate(new Date().toISOString())}`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 14;

  // ----- Summary -----
  const totalRaised = campaigns.reduce((s, c) => s + c.raised, 0);
  const publicCount = campaigns.filter((c) => c.status === "approved").length;
  const pendingCount = campaigns.filter((c) => c.status === "pending").length;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Total raised (all campaigns): ${LKR(totalRaised)}`, margin, y);
  y += 6;
  doc.text(`Campaigns: ${publicCount} public, ${pendingCount} pending`, margin, y);
  y += 6;
  doc.text(`Donations recorded: ${donations.length}`, margin, y);
  y += 12;

  // ----- Campaigns table -----
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Campaigns", margin, y);
  y += 2;

  const campaignRows = campaigns.map((c) => [
    c.title.length > 45 ? c.title.slice(0, 42) + "…" : c.title,
    LKR(c.goal),
    LKR(c.raised),
    c.status === "approved" ? "Public" : c.status === "rejected" ? "Rejected" : "Pending",
    formatDate(c.endDate),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Campaign", "Goal", "Raised", "Status", "End date"]],
    body: campaignRows,
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 28 },
      2: { cellWidth: 28 },
      3: { cellWidth: 22 },
      4: { cellWidth: 28 },
    },
  });

  const afterCampaigns = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y = afterCampaigns + 12;

  // New page if not enough space for donations header + table
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  // ----- Donations table -----
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Donations", margin, y);
  y += 2;

  const donationRows = donations.map((d) => [
    d.donorName.length > 30 ? d.donorName.slice(0, 27) + "…" : d.donorName,
    LKR(d.amount),
    (d.campaignName && d.campaignName.length > 25 ? d.campaignName.slice(0, 22) + "…" : d.campaignName) || "—",
    formatDate(d.donatedAt),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Donor", "Amount", "Campaign", "Date"]],
    body: donationRows,
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 35 },
      2: { cellWidth: 55 },
      3: { cellWidth: 35 },
    },
  });

  // Footer on each page (page numbers)
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Page ${p} of ${totalPages} · PawPop Fundraising Report`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);
  }

  const filename = `fundraising-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
