import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // must import this way

export default function generateInvoicePDF(invoice) {
  // invoice: the appointment/invoice object from your DB
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Pet Clinic Invoice', 14, 22);

  // Clinic info
  doc.setFontSize(10);
  doc.text('Pet Clinic Management System', 14, 30);

  // Owner / Pet Info
  doc.setFontSize(12);
  doc.text(`Owner: ${invoice.ownerId?.name || ''}`, 14, 40);
  doc.text(`Pet: ${invoice.petId?.name || ''} (${invoice.petId?.type || ''})`, 14, 47);
  doc.text(`Date: ${invoice.date || ''}`, 14, 54);
  doc.text(`Time: ${invoice.time || ''}`, 14, 61);

  // Prepare table data dynamically:
  const bodyRows = [];

  // Consultation fee
  if (invoice.consultationFee) {
    bodyRows.push(['Consultation', `$${invoice.consultationFee}`]);
  }

  // Medications
  if (invoice.meds && invoice.meds.length > 0) {
    invoice.meds.forEach(m => {
      bodyRows.push([`Medicine: ${m.name}`, `$${m.price}`]);
    });
  }

  // Procedures
  if (invoice.procedures && invoice.procedures.length > 0) {
    invoice.procedures.forEach(p => {
      bodyRows.push([`Procedure: ${p.name}`, `$${p.price}`]);
    });
  }

  // Subtotal
  if (invoice.totalBeforeDiscount !== undefined) {
    bodyRows.push(['Subtotal', `$${invoice.totalBeforeDiscount}`]);
  }

  // Discount
  if (invoice.discountPercent) {
    bodyRows.push([`Discount (${invoice.discountPercent}%)`, 
      `-$${(invoice.totalBeforeDiscount * invoice.discountPercent / 100).toFixed(2)}`]);
  }

  // After Discount
  if (invoice.totalAfterDiscount !== undefined) {
    bodyRows.push(['After Discount', `$${invoice.totalAfterDiscount}`]);
  }

  // Tax
  if (invoice.taxPercent) {
    bodyRows.push([`Tax (${invoice.taxPercent}%)`, 
      `$${(invoice.totalAfterDiscount * invoice.taxPercent / 100).toFixed(2)}`]);
  }

  // Grand Total
  if (invoice.totalWithTax !== undefined) {
    bodyRows.push(['Total', `$${invoice.totalWithTax}`]);
  }

  // Draw table
  autoTable(doc, {
    startY: 70,
    head: [['Item', 'Amount']],
    body: bodyRows
  });

  // Footer
  const finalY = doc.lastAutoTable.finalY || 100;
  doc.setFontSize(10);
  doc.text('Thank you for visiting our clinic!', 14, finalY + 10);

  // Save PDF
  const fileName = `invoice_${invoice.petId?.name || 'pet'}.pdf`;
  doc.save(fileName);
}
