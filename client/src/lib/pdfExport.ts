import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportToPDF(
  documentName: string,
  editorElement: HTMLElement
) {
  try {
    // Get the document content
    const canvas = await html2canvas(editorElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate dimensions to fit A4
    const imgWidth = pageWidth - 20; // 10mm margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10; // Top margin

    // Add image to PDF, creating new pages if needed
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    // Save the PDF
    pdf.save(`${documentName}.pdf`);
    return true;
  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    throw error;
  }
}

export function calculatePages(
  contentLength: number,
  charsPerPage: number = 300
): number {
  return Math.ceil(contentLength / charsPerPage);
}
