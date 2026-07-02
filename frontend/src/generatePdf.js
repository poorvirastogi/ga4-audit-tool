import jsPDF from "jspdf";

const BAND_COLORS = {
  Healthy: [22, 163, 74],
  "Needs Attention": [217, 119, 6],
  Critical: [220, 38, 38],
};

export function generateAuditPdf(result) {
  const { health_score, band, critical_count, warning_count, passed_count, category_breakdown, issues } = result;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 60;

  const [r, g, b] = BAND_COLORS[band] || [50, 50, 50];

  // Header
  doc.setFillColor(15, 27, 61); // navy
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("GA4 Implementation Audit Report", margin, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, 62);

  y = 130;

  // Score summary
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Overall Health Score", margin, y);

  y += 30;
  doc.setFontSize(36);
  doc.setTextColor(r, g, b);
  doc.text(`${health_score}/100`, margin, y);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(band, margin + 160, y);

  y += 35;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);
  doc.text(
    `Critical: ${critical_count}    Warning: ${warning_count}    Passed: ${passed_count}`,
    margin,
    y
  );

  y += 40;

  // Category breakdown
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Score by Category", margin, y);
  y += 22;

  category_breakdown.forEach((cat) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(31, 41, 55);
    doc.text(cat.category, margin, y);
    doc.text(`${cat.score}%`, pageWidth - margin - 30, y);

    // mini bar
    const barX = margin + 180;
    const barWidth = 200;
    doc.setFillColor(229, 233, 245);
    doc.rect(barX, y - 8, barWidth, 8, "F");
    doc.setFillColor(41, 84, 255);
    doc.rect(barX, y - 8, (barWidth * cat.score) / 100, 8, "F");

    y += 22;
  });

  y += 20;

  // Issues list
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Detailed Findings", margin, y);
  y += 24;

  const statusOrder = { Critical: 0, Warning: 1, Passed: 2 };
  const sortedIssues = [...issues].sort((a, b2) => statusOrder[a.status] - statusOrder[b2.status]);

  sortedIssues.forEach((issue) => {
    if (y > 760) {
      doc.addPage();
      y = 50;
    }

    const [ir, ig, ib] =
      issue.status === "Passed" ? [22, 163, 74] : BAND_COLORS[issue.status] || [100, 100, 100];

    doc.setFillColor(ir, ig, ib);
    doc.circle(margin + 3, y - 4, 3, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55);
    const wrappedText = doc.splitTextToSize(issue.text, pageWidth - margin * 2 - 80);
    doc.text(wrappedText, margin + 14, y);

    doc.setFontSize(9);
    doc.setTextColor(ir, ig, ib);
    doc.text(issue.status, pageWidth - margin - 60, y);

    y += wrappedText.length * 14 + 4;

    if (issue.status !== "Passed") {
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99);
      const fixText = doc.splitTextToSize(`Fix: ${issue.fix}`, pageWidth - margin * 2 - 14);
      doc.text(fixText, margin + 14, y);
      y += fixText.length * 12 + 10;
    } else {
      y += 8;
    }
  });

  doc.save("ga4-audit-report.pdf");
}
