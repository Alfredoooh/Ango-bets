import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ─── PDF EXPORT (real, página a página A4) ────────────────────────────────────
export async function exportToPDF(
  documentName: string,
  editorElement: HTMLElement
): Promise<void> {
  // Temporarily force white background and remove transform/zoom
  const originalStyle = editorElement.style.cssText;
  editorElement.style.transform = "none";
  editorElement.style.background = "#ffffff";

  // Find the actual page element (794px wide white div)
  const pageEl =
    (editorElement.closest(".doc-page") as HTMLElement) ||
    (editorElement.parentElement?.querySelector(".doc-page") as HTMLElement) ||
    editorElement;

  const canvas = await html2canvas(pageEl, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: pageEl.scrollWidth,
    height: pageEl.scrollHeight,
    windowWidth: pageEl.scrollWidth,
    windowHeight: pageEl.scrollHeight,
  });

  editorElement.style.cssText = originalStyle;

  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const MARGIN_MM = 15;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const printableWidth = A4_WIDTH_MM - MARGIN_MM * 2;
  const printableHeight = A4_HEIGHT_MM - MARGIN_MM * 2;

  // Convert canvas to image
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const imgWidthPx = canvas.width;
  const imgHeightPx = canvas.height;

  // Scale: fit to printable width
  const scaleRatio = printableWidth / ((imgWidthPx / 2) * (A4_WIDTH_MM / 210));
  // Simpler: mm per px
  const pxPerMm = imgWidthPx / 2 / printableWidth; // canvas is @2x
  const totalHeightMm = imgHeightPx / 2 / pxPerMm;

  let yOffset = 0; // pixels from top of canvas already printed
  let isFirstPage = true;

  while (yOffset < imgHeightPx / 2) {
    if (!isFirstPage) pdf.addPage();
    isFirstPage = false;

    // Slice height in px (at 1x)
    const sliceHeightPx = printableHeight * pxPerMm; // height in source px
    const actualSliceHeightPx = Math.min(
      sliceHeightPx,
      imgHeightPx / 2 - yOffset
    );
    const actualSliceHeightMm = actualSliceHeightPx / pxPerMm;

    // Create a sub-canvas for this slice
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = imgWidthPx;
    sliceCanvas.height = Math.round(actualSliceHeightPx * 2); // back to @2x
    const ctx = sliceCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      Math.round(yOffset * 2), // source y (@2x)
      imgWidthPx,
      Math.round(actualSliceHeightPx * 2), // source h (@2x)
      0,
      0,
      imgWidthPx,
      Math.round(actualSliceHeightPx * 2)
    );

    const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(
      sliceData,
      "JPEG",
      MARGIN_MM,
      MARGIN_MM,
      printableWidth,
      actualSliceHeightMm
    );

    yOffset += sliceHeightPx;
  }

  pdf.save(`${documentName}.pdf`);
}

// ─── DOCX EXPORT (via HTML → blob) ───────────────────────────────────────────
export function exportToDocx(
  documentName: string,
  htmlContent: string
): void {
  // Build a minimal Word-compatible HTML document
  const docHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${documentName}</title>
  <!--[if gte mso 9]>
  <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
  <![endif]-->
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: Calibri, sans-serif; font-size: 12pt; line-height: 1.5; }
    h1 { font-size: 20pt; } h2 { font-size: 16pt; } h3 { font-size: 14pt; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #999; padding: 6px 10px; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`;

  const blob = new Blob(["\ufeff", docHtml], {
    type: "application/msword",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${documentName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── TXT EXPORT ───────────────────────────────────────────────────────────────
export function exportToTxt(documentName: string, htmlContent: string): void {
  // Strip HTML tags
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlContent;
  const text = tmp.innerText || tmp.textContent || "";

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${documentName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── RTF EXPORT (basic) ──────────────────────────────────────────────────────
export function exportToRtf(documentName: string, htmlContent: string): void {
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlContent;
  const plainText = (tmp.innerText || "")
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");

  const rtf = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Calibri;}}
{\\f0\\fs24 ${plainText.replace(/\n/g, "\\par ")}}
}`;

  const blob = new Blob([rtf], { type: "application/rtf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${documentName}.rtf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function calculatePages(
  contentLength: number,
  charsPerPage: number = 1800
): number {
  return Math.max(1, Math.ceil(contentLength / charsPerPage));
}
