import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ── PDF — página a página, margens A4 reais ───────────────────────────────────
export async function exportToPDF(docName: string, editorEl: HTMLElement): Promise<void> {
  // Find parent page container
  const pageEl = (editorEl.closest(".doc-paper") as HTMLElement) ?? editorEl;

  // Temporarily remove transform/zoom so html2canvas renders at 1:1
  const wrapper = editorEl.closest<HTMLElement>('[style*="transform"]');
  const prevTransform = wrapper?.style.transform ?? "";
  if (wrapper) wrapper.style.transform = "none";

  const canvas = await html2canvas(pageEl, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: pageEl.scrollWidth,
    windowHeight: pageEl.scrollHeight,
  });

  if (wrapper) wrapper.style.transform = prevTransform;

  const MM = { w: 210, h: 297 };  // A4
  const MARGIN = 12;               // mm each side
  const printW = MM.w - MARGIN * 2;
  const printH = MM.h - MARGIN * 2;

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // px per mm at canvas scale
  const pxPerMm = (canvas.width / 2) / printW;
  const sliceH_px = Math.round(printH * pxPerMm);  // height in canvas px per A4 page
  let yPx = 0;
  let firstPage = true;

  while (yPx < canvas.height) {
    if (!firstPage) pdf.addPage();
    firstPage = false;

    const actualSliceH = Math.min(sliceH_px, canvas.height - yPx);
    const actualSliceH_mm = actualSliceH / pxPerMm;

    // Crop slice
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = actualSliceH;
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, yPx, canvas.width, actualSliceH, 0, 0, canvas.width, actualSliceH);

    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", MARGIN, MARGIN, printW, actualSliceH_mm);
    yPx += sliceH_px;
  }

  pdf.save(`${docName}.pdf`);
}

// ── DOCX (Word-compatible HTML blob) ─────────────────────────────────────────
export function exportToDocx(docName: string, htmlContent: string): void {
  const blob = new Blob([`\ufeff<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${docName}</title><style>@page{size:A4;margin:2cm}body{font-family:Calibri,sans-serif;font-size:12pt;line-height:1.5}h1{font-size:20pt}h2{font-size:16pt}h3{font-size:14pt}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px 10px}</style></head><body>${htmlContent}</body></html>`], {
    type: "application/msword",
  });
  _download(blob, `${docName}.doc`);
}

// ── TXT ───────────────────────────────────────────────────────────────────────
export function exportToTxt(docName: string, htmlContent: string): void {
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlContent;
  _download(new Blob([tmp.innerText || ""], { type: "text/plain;charset=utf-8" }), `${docName}.txt`);
}

// ── RTF ───────────────────────────────────────────────────────────────────────
export function exportToRtf(docName: string, htmlContent: string): void {
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlContent;
  const plain = (tmp.innerText || "")
    .replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
  const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}{\\f0\\fs24 ${plain.replace(/\n/g, "\\par ")}}}`;
  _download(new Blob([rtf], { type: "application/rtf" }), `${docName}.rtf`);
}

function _download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
