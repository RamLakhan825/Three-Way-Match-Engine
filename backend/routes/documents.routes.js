const express = require('express');
const router = express.Router();
const path = require('path');
const upload = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');
const UploadedDocument = require('../models/UploadedDocument');
const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const { parseDocument } = require('../services/gemini.service');
const {
  validatePoJson,
  validateGrnJson,
  validateInvoiceJson,
} = require('../services/validation.service');
const { resolveItemsSkuMaster } = require('../services/masterResolution.service');
const { checkDuplicate, logStep } = require('../services/duplicateCheck.service');

router.use(requireAuth);

// config per document type: which validator, which model, how to map parsed JSON -> model fields
const DOCUMENT_CONFIG = {
  po: {
    validate: validatePoJson,
    model: PurchaseOrder,
    buildRecord: (parsed, uploadedDoc) => ({
      poNumber: parsed.poNumber,
      poDate: parsed.poDate ? new Date(parsed.poDate) : null,
      vendorName: parsed.vendorName || '',
      items: parsed.items.map(i => ({
        itemCode: String(i.itemCode).trim(),
        description: i.description || '',
        quantity: i.quantity,
      })),
      rawParsed: parsed,
      uploadedDocumentId: uploadedDoc._id,
    }),
  },
  grn: {
    validate: validateGrnJson,
    model: Grn,
    buildRecord: (parsed, uploadedDoc) => ({
      grnNumber: parsed.grnNumber,
      poNumber: parsed.poNumber,
      grnDate: parsed.grnDate ? new Date(parsed.grnDate) : null,
      items: parsed.items.map(i => ({
        itemCode: String(i.itemCode).trim(),
        description: i.description || '',
        receivedQuantity: i.receivedQuantity,
        mrp: typeof i.mrp === 'number' ? i.mrp : 0,
      })),
      rawParsed: parsed,
      uploadedDocumentId: uploadedDoc._id,
    }),
  },
  invoice: {
    validate: validateInvoiceJson,
    model: Invoice,
    buildRecord: (parsed, uploadedDoc) => ({
      invoiceNumber: parsed.invoiceNumber,
      poNumber: parsed.poNumber,
      invoiceDate: parsed.invoiceDate ? new Date(parsed.invoiceDate) : null,
      items: parsed.items.map(i => ({
        itemCode: String(i.itemCode).trim(),
        description: i.description || '',
        quantity: i.quantity,
        unitRate: typeof i.unitRate === 'number' ? i.unitRate : 0,
        mrp: typeof i.mrp === 'number' ? i.mrp : 0,
      })),
      rawParsed: parsed,
      uploadedDocumentId: uploadedDoc._id,
    }),
  },
};

// UPLOAD
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { documentType } = req.body;
    const config = DOCUMENT_CONFIG[documentType];
    if (!config) {
      return res.status(400).json({ error: 'documentType must be po, grn, or invoice' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }

    const uploadedDoc = await UploadedDocument.create({
      documentType,
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      status: 'uploaded',
    });

    try {
      const parsed = await parseDocument(documentType, req.file.path, req.file.mimetype);
      const validationError = config.validate(parsed);

      if (validationError) {
        uploadedDoc.status = 'failed';
        uploadedDoc.parseError = validationError;
        await uploadedDoc.save();
        return res.status(422).json({ error: 'Parsing validation failed', details: validationError });
      }

      const record = config.buildRecord(parsed, uploadedDoc);
      await resolveItemsSkuMaster(record.items);
      const duplicateResult = await checkDuplicate(documentType, record);
      const savedRecord = await config.model.create(record);
      await logStep(record.poNumber, 'upload', 'ok', `${documentType} ${req.file.originalname} parsed and stored`);

      uploadedDoc.status = 'parsed';
      await uploadedDoc.save();

      return res.status(201).json({
        uploadedDoc,
        parsedRecord: savedRecord,
        duplicateWarning: duplicateResult.isDuplicate ? duplicateResult.reason : null,
      });
    } catch (err) {
      uploadedDoc.status = 'failed';
      uploadedDoc.parseError = err.message;
      await uploadedDoc.save();
      return res.status(422).json({ error: err.message });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// LIST
router.get('/', async (req, res) => {
  const { type } = req.query;
  const filter = type ? { documentType: type } : {};
  const docs = await UploadedDocument.find(filter).sort({ createdAt: -1 });
  res.json(docs);
});

// GET ONE — looks up the parsed record (PO/GRN/Invoice) by its own _id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const [po, grn, invoice] = await Promise.all([
    PurchaseOrder.findById(id).catch(() => null),
    Grn.findById(id).catch(() => null),
    Invoice.findById(id).catch(() => null),
  ]);

  const found = po || grn || invoice;
  if (!found) return res.status(404).json({ error: 'Not found' });

  res.json(found);
});

// GET FILE (for preview)
router.get('/:id/file', async (req, res) => {
  const doc = await UploadedDocument.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.resolve(doc.filePath));
});

module.exports = router;