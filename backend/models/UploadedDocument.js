const mongoose = require('mongoose');

const uploadedDocumentSchema = new mongoose.Schema({
  documentType: { type: String, enum: ['po', 'grn', 'invoice'], required: true },
  originalFileName: { type: String, required: true },
  storedFileName: { type: String, required: true }, // name on disk
  filePath: { type: String, required: true },
  mimeType: { type: String },
  status: { type: String, enum: ['uploaded', 'parsed', 'failed'], default: 'uploaded' },
  parseError: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('UploadedDocument', uploadedDocumentSchema);