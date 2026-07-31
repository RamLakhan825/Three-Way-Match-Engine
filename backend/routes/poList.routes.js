const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');

router.use(requireAuth);

// Returns one row per distinct poNumber, with a rough status hint, for the dashboard list.
router.get('/', async (req, res) => {
  try {
    const [poNumbers, grnNumbers, invoiceNumbers] = await Promise.all([
      PurchaseOrder.distinct('poNumber'),
      Grn.distinct('poNumber'),
      Invoice.distinct('poNumber'),
    ]);

    const allPoNumbers = [...new Set([...poNumbers, ...grnNumbers, ...invoiceNumbers])];

    const rows = await Promise.all(
      allPoNumbers.map(async (poNumber) => {
        const [poCount, grnCount, invoiceCount] = await Promise.all([
          PurchaseOrder.countDocuments({ poNumber }),
          Grn.countDocuments({ poNumber }),
          Invoice.countDocuments({ poNumber }),
        ]);
        return { poNumber, poCount, grnCount, invoiceCount };
      })
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;