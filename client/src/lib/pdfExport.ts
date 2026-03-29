import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// A4 dimensions in mm
const A4_W = 210;
const A4_H = 297;
const MARGIN = 20; // mm

/**
 * Captura um elemento HTML e adiciona ao PDF, fatiando em páginas A4 se necessário.
 */
async function captureElementToPDF(
  pdf: jsPDF,
  el: HTMLElement,
  isFirstPage: boolean
): Promise<void> {
  const printW = A4_W - MARGIN * 2;
  const maxH   = A4_H - MARGIN * 2;

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    ignoreElements: (e) => e.classList.contains("zoom-wrapper"),
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const ratio   = canvas.height / canvas.width;
  const imgH    = printW * ratio;

  if (!isFirstPage) pdf.addPage();

  if (imgH <= maxH) {
    pdf.addImage(imgData, "JPEG", MARGIN, MARGIN, printW, imgH);
  } else {
    // Fatia em múltiplas páginas A4
    const sliceRatio = maxH / imgH;
    let srcY    = 0;
    let isFirst = true;
    while (srcY < canvas.height) {
      const sliceH      = Math.min(canvas.height * sliceRatio, canvas.height - srcY);
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width  = canvas.width;
      sliceCanvas.height = Math.ceil(sliceH);
      const ctx = sliceCanvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      const sliceData  = sliceCanvas.toDataURL("image/jpeg", 0.92);
      const sliceImgH  = (sliceH / canvas.height) * imgH;
      if (!isFirst) pdf.addPage();
      pdf.addImage(sliceData, "JPEG", MARGIN, MARGIN, printW, sliceImgH);
      srcY   += sliceH;
      isFirst = false;
    }
  }
}

/**
 * Exporta o documento para PDF.
 * Tenta capturar elementos .doc-page; se não existirem, captura o editor contenteditable.
 */
export async function exportToPDF(
  documentName: string,
  _ignored?: HTMLElement
): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Tentativa 1 — elementos .doc-page
  const pages = Array.from(
    document.querySelectorAll(".doc-page")
  ) as HTMLElement[];

  if (pages.length > 0) {
    for (let i = 0; i < pages.length; i++) {
      await captureElementToPDF(pdf, pages[i], i === 0);
    }
    pdf.save(`${documentName}.pdf`);
    return;
  }

  // Tentativa 2 — editor contenteditable (sempre presente)
  const editor =
    (document.querySelector("[contenteditable='true']") as HTMLElement | null) ??
    (document.querySelector("[contenteditable]")        as HTMLElement | null);

  if (editor) {
    // Guarda estilos originais e expande para captura completa sem scroll
    const prev = {
      overflow:  editor.style.overflow,
      maxHeight: editor.style.maxHeight,
      height:    editor.style.height,
    };
    editor.style.overflow  = "visible";
    editor.style.maxHeight = "none";
    editor.style.height    = "auto";

    await captureElementToPDF(pdf, editor, true);

    // Restaura estilos
    editor.style.overflow  = prev.overflow;
    editor.style.maxHeight = prev.maxHeight;
    editor.style.height    = prev.height;

    pdf.save(`${documentName}.pdf`);
    return;
  }

  // Tentativa 3 — corpo inteiro
  await captureElementToPDF(pdf, document.body, true);
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
