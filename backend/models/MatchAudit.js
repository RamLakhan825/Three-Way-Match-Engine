const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  step: { type: String, required: true },       // e.g. 'upload', 'duplicate_check'
  status: { type: String, required: true },      // e.g. 'ok', 'warning', 'error'
  message: { type: String, default: '' },
  at: { type: Date, default: Date.now },
}, { _id: false });

const matchAuditSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, trim: true },
  steps: [stepSchema],
}, { timestamps: true });

module.exports = mongoose.model('MatchAudit', matchAuditSchema);