const REASON_LABELS: Record<string, string> = {
  grn_qty_exceeds_po_qty: 'GRN Quantity Exceeds PO',
  invoice_qty_exceeds_grn_qty: 'Invoice Quantity Exceeds GRN',
  invoice_qty_exceeds_po_qty: 'Invoice Quantity Exceeds PO',
  invoice_date_after_po_date: 'Invoice Dated After PO',
  duplicate_po: 'Duplicate PO',
  duplicate_document: 'Duplicate Document',
  item_missing_in_po: 'Item Missing In PO',
  price_mismatch: 'Price Mismatch',
  mrp_mismatch: 'MRP Mismatch',
  unmapped_master_sku: 'Unmapped SKU',
};

export default function MismatchBanner({ reasons }: { reasons: string[] }) {
  if (!reasons || reasons.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
      <p className="text-sm font-medium text-red-700 mb-1">Issues found on this document</p>
      <div className="flex flex-wrap gap-2">
        {reasons.map((r) => (
          <span key={r} className="text-xs bg-red-100 text-red-700 rounded px-2 py-0.5">
            {REASON_LABELS[r] || r}
          </span>
        ))}
      </div>
    </div>
  );
}