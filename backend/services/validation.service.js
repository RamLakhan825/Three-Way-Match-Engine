function validatePoJson(json) {
  if (!json || typeof json !== 'object') return 'Response is not an object';
  if (!json.poNumber) return 'Missing poNumber';
  if (!Array.isArray(json.items) || json.items.length === 0) return 'Missing or empty items array';
  for (const item of json.items) {
    if (item.itemCode === undefined) return 'Item missing itemCode';
    if (typeof item.quantity !== 'number') return 'Item missing numeric quantity';
  }
  return null;
}

function validateGrnJson(json) {
  if (!json || typeof json !== 'object') return 'Response is not an object';
  if (!json.grnNumber) return 'Missing grnNumber';
  if (!json.poNumber) return 'Missing poNumber';
  if (!Array.isArray(json.items) || json.items.length === 0) return 'Missing or empty items array';
  for (const item of json.items) {
    if (item.itemCode === undefined) return 'Item missing itemCode';
    if (typeof item.receivedQuantity !== 'number') return 'Item missing numeric receivedQuantity';
  }
  return null;
}

function validateInvoiceJson(json) {
  if (!json || typeof json !== 'object') return 'Response is not an object';
  if (!json.invoiceNumber) return 'Missing invoiceNumber';
  if (!json.poNumber) return 'Missing poNumber';
  if (!Array.isArray(json.items) || json.items.length === 0) return 'Missing or empty items array';
  for (const item of json.items) {
    if (item.itemCode === undefined) return 'Item missing itemCode';
    if (typeof item.quantity !== 'number') return 'Item missing numeric quantity';
  }
  return null;
}

module.exports = { validatePoJson, validateGrnJson, validateInvoiceJson };