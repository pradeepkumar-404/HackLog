import jsPDF from "jspdf";

export const downloadText = (filename: string, content: string, mime = "text/markdown") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportPDF = (title: string, content: string) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, margin);

  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(content || "(empty)", maxWidth);
  let y = margin + 28;
  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 13;
  }
  doc.save(`${title.replace(/[^a-z0-9-_]+/gi, "_")}.pdf`);
};
