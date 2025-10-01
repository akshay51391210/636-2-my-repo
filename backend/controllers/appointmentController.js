const Appointment = require('../models/AppointmentModel');
const Invoice = require('../models/InvoiceModel');

// GET /appointments
const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('ownerId', 'name phone')
      .populate('petId', 'name type');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
};

// PATCH /appointments/:id/complete
const markAsCompleted = async (req, res) => {
  const { id } = req.params;

  try {
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    appt.status = 'completed';
    await appt.save();

    const existing = await Invoice.findOne({ appointmentId: id });
    if (existing) return res.status(200).json({ message: 'Already invoiced' });

    const invoice = new Invoice({
      appointmentId: appt._id,
      ownerId: appt.ownerId,
      petId: appt.petId,
      date: appt.date,
      consultationFee: 50,
      meds: [
        { name: 'Painkiller', price: 20 },
        { name: 'Antibiotic', price: 30 }
      ],
      procedures: [
        { name: 'X-ray', price: 80 }
      ],
      discountPercent: 10,
      taxPercent: 10
    });

    const medTotal = invoice.meds.reduce((sum, m) => sum + m.price, 0);
    const procTotal = invoice.procedures.reduce((sum, p) => sum + p.price, 0);
    invoice.totalBeforeDiscount = invoice.consultationFee + medTotal + procTotal;

    const afterDiscount = invoice.totalBeforeDiscount * (1 - invoice.discountPercent / 100);
    invoice.totalAfterDiscount = parseFloat(afterDiscount.toFixed(2));

    const withTax = invoice.totalAfterDiscount * (1 + invoice.taxPercent / 100);
    invoice.totalWithTax = parseFloat(withTax.toFixed(2));

    await invoice.save();

    res.json({ message: 'Appointment marked as completed and invoice created.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error completing appointment' });
  }
};

module.exports = {
  getAppointments,
  getAppointmentSummary,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  partialUpdateAppointment,
  cancelAppointment,
  markAsCompleted,
  deleteAppointment
};
