// frontend/src/utils/generateInvoicePDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * สร้าง PDF ใบกำกับจากอ็อบเจ็กต์นัดหมาย (ต้องมี billing.{subtotal,taxRate,tax,discount,total})
 * หัวเอกสาร: "Pet Clinic  Invoice"
 */
export default function generateInvoicePDF(appt) {
  const doc = new jsPDF();

  // ===== Header =====
  doc.setFontSize(18);
  doc.text("Pet Clinic  Invoice", 14, 16); // ตามที่ขอให้ขึ้นหัวใบ

  // ===== ข้อมูลลูกค้า/รายการ =====
  const ownerName = appt?.ownerId?.name ?? appt?.owner?.name ?? "-";
  const ownerPhone = appt?.ownerId?.phone ?? appt?.owner?.phone ?? "-";
  const petName = appt?.petId?.name ?? appt?.pet?.name ?? "-";
  const date = appt?.date ?? "-";
  const time = appt?.time ?? "-";
  const status = appt?.status ?? "-";

  // ===== ยอดเงินที่คำนวณจาก FE =====
  const subtotal =
    appt?.billing?.subtotal ??
    appt?.amount ??
    appt?.total ??
    appt?.price ??
    0;
  const taxRate = appt?.billing?.taxRate ?? 0;
  const tax = appt?.billing?.tax ?? +(subtotal * taxRate).toFixed(2);
  const discount = appt?.billing?.discount ?? 0;
  const grand = appt?.billing?.total ?? +(subtotal + tax - discount).toFixed(2);

  doc.setFontSize(11);
  doc.text(`Owner: ${ownerName}`, 14, 26);
  doc.text(`Phone: ${ownerPhone}`, 14, 32);
  doc.text(`Pet: ${petName}`, 14, 38);
  doc.text(`Date: ${date} ${time ? ` ${time}` : ""}`, 14, 44);
  doc.text(`Status: ${status}`, 14, 50);

  // ===== ตารางรายการ (อย่างง่าย 1 แถว) =====
  autoTable(doc, {
    startY: 58,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: [
      ["Clinic Service", "1", subtotal.toFixed(2), subtotal.toFixed(2)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [99, 102, 241] }, // indigo-ish
    theme: "grid",
  });

  // ===== ตารางสรุปยอด =====
  const y = (doc.lastAutoTable?.finalY ?? 58) + 6;
  autoTable(doc, {
    startY: y,
    head: [["Label", "Amount"]],
    body: [
      ["Subtotal", subtotal.toFixed(2)],
      [`Tax (${(taxRate * 100).toFixed(0)}%)`, tax.toFixed(2)],
      ["Discount", `-${discount.toFixed(2)}`],
      ["Total", grand.toFixed(2)],
    ],
    styles: { fontSize: 11 },
    headStyles: { fillColor: [226, 232, 240], textColor: [17, 24, 39] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40, halign: "right" },
    },
    theme: "plain",
  });

  // ===== บันทึกไฟล์ =====
  const filename = `invoice_${(ownerName || "owner")
    .toString()
    .replace(/\s+/g, "_")}_${date || "date"}.pdf`;
  doc.save(filename);
}
