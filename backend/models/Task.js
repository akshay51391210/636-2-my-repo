// Minimal Task model for teacher's tests (keeps teacher's schema)
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    // required by teacher's tests
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    completed: { type: Boolean, default: false },
    deadline: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
