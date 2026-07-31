const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  quantity: { type: Number, required: true },
  unitRate: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, trim: true },
  poNumber: { type: String, required: true, trim: true },
  invoiceDate: { type: Date },
  items: [invoiceItemSchema],
  rawParsed: { type: mongoose.Schema.Types.Mixed },
  uploadedDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadedDocument' },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);