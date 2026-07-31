const express = require('express');
const router = express.Router();
const SkuMaster = require('../models/SkuMaster');
const { requireAuth } = require('../middleware/auth');

// all routes below require a valid token
router.use(requireAuth);

// CREATE
router.post('/', async (req, res) => {
  try {
    const sku = await SkuMaster.create(req.body);
    res.status(201).json(sku);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'skuErpCode already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

// LIST (with optional search by code or name)
router.get('/', async (req, res) => {
  const { search } = req.query;
  const filter = search
    ? { $or: [
        { skuErpCode: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') },
      ] }
    : {};
  const skus = await SkuMaster.find(filter).sort({ createdAt: -1 });
  res.json(skus);
});

// GET ONE
router.get('/:id', async (req, res) => {
  const sku = await SkuMaster.findById(req.params.id);
  if (!sku) return res.status(404).json({ error: 'Not found' });
  res.json(sku);
});

// UPDATE
router.patch('/:id', async (req, res) => {
  try {
    const sku = await SkuMaster.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!sku) return res.status(404).json({ error: 'Not found' });
    res.json(sku);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  const sku = await SkuMaster.findByIdAndDelete(req.params.id);
  if (!sku) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;