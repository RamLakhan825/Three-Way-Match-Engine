'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadDocument } from '../lib/api';

export default function UploadModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: (poNumber: string) => void;
}) {
  const [documentType, setDocumentType] = useState<'po' | 'grn' | 'invoice'>('po');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Please choose a file');
      return uploadDocument(file, documentType);
    },
    onSuccess: (data) => {
      setError('');
      const poNumber = data?.parsedRecord?.poNumber;
      queryClient.invalidateQueries({ queryKey: ['po-list'] });
      if (poNumber) {
        queryClient.invalidateQueries({ queryKey: ['match', poNumber] });
        queryClient.invalidateQueries({ queryKey: ['summary', poNumber] });
      }
      setFile(null);
      onSuccess?.(poNumber);
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || err.message || 'Upload failed');
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Upload Document</h2>

        <label className="block text-sm font-medium text-slate-600 mb-1">Document Type</label>
        <select
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4 text-sm text-black bg-white"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as any)}
        >
          <option value="po">Purchase Order</option>
          <option value="grn">GRN (Delivery)</option>
          <option value="invoice">Invoice (Fulfillment)</option>
        </select>

        <label className="block text-sm font-medium text-slate-600 mb-1">File (PDF/Image)</label>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="w-full
    text-sm
    text-black
    mb-4
    file:mr-4
    file:px-4
    file:py-2
    file:rounded-lg
    file:border-0
    file:bg-blue-600
    file:text-white
    file:font-medium
    hover:file:bg-blue-700
    cursor-pointer"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !file}
            className="px-4 py-2 text-sm rounded bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Uploading & Parsing...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}