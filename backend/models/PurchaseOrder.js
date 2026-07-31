const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  quantity: { type: Number, required: true },
  skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true, trim: true },
  poDate: { type: Date },
  vendorName: { type: String, default: '' },
  items: [poItemSchema],
  rawParsed: { type: mongoose.Schema.Types.Mixed }, // untouched Gemini output
  uploadedDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadedDocument' },
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);