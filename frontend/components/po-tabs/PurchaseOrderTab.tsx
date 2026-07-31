import MismatchBanner from '../MismatchBanner';
import FilePreview from '../FilePreview';
import ItemGrid from '../ItemGrid';

export default function PurchaseOrderTab({ match }: { match: any }) {
  const canonicalPo = match?.documents?.po?.[0];
  const poReasons = match?.reasons?.filter(
    (r: string) => r === 'duplicate_po' || r === 'invoice_date_after_po_date'
  ) || [];

  return (
    <div>
      <MismatchBanner reasons={poReasons} />

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Left: form panel */}
        <div className="border border-slate-200 rounded-lg border-l-4 border-l-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">PO Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs mb-1">PO Number</p>
              <p className="text-slate-800">{match.poNumber}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">PO Date</p>
              <p className="text-slate-800">
                {canonicalPo?.poDate ? new Date(canonicalPo.poDate).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Vendor Name</p>
              <p className="text-slate-800">{canonicalPo?.vendorName || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Total POs Uploaded</p>
              <p className="text-slate-800">{match?.documents?.po?.length ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Right: file preview */}
        <div className="h-80">
          <FilePreview uploadedDocumentId={canonicalPo?.uploadedDocumentId || null} />
        </div>
      </div>

      {/* Bottom: item grid */}
      <ItemGrid items={match.items || []} />
    </div>
  );
}