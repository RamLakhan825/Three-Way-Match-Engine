// backend/services/matchEngine.service.js
const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const { resolveSkuMaster } = require('./masterResolution.service');

const HARD_VIOLATIONS = [
  'grn_qty_exceeds_po_qty',
  'invoice_qty_exceeds_grn_qty',
  'invoice_qty_exceeds_po_qty',
  'invoice_date_after_po_date',
  'duplicate_po',
  'duplicate_document',
  'item_missing_in_po',
];

const SOFT_WARNINGS = ['price_mismatch', 'mrp_mismatch', 'unmapped_master_sku'];

// Re-resolves live against current SkuMaster data, even if the stored item.skuMaster is null.
// This is what lets a match recompute correctly if a SKU Master is created AFTER the document was uploaded.
async function resolveLiveMaster(item) {
  if (item.skuMaster) return item.skuMaster; // already populated (Mongoose populate gives the full doc)
  return await resolveSkuMaster(item.itemCode); // try fresh lookup, in case a master was added later
}

function buildKey(master, itemCode) {
  if (master) return `sku:${master._id.toString()}`;
  return `raw:${String(itemCode).trim().toLowerCase()}`;
}

async function computeMatch(poNumber) {
  const pos = await PurchaseOrder.find({ poNumber }).sort({ createdAt: 1 }).populate('items.skuMaster');
  const grns = await Grn.find({ poNumber }).sort({ createdAt: 1 }).populate('items.skuMaster');
  const invoices = await Invoice.find({ poNumber }).sort({ createdAt: 1 }).populate('items.skuMaster');

  // Missing any document TYPE entirely => insufficient_documents (per assignment: missing types are not treated as zero)
  if (pos.length === 0 || grns.length === 0 || invoices.length === 0) {
    return {
      poNumber,
      status: 'insufficient_documents',
      reasons: [],
      documents: {
        po: pos.map(p => ({ _id: p._id, poDate: p.poDate, vendorName: p.vendorName, uploadedDocumentId: p.uploadedDocumentId })),
        grns: grns.map(g => ({ _id: g._id, grnNumber: g.grnNumber, grnDate: g.grnDate, uploadedDocumentId: g.uploadedDocumentId })),
        invoices: invoices.map(i => ({ _id: i._id, invoiceNumber: i.invoiceNumber, invoiceDate: i.invoiceDate, uploadedDocumentId: i.uploadedDocumentId })),
      },
      items: [],
    };
  }

  const reasons = new Set();

  // Canonical PO = earliest uploaded one. Duplicates beyond that are flagged, not ignored.
  const canonicalPo = pos[0];
  if (pos.length > 1) reasons.add('duplicate_po');

  const grnNumberCounts = {};
  grns.forEach(g => { grnNumberCounts[g.grnNumber] = (grnNumberCounts[g.grnNumber] || 0) + 1; });
  if (Object.values(grnNumberCounts).some(c => c > 1)) reasons.add('duplicate_document');

  const invoiceNumberCounts = {};
  invoices.forEach(i => { invoiceNumberCounts[i.invoiceNumber] = (invoiceNumberCounts[i.invoiceNumber] || 0) + 1; });
  if (Object.values(invoiceNumberCounts).some(c => c > 1)) reasons.add('duplicate_document');

  const poDate = canonicalPo.poDate ? new Date(canonicalPo.poDate) : null;
  if (poDate && invoices.some(inv => inv.invoiceDate && new Date(inv.invoiceDate) > poDate)) {
    reasons.add('invoice_date_after_po_date');
  }

  const itemMap = new Map();

  function ensureEntry(key, itemCode, description, master) {
    if (!itemMap.has(key)) {
      itemMap.set(key, {
        key,
        itemCode,
        description: description || '',
        skuMasterId: master ? master._id.toString() : null,
        skuMasterName: master ? master.name : null,
        agreedRate: master && typeof master.agreedRate === 'number' ? master.agreedRate : null,
        masterMrp: master && typeof master.mrp === 'number' ? master.mrp : null,
        eanCode: master ? master.eanCode : null,
        hsnCode: master ? master.hsnCode : null,
        uom: master ? master.uom : null,
        priceTolerance: master && typeof master.priceTolerance === 'number' ? master.priceTolerance : 0.05,
        poQty: 0,
        grnQty: 0,
        invoiceQty: 0,
        invoiceUnitRates: [],
        grnMrps: [],
        invoiceMrps: [],
        onPo: false,
        reasons: new Set(),
      });
    }
    return itemMap.get(key);
  }

  // --- PO items (canonical PO only) ---
  for (const item of canonicalPo.items) {
    const master = await resolveLiveMaster(item);
    const key = buildKey(master, item.itemCode);
    const entry = ensureEntry(key, item.itemCode, item.description, master);
    entry.poQty += item.quantity || 0;
    entry.onPo = true;
    if (!master) entry.reasons.add('unmapped_master_sku');
  }

  // --- GRN items (aggregate across ALL stored GRNs) ---
  for (const grn of grns) {
    for (const item of grn.items) {
      const master = await resolveLiveMaster(item);
      const key = buildKey(master, item.itemCode);
      const entry = ensureEntry(key, item.itemCode, item.description, master);
      entry.grnQty += item.receivedQuantity || 0;
      if (typeof item.mrp === 'number' && item.mrp > 0) entry.grnMrps.push(item.mrp);
      if (!master) entry.reasons.add('unmapped_master_sku');
    }
  }

  // --- Invoice items (aggregate across ALL stored Invoices) ---
  for (const inv of invoices) {
    for (const item of inv.items) {
      const master = await resolveLiveMaster(item);
      const key = buildKey(master, item.itemCode);
      const entry = ensureEntry(key, item.itemCode, item.description, master);
      entry.invoiceQty += item.quantity || 0;
      if (typeof item.unitRate === 'number' && item.unitRate > 0) entry.invoiceUnitRates.push(item.unitRate);
      if (typeof item.mrp === 'number' && item.mrp > 0) entry.invoiceMrps.push(item.mrp);
      if (!master) entry.reasons.add('unmapped_master_sku');
    }
  }

  // --- Per-item rule evaluation ---
  for (const entry of itemMap.values()) {
    if (!entry.onPo && (entry.grnQty > 0 || entry.invoiceQty > 0)) {
      entry.reasons.add('item_missing_in_po');
    }
    if (entry.onPo && entry.grnQty > entry.poQty) {
      entry.reasons.add('grn_qty_exceeds_po_qty');
    }
    if (entry.invoiceQty > entry.grnQty) {
      entry.reasons.add('invoice_qty_exceeds_grn_qty');
    }
    if (entry.onPo && entry.invoiceQty > entry.poQty) {
      entry.reasons.add('invoice_qty_exceeds_po_qty');
    }

    // price_mismatch — guard against missing/zero agreedRate (no divide-by-zero)
    if (entry.agreedRate && entry.agreedRate > 0 && entry.invoiceUnitRates.length > 0) {
      const tolerance = entry.priceTolerance || 0.05;
      const mismatch = entry.invoiceUnitRates.some(
        rate => Math.abs(rate - entry.agreedRate) / entry.agreedRate > tolerance
      );
      if (mismatch) entry.reasons.add('price_mismatch');
    }

    // mrp_mismatch (~1%) — guard against missing/zero master MRP
    if (entry.masterMrp && entry.masterMrp > 0) {
      const allMrps = [...entry.grnMrps, ...entry.invoiceMrps];
      const mismatch = allMrps.some(mrp => Math.abs(mrp - entry.masterMrp) / entry.masterMrp > 0.01);
      if (mismatch) entry.reasons.add('mrp_mismatch');
    }

    entry.reasons.forEach(r => reasons.add(r));
  }

  // --- Overall status ---
  let status;
  if (HARD_VIOLATIONS.some(r => reasons.has(r))) {
    status = 'mismatch';
  } else {
    const fullyReconciled = [...itemMap.values()].every(
      e => e.poQty === e.grnQty && e.grnQty === e.invoiceQty
    );
    const hasSoftWarnings = SOFT_WARNINGS.some(r => reasons.has(r));
    status = fullyReconciled && !hasSoftWarnings ? 'matched' : 'partially_matched';
  }

  const items = [...itemMap.values()].map(e => ({
    itemCode: e.itemCode,
    description: e.description,
    skuMasterId: e.skuMasterId,
    skuMasterName: e.skuMasterName,
    eanCode: e.eanCode,
    hsnCode: e.hsnCode,
    uom: e.uom,
    poQty: e.poQty,
    grnQty: e.grnQty,
    invoiceQty: e.invoiceQty,
    agreedRate: e.agreedRate,
    invoiceUnitRates: e.invoiceUnitRates,
    masterMrp: e.masterMrp,
    grnMrps: e.grnMrps,
    invoiceMrps: e.invoiceMrps,
    reasons: [...e.reasons],
  }));

  return {
    poNumber,
    status,
    reasons: [...reasons],
    documents: {
      po: pos.map(p => ({ _id: p._id, poDate: p.poDate, vendorName: p.vendorName, createdAt: p.createdAt, uploadedDocumentId: p.uploadedDocumentId })),
      grns: grns.map(g => ({ _id: g._id, grnNumber: g.grnNumber, grnDate: g.grnDate, createdAt: g.createdAt, uploadedDocumentId: g.uploadedDocumentId })),
      invoices: invoices.map(i => ({ _id: i._id, invoiceNumber: i.invoiceNumber, invoiceDate: i.invoiceDate, createdAt: i.createdA, uploadedDocumentId: i.uploadedDocumentId })),
    },
    items,
  };
}

module.exports = { computeMatch };