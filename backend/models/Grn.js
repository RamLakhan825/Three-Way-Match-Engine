const mongoose = require('mongoose');

const grnItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  receivedQuantity: { type: Number, required: true },
  mrp: { type: Number, default: 0 },
  skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
}, { _id: false });

const grnSchema = new mongoose.Schema({
  grnNumber: { type: String, required: true, trim: true },
  poNumber: { type: String, required: true, trim: true }, // link key, PO need not exist yet
  grnDate: { type: Date },
  items: [grnItemSchema],
  rawParsed: { type: mongoose.Schema.Types.Mixed },
  uploadedDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadedDocument' },
}, { timestamps: true });

module.exports = mongoose.model('Grn', grnSchema);