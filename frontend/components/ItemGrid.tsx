type MatchItem = {
  itemCode: string;
  description: string;
  skuMasterId: string | null;
  skuMasterName: string | null;
  eanCode: string | null;
  hsnCode: string | null;
  uom: string | null;
  poQty: number;
  grnQty: number;
  invoiceQty: number;
  agreedRate: number | null;
  invoiceUnitRates: number[];
  masterMrp: number | null;
  grnMrps: number[];
  invoiceMrps: number[];
  reasons: string[];
};

export default function ItemGrid({ items }: { items: MatchItem[] }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500">
            <th className="px-3 py-2 font-medium">SKU Name</th>
            <th className="px-3 py-2 font-medium">Mapped SKU Name</th>
            <th className="px-3 py-2 font-medium">ERP Code</th>
            <th className="px-3 py-2 font-medium">EAN</th>
            <th className="px-3 py-2 font-medium">HSN</th>
            <th className="px-3 py-2 font-medium">UOM</th>
            <th className="px-3 py-2 font-medium text-right">PO Qty</th>
            <th className="px-3 py-2 font-medium text-right">GRN Qty</th>
            <th className="px-3 py-2 font-medium text-right">Invoice Qty</th>
            <th className="px-3 py-2 font-medium text-right">Unit Price</th>
            <th className="px-3 py-2 font-medium text-right">Unit MRP</th>
            <th className="px-3 py-2 font-medium text-right">Gross Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const isUnmapped = item.reasons.includes('unmapped_master_sku');
            const isPriceMismatch = item.reasons.includes('price_mismatch');
            const isMrpMismatch = item.reasons.includes('mrp_mismatch');
            const isQtyIssue = item.reasons.some((r) => r.includes('qty_exceeds') || r === 'item_missing_in_po');
            const invoiceRate = item.invoiceUnitRates[0] ?? null;
            const gross = (item.agreedRate ?? 0) * item.poQty;

            return (
              <tr
                key={idx}
                className={`border-b border-slate-100 ${isUnmapped ? 'bg-amber-50' : ''}`}
              >
                <td className="px-3 py-2 text-slate-700">
                  {item.description || item.itemCode}
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {item.skuMasterName || (
                    <span className="text-amber-600 text-xs font-medium">Unmapped</span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-500">{item.itemCode}</td>
                <td className="px-3 py-2 text-slate-500">{item.eanCode || '—'}</td>
                <td className="px-3 py-2 text-slate-500">{item.hsnCode || '—'}</td>
                <td className="px-3 py-2 text-slate-500">{item.uom || '—'}</td>
                <td className={`px-3 py-2 text-right ${isQtyIssue ? 'bg-red-50 text-red-700 font-medium' : 'text-slate-700'}`}>
                  {item.poQty}
                </td>
                <td className={`px-3 py-2 text-right ${isQtyIssue ? 'bg-red-50 text-red-700 font-medium' : 'text-slate-700'}`}>
                  {item.grnQty}
                </td>
                <td className={`px-3 py-2 text-right ${isQtyIssue ? 'bg-red-50 text-red-700 font-medium' : 'text-slate-700'}`}>
                  {item.invoiceQty}
                </td>
                <td className={`px-3 py-2 text-right ${isPriceMismatch ? 'bg-red-50 text-red-700 font-medium' : 'text-slate-700'}`}>
                  {invoiceRate !== null ? `₹${invoiceRate.toFixed(2)}` : '—'}
                </td>
                <td className={`px-3 py-2 text-right ${isMrpMismatch ? 'bg-red-50 text-red-700 font-medium' : 'text-slate-700'}`}>
                  {item.masterMrp !== null ? `₹${item.masterMrp.toFixed(2)}` : '—'}
                </td>
                <td className="px-3 py-2 text-right text-slate-700">₹{gross.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}