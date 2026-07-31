'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { listPoNumbers } from '../lib/api';
import { useAuthGuard } from '../lib/useAuthGuard';
import UploadModal from '../components/UploadModal';

export default function DashboardPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['po-list'],
    queryFn: listPoNumbers,
    enabled: ready,
  });

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-800">Purchase Orders</h1>
          <button
            onClick={() => setUploadOpen(true)}
            className="px-4 py-2 text-sm rounded bg-slate-800 text-white hover:bg-slate-700"
          >
            + Upload Document
          </button>
        </div>

        {isLoading && <p className="text-slate-500 text-sm">Loading...</p>}

        {!isLoading && (!data || data.length === 0) && (
          <p className="text-slate-500 text-sm">
            No documents uploaded yet. Click &quot;Upload Document&quot; to get started.
          </p>
        )}

        <div className="grid gap-3">
          {data?.map((row: any) => (
            <button
              key={row.poNumber}
              onClick={() => router.push(`/po/${row.poNumber}`)}
              className="bg-white border border-slate-200 rounded-lg p-4 text-left hover:border-slate-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">{row.poNumber}</span>
                <div className="flex gap-2 text-xs text-slate-500">
                  <span className="bg-slate-100 rounded px-2 py-1">PO: {row.poCount}</span>
                  <span className="bg-slate-100 rounded px-2 py-1">GRN: {row.grnCount}</span>
                  <span className="bg-slate-100 rounded px-2 py-1">Invoice: {row.invoiceCount}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={(poNumber) => {
          if (poNumber) router.push(`/po/${poNumber}`);
        }}
      />
    </div>
  );
}