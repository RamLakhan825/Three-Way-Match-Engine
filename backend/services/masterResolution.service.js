const SkuMaster = require('../models/SkuMaster');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Look up by skuErpCode first, then eanCode. Case-insensitive, trimmed.
async function resolveSkuMaster(itemCode) {
  if (!itemCode) return null;
  const normalized = String(itemCode).trim();
  if (!normalized) return null;

  const exactMatch = new RegExp(`^${escapeRegex(normalized)}$`, 'i');

  let sku = await SkuMaster.findOne({ skuErpCode: exactMatch });
  if (sku) return sku;

  sku = await SkuMaster.findOne({ eanCode: exactMatch });
  return sku || null;
}

// Mutates each item in the array, setting item.skuMaster to the matched _id or null
async function resolveItemsSkuMaster(items) {
  for (const item of items) {
    const sku = await resolveSkuMaster(item.itemCode);
    item.skuMaster = sku ? sku._id : null;
  }
}

module.exports = { resolveSkuMaster, resolveItemsSkuMaster };