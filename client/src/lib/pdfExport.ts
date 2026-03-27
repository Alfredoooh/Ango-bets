import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// A4 dimensions in mm
const A4_W = 210;
const A4_H = 297;
const MARGIN = 20; // mm

/**
 * Export the document to PDF.
 * Renders each .doc-page element separately to avoid scale/transform issues.
 */
export async function exportToPDF(
  documentName: string,
  _ignored?: HTMLElement
): Promise<void> {
  const pages = Array.from(document.querySelectorAll(".doc-page")) as HTMLElement[];
  if (!pages.length) throw new Error("Nenhuma página encontrada");

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const printW = A4_W - MARGIN * 2;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    // Snapshot at native size (no transform)
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      // Ignore any CSS transform on parent
      ignoreElements: (el) => el.classList.contains("zoom-wrapper"),
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const ratio = canvas.height / canvas.width;
    const imgH = printW * ratio;

    if (i > 0) pdf.addPage();

    // If content fits in one A4 page height
    const maxH = A4_H - MARGIN * 2;
    if (imgH <= maxH) {
      pdf.addImage(imgData, "JPEG", MARGIN, MARGIN, printW, imgH);
    } else {
      // Slice into A4 pages
      const sliceRatio = maxH / imgH;
      let srcY = 0;
      let isFirst = true;
      while (srcY < canvas.height) {
        const sliceH = Math.min(canvas.height * sliceRatio, canvas.height - srcY);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.ceil(sliceH);
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
        const sliceImgH = (sliceH / canvas.height) * imgH;
        if (!isFirst) pdf.addPage();
        pdf.addImage(sliceData, "JPEG", MARGIN, MARGIN, printW, sliceImgH);
        srcY += sliceH;
        isFirst = false;
      }
    }
  }

  pdf.save(`${documentName}.pdf`);
}

/** Export as Word-compatible HTML */
export function exportToDocx(documentName: string, htmlContent: string): void {
  const doc = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${documentName}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>@page{size:A4;margin:2cm} body{font-family:Calibri,sans-serif;font-size:12pt;line-height:1.5} h1{font-size:20pt} h2{font-size:16pt} h3{font-size:14pt} table{border-collapse:collapse;width:100%} td,th{border:1px solid #999;padding:6px 10px}</style>
</head><body>${htmlContent}</body></html>`;
  download(new Blob(["\ufeff", doc], { type: "application/msword" }), `${documentName}.doc`);
}

/** Export as plain text */
export function exportToTxt(documentName: string, htmlContent: string): void {
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlContent;
  download(new Blob([tmp.innerText || ""], { type: "text/plain;charset=utf-8" }), `${documentName}.txt`);
}

/** Export as RTF */
export function exportToRtf(documentName: string, htmlContent: string): void {
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlContent;
  const text = (tmp.innerText || "").replace(/\\/g, "\\\\").replace(/[{}]/g, (c) => `\\${c}`);
  const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}{\\f0\\fs24 ${text.replace(/\n/g, "\\par ")}}}`;
  download(new Blob([rtf], { type: "application/rtf" }), `${documentName}.rtf`);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function calculatePages(contentLength: number): number {
  return Math.max(1, Math.ceil(contentLength / 1800));
}
