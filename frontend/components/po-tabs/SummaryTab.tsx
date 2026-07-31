'use client';

import { useQuery } from '@tanstack/react-query';
import { getSummary } from '../../lib/api';

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SummaryTab({ poNumber }: { poNumber: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['summary', poNumber],
    queryFn: () => getSummary(poNumber),
    enabled: !!poNumber,
  });

  if (isLoading) return <p className="text-slate-500 text-sm">Loading summary...</p>;
  if (error) return <p className="text-red-600 text-sm">Failed to load summary.</p>;
  if (!data) return null;

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">PO Amount</p>
          <p className="text-xl font-semibold text-slate-800">{formatCurrency(data.poAmount || 0)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Total Invoiced</p>
          <p className="text-xl font-semibold text-slate-800">{formatCurrency(data.totalInvoiced || 0)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Total Received</p>
          <p className="text-xl font-semibold text-slate-800">
            {(data.totalReceived || 0).toLocaleString('en-IN')} units
          </p>
        </div>
      </div>

      {/* Associated Invoice & GRN table */}
      <div className="border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500">
              <th className="px-3 py-2 font-medium">Document Type</th>
              <th className="px-3 py-2 font-medium">Document Number</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium text-right">Cumulative Received Qty</th>
              <th className="px-3 py-2 font-medium text-right">Cumulative Invoiced Qty</th>
              <th className="px-3 py-2 font-medium text-right">Pending Delivery Qty</th>
            </tr>
          </thead>
          <tbody>
            {data.rows?.map((row: any, idx: number) => {
              const isCurrentStatus = row.documentType === 'Current Status';
              return (
                <tr
                  key={idx}
                  className={`border-b border-slate-100 ${
                    isCurrentStatus ? 'bg-slate-50 font-medium' : ''
                  }`}
                >
                  <td className="px-3 py-2 text-slate-700">{row.documentType}</td>
                  <td className="px-3 py-2 text-slate-500">{row.documentNumber || '—'}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {row.date ? new Date(row.date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">{row.cumulativeReceivedQty}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{row.cumulativeInvoicedQty}</td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {isCurrentStatus ? row.pendingDeliveryQty : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}