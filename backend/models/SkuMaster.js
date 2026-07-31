const mongoose = require('mongoose');

const skuMasterSchema = new mongoose.Schema({
  skuErpCode: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  eanCode: { type: String, trim: true, default: '' },
  hsnCode: { type: String, trim: true, default: '' },
  uom: { type: String, trim: true, default: '' },
  agreedRate: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  priceTolerance: { type: Number, default: 0.05 }, // 5% default
}, { timestamps: true });

module.exports = mongoose.model('SkuMaster', skuMasterSchema);