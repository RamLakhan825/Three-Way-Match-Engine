const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const MatchAudit = require('../models/MatchAudit');

async function logStep(poNumber, step, status, message) {
  await MatchAudit.findOneAndUpdate(
    { poNumber },
    { $push: { steps: { step, status, message, at: new Date() } } },
    { upsert: true }
  );
}

// Returns { isDuplicate: boolean, reason: string|null }
async function checkDuplicate(documentType, record) {
  if (documentType === 'po') {
    const existing = await PurchaseOrder.findOne({ poNumber: record.poNumber });
    if (existing) {
      await logStep(record.poNumber, 'duplicate_check', 'warning',
        `duplicate_po: another PO already exists for poNumber ${record.poNumber}`);
      return { isDuplicate: true, reason: 'duplicate_po' };
    }
  }

  if (documentType === 'grn') {
    const existing = await Grn.findOne({ poNumber: record.poNumber, grnNumber: record.grnNumber });
    if (existing) {
      await logStep(record.poNumber, 'duplicate_check', 'warning',
        `duplicate_document: GRN ${record.grnNumber} already exists for poNumber ${record.poNumber}`);
      return { isDuplicate: true, reason: 'duplicate_document' };
    }
  }

  if (documentType === 'invoice') {
    const existing = await Invoice.findOne({ poNumber: record.poNumber, invoiceNumber: record.invoiceNumber });
    if (existing) {
      await logStep(record.poNumber, 'duplicate_check', 'warning',
        `duplicate_document: Invoice ${record.invoiceNumber} already exists for poNumber ${record.poNumber}`);
      return { isDuplicate: true, reason: 'duplicate_document' };
    }
  }

  await logStep(record.poNumber, 'duplicate_check', 'ok', 'No duplicate found');
  return { isDuplicate: false, reason: null };
}

module.exports = { checkDuplicate, logStep };