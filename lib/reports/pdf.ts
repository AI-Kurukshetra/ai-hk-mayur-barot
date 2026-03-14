import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type ReportItem = {
  test_name: string;
  value_text: string | null;
  value_numeric: number | null;
  unit: string | null;
  flag: string | null;
};

type ReportPdfInput = {
  lab_name: string;
  lab_phone: string;
  lab_email: string;
  order_no: string;
  patient_code: string;
  patient_name: string;
  patient_age: string;
  patient_sex: string;
  referring_doctor: string;
  patient_address: string;
  registered_at_iso: string;
  collected_at_iso: string;
  released_at_iso: string;
  generated_at_iso: string;
  items: ReportItem[];
};

function drawCellText(
  page: import("pdf-lib").PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: import("pdf-lib").PDFFont,
  color = rgb(0.12, 0.16, 0.22)
) {
  page.drawText(text, { x, y, size, font, color });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
}

export async function buildReportPdf(input: ReportPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const { width, height } = page.getSize();

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: height - 108, width, height: 108, color: rgb(0.24, 0.39, 0.72) });
  drawCellText(page, input.lab_name, 28, height - 38, 18, fontBold, rgb(1, 1, 1));
  drawCellText(page, "Sample Report", 28, height - 60, 12, fontBold, rgb(0.9, 0.95, 1));
  drawCellText(page, input.lab_phone, 350, height - 38, 10, font, rgb(0.95, 0.97, 1));
  drawCellText(page, input.lab_email, 350, height - 53, 10, font, rgb(0.95, 0.97, 1));
  drawCellText(page, `Generated: ${formatDateTime(input.generated_at_iso)}`, 350, height - 68, 9, font, rgb(0.9, 0.95, 1));
  page.drawRectangle({ x: 492, y: height - 94, width: 78, height: 64, color: rgb(1, 1, 1) });
  drawCellText(page, "QR", 525, height - 62, 14, fontBold, rgb(0.24, 0.39, 0.72));

  page.drawRectangle({ x: 24, y: height - 208, width: width - 48, height: 84, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 24, y: height - 208, width: width - 48, height: 84, borderColor: rgb(0.8, 0.84, 0.91), borderWidth: 1 });
  page.drawLine({ start: { x: 310, y: height - 124 }, end: { x: 310, y: height - 208 }, thickness: 1, color: rgb(0.88, 0.9, 0.95) });

  const topY = height - 144;
  drawCellText(page, input.patient_name, 32, topY, 12, fontBold);
  drawCellText(page, `Age / Sex: ${input.patient_age} / ${input.patient_sex}`, 32, topY - 16, 10, font);
  drawCellText(page, `Doctor: ${input.referring_doctor}`, 32, topY - 30, 10, font);
  drawCellText(page, `Reg. No: ${input.patient_code}`, 32, topY - 44, 10, font);
  drawCellText(page, `Address: ${input.patient_address}`, 32, topY - 58, 10, font);

  drawCellText(page, `Order: ${input.order_no}`, 320, topY, 10, fontBold);
  drawCellText(page, `Registered: ${formatDateTime(input.registered_at_iso)}`, 320, topY - 16, 9, font);
  drawCellText(page, `Collected: ${formatDateTime(input.collected_at_iso)}`, 320, topY - 30, 9, font);
  drawCellText(page, `Released: ${formatDateTime(input.released_at_iso)}`, 320, topY - 44, 9, font);

  let y = height - 238;
  page.drawRectangle({ x: 24, y, width: width - 48, height: 24, color: rgb(0.93, 0.95, 0.99) });
  page.drawRectangle({ x: 24, y, width: width - 48, height: 24, borderColor: rgb(0.8, 0.84, 0.91), borderWidth: 1 });
  drawCellText(page, "TEST", 32, y + 8, 10, fontBold);
  drawCellText(page, "VALUE", 280, y + 8, 10, fontBold);
  drawCellText(page, "UNIT", 370, y + 8, 10, fontBold);
  drawCellText(page, "REFERENCE", 444, y + 8, 10, fontBold);

  y -= 1;

  for (const item of input.items) {
    if (y < 132) break;

    const value = item.value_numeric != null ? String(item.value_numeric) : item.value_text ?? "-";
    const flag = item.flag ?? "normal";
    const rowColor = flag === "critical" ? rgb(0.78, 0.11, 0.15) : flag === "high" || flag === "low" ? rgb(0.66, 0.26, 0.04) : rgb(0.13, 0.19, 0.3);

    page.drawRectangle({ x: 24, y: y - 22, width: width - 48, height: 22, borderColor: rgb(0.88, 0.91, 0.96), borderWidth: 1, color: rgb(1, 1, 1) });
    drawCellText(page, item.test_name.slice(0, 36), 32, y - 14, 9, font, rgb(0.13, 0.19, 0.30));
    drawCellText(page, value.slice(0, 12), 280, y - 14, 9, fontBold, rowColor);
    drawCellText(page, (item.unit ?? "-").slice(0, 10), 370, y - 14, 9, font);
    drawCellText(page, flag === "normal" ? "-" : flag.toUpperCase(), 444, y - 14, 9, fontBold, rowColor);
    y -= 22;
  }

  y -= 10;
  page.drawRectangle({ x: 24, y: y - 62, width: width - 48, height: 62, borderColor: rgb(0.8, 0.84, 0.91), borderWidth: 1, color: rgb(0.99, 0.99, 1) });
  drawCellText(page, "Clinical Notes:", 32, y - 16, 10, fontBold);
  drawCellText(
    page,
    "This is a computer-generated pathology report. Please correlate with clinical findings where required.",
    32,
    y - 31,
    9,
    font,
    rgb(0.28, 0.33, 0.4)
  );
  drawCellText(page, "Flags indicate potential abnormal values requiring review.", 32, y - 45, 9, font, rgb(0.28, 0.33, 0.4));

  page.drawLine({ start: { x: 24, y: 86 }, end: { x: width - 24, y: 86 }, thickness: 1, color: rgb(0.8, 0.84, 0.91) });
  drawCellText(page, "Lab Incharge", 32, 66, 10, fontBold, rgb(0.2, 0.25, 0.34));
  drawCellText(page, "Pathologist", width - 120, 66, 10, fontBold, rgb(0.2, 0.25, 0.34));
  drawCellText(page, "Not valid for medico legal purpose.", width / 2 - 98, 40, 8, fontBold, rgb(0.35, 0.4, 0.5));

  page.drawRectangle({ x: 0, y: 0, width, height: 22, color: rgb(0.24, 0.39, 0.72) });
  drawCellText(page, "Generated by PathologyLab Pro", width / 2 - 68, 7, 8, font, rgb(1, 1, 1));

  return pdf.save();
}
