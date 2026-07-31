'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import FilePreview from '../FilePreview';
import MismatchBanner from '../MismatchBanner';

export default function FulfillmentTab({ match }: { match: any }) {
  const invoices = match?.documents?.invoices || [];
  const [selectedId, setSelectedId] = useState<string | null>(invoices[0]?._id || null);

  useEffect(() => {
    if (!selectedId && invoices.length > 0) setSelectedId(invoices[0]._id);
  }, [invoices, selectedId]);

  const { data: invoiceDoc, isLoading } = useQuery({
    queryKey: ['invoice-detail', selectedId],
    queryFn: async () => {
      const res = await apiClient.get(`/documents/${selectedId}`);
      return res.data;
    },
    enabled: !!selectedId,
  });

  if (invoices.length === 0) {
    return <p className="text-slate-500 text-sm">No Invoices uploaded yet for this PO.</p>;
  }

  const selectedInvoiceSummary = invoices.find((i: any) => i._id === selectedId);
  const isDuplicateSet = match.reasons?.includes('duplicate_document') && invoices.length > 1;
  const isLateInvoice = match.reasons?.includes('invoice_date_after_po_date');

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {invoices.map((inv: any) => (
          <button
            key={inv._id}
            onClick={() => setSelectedId(inv._id)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              selectedId === inv._id
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
            }`}
          >
            Invoice: {inv.invoiceNumber}
          </button>
        ))}
      </div>

      <MismatchBanner
        reasons={[
          ...(isDuplicateSet ? ['duplicate_document'] : []),
          ...(isLateInvoice ? ['invoice_date_after_po_date'] : []),
        ]}
      />

      {isLoading && <p className="text-slate-500 text-sm">Loading Invoice...</p>}

      {invoiceDoc && (
        <>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border border-slate-200 rounded-lg border-l-4 border-l-purple-600 p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Invoice Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs mb-1">Invoice Number</p>
                  <p className="text-slate-800">{invoiceDoc.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Invoice Date</p>
                  <p className="text-slate-800">
                    {invoiceDoc.invoiceDate ? new Date(invoiceDoc.invoiceDate).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">PO Number</p>
                  <p className="text-slate-800">{invoiceDoc.poNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Item Count</p>
                  <p className="text-slate-800">{invoiceDoc.items?.length ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="h-72">
              <FilePreview uploadedDocumentId={selectedInvoiceSummary?.uploadedDocumentId || null} />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Item Code</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Unit Rate</th>
                  <th className="px-3 py-2 font-medium text-right">MRP</th>
                </tr>
              </thead>
              <tbody>
                {invoiceDoc.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{item.description || item.itemCode}</td>
                    <td className="px-3 py-2 text-slate-500">{item.itemCode}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {item.unitRate ? `₹${item.unitRate.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {item.mrp ? `₹${item.mrp.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}