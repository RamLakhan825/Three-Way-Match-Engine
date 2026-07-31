'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import FilePreview from '../FilePreview';
import MismatchBanner from '../MismatchBanner';

export default function DeliveryTab({ match }: { match: any }) {
  const grns = match?.documents?.grns || [];
  const [selectedId, setSelectedId] = useState<string | null>(grns[0]?._id || null);

  useEffect(() => {
    if (!selectedId && grns.length > 0) setSelectedId(grns[0]._id);
  }, [grns, selectedId]);

  const { data: grnDoc, isLoading } = useQuery({
    queryKey: ['grn-detail', selectedId],
    queryFn: async () => {
      const res = await apiClient.get(`/documents/${selectedId}`);
      return res.data;
    },
    enabled: !!selectedId,
  });

  if (grns.length === 0) {
    return <p className="text-slate-500 text-sm">No GRNs uploaded yet for this PO.</p>;
  }

  const selectedGrnSummary = grns.find((g: any) => g._id === selectedId);
  const isDuplicateSet = match.reasons?.includes('duplicate_document') && grns.length > 1;

  return (
    <div>
      {/* Sub-tab pills — one per GRN */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {grns.map((g: any) => (
          <button
            key={g._id}
            onClick={() => setSelectedId(g._id)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              selectedId === g._id
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
            }`}
          >
            GRN: {g.grnNumber} Raised
          </button>
        ))}
      </div>

      {isDuplicateSet && (
        <MismatchBanner reasons={['duplicate_document']} />
      )}

      {isLoading && <p className="text-slate-500 text-sm">Loading GRN...</p>}

      {grnDoc && (
        <>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border border-slate-200 rounded-lg border-l-4 border-l-blue-600 p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">GRN Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs mb-1">GRN Number</p>
                  <p className="text-slate-800">{grnDoc.grnNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">GRN Date</p>
                  <p className="text-slate-800">
                    {grnDoc.grnDate ? new Date(grnDoc.grnDate).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">PO Number</p>
                  <p className="text-slate-800">{grnDoc.poNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Item Count</p>
                  <p className="text-slate-800">{grnDoc.items?.length ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="h-72">
              <FilePreview uploadedDocumentId={selectedGrnSummary?.uploadedDocumentId || null} />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Item Code</th>
                  <th className="px-3 py-2 font-medium text-right">Received Qty</th>
                  <th className="px-3 py-2 font-medium text-right">MRP</th>
                </tr>
              </thead>
              <tbody>
                {grnDoc.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{item.description || item.itemCode}</td>
                    <td className="px-3 py-2 text-slate-500">{item.itemCode}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{item.receivedQuantity}</td>
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