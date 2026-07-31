const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { computeMatch } = require('../services/matchEngine.service');
const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');

router.use(requireAuth);

router.get('/:poNumber', async (req, res) => {
  try {
    const { poNumber } = req.params;
    const match = await computeMatch(poNumber);

    if (match.status === 'insufficient_documents') {
      return res.json({
        poNumber,
        status: match.status,
        poAmount: 0,
        totalInvoiced: 0,
        totalReceived: 0,
        rows: [],
      });
    }

    // PO Amount: sum(poQty * agreedRate) across items — falls back to 0 if no agreedRate known
    let poAmount = 0;
    let totalInvoicedAmount = 0;
    let totalReceivedQty = 0;
    let totalInvoicedQty = 0;
    let totalPendingQty = 0;

    for (const item of match.items) {
      const rate = item.agreedRate || 0;
      poAmount += item.poQty * rate;
      totalInvoicedAmount += item.invoiceQty * rate;
      totalReceivedQty += item.grnQty;
      totalInvoicedQty += item.invoiceQty;
      totalPendingQty += Math.max(item.poQty - item.grnQty, 0);
    }

    // Build one row per document (GRN or Invoice), each showing cumulative totals up to and including that doc,
    // per the assignment: "one row per document plus a final Current Status row"
    // We approximate "cumulative" using createdAt order across both GRNs and Invoices combined.
    const grnDocs = await Grn.find({ poNumber }).sort({ createdAt: 1 });
    const invoiceDocs = await Invoice.find({ poNumber }).sort({ createdAt: 1 });

    const timeline = [
      ...grnDocs.map(g => ({
        type: 'GRN',
        number: g.grnNumber,
        date: g.grnDate,
        qty: g.items.reduce((sum, i) => sum + (i.receivedQuantity || 0), 0),
        createdAt: g.createdAt,
      })),
      ...invoiceDocs.map(inv => ({
        type: 'Invoice',
        number: inv.invoiceNumber,
        date: inv.invoiceDate,
        qty: inv.items.reduce((sum, i) => sum + (i.quantity || 0), 0),
        createdAt: inv.createdAt,
      })),
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let cumulativeReceived = 0;
    let cumulativeInvoiced = 0;

    const rows = timeline.map(doc => {
      if (doc.type === 'GRN') cumulativeReceived += doc.qty;
      if (doc.type === 'Invoice') cumulativeInvoiced += doc.qty;
      return {
        documentType: doc.type,
        documentNumber: doc.number,
        date: doc.date,
        cumulativeReceivedQty: cumulativeReceived,
        cumulativeInvoicedQty: cumulativeInvoiced,
      };
    });

    // Final "Current Status" row
    rows.push({
      documentType: 'Current Status',
      documentNumber: '',
      date: null,
      cumulativeReceivedQty: totalReceivedQty,
      cumulativeInvoicedQty: totalInvoicedQty,
      pendingDeliveryQty: totalPendingQty,
    });

    res.json({
      poNumber,
      status: match.status,
      poAmount,
      totalInvoiced: totalInvoicedAmount,
      totalReceived: totalReceivedQty,
      rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;