'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSkuMaster, updateSkuMaster } from '../lib/api';

const EMPTY_FORM = {
  skuErpCode: '',
  name: '',
  eanCode: '',
  hsnCode: '',
  uom: '',
  agreedRate: '',
  mrp: '',
  priceTolerance: '0.05',
};

export default function SkuMasterFormModal({
  open,
  onClose,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: any | null;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const isEdit = !!initialData;

  useEffect(() => {
    if (initialData) {
      setForm({
        skuErpCode: initialData.skuErpCode || '',
        name: initialData.name || '',
        eanCode: initialData.eanCode || '',
        hsnCode: initialData.hsnCode || '',
        uom: initialData.uom || '',
        agreedRate: String(initialData.agreedRate ?? ''),
        mrp: String(initialData.mrp ?? ''),
        priceTolerance: String(initialData.priceTolerance ?? '0.05'),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [initialData, open]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        skuErpCode: form.skuErpCode.trim(),
        name: form.name.trim(),
        eanCode: form.eanCode.trim(),
        hsnCode: form.hsnCode.trim(),
        uom: form.uom.trim(),
        agreedRate: parseFloat(form.agreedRate) || 0,
        mrp: parseFloat(form.mrp) || 0,
        priceTolerance: parseFloat(form.priceTolerance) || 0.05,
      };
      return isEdit ? updateSkuMaster(initialData._id, payload) : createSkuMaster(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku-masters'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Save failed');
    },
  });

  if (!open) return null;

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {isEdit ? 'Edit SKU Master' : 'New SKU Master'}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ERP Code *</label>
            <input
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              value={form.skuErpCode}
              onChange={(e) => set('skuErpCode', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
            <input
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">EAN Code</label>
            <input
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              value={form.eanCode}
              onChange={(e) => set('eanCode', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">HSN Code</label>
            <input
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              value={form.hsnCode}
              onChange={(e) => set('hsnCode', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">UOM</label>
            <input
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              value={form.uom}
              onChange={(e) => set('uom', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Agreed Rate</label>
            <input
              type="number"
              step="0.01"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              value={form.agreedRate}
              onChange={(e) => set('agreedRate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">MRP</label>
            <input
              type="number"
              step="0.01"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              value={form.mrp}
              onChange={(e) => set('mrp', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Price Tolerance (fraction)
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              value={form.priceTolerance}
              onChange={(e) => set('priceTolerance', e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!form.skuErpCode.trim() || !form.name.trim()) {
                setError('ERP Code and Name are required');
                return;
              }
              setError('');
              mutation.mutate();
            }}
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm rounded bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}