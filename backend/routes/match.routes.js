const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { computeMatch } = require('../services/matchEngine.service');

router.use(requireAuth);

router.get('/:poNumber', async (req, res) => {
  try {
    const result = await computeMatch(req.params.poNumber);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;