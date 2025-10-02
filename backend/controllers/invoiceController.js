const Invoice = require('../models/InvoiceModel');

exports.getAllInvoices = async (req, res) => {
  const invoices = await Invoice.find().populate('ownerId petId appointmentId');
  res.json(invoices);
};
