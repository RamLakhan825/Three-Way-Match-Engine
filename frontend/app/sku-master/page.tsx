'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSkuMasters, deleteSkuMaster } from '../../lib/api';
import { useAuthGuard } from '../../lib/useAuthGuard';
import SkuMasterFormModal from '../../components/SkuMasterFormModal';

export default function SkuMasterPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sku-masters', search],
    queryFn: () => listSkuMasters(search || undefined),
    enabled: ready,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSkuMaster(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sku-masters'] }),
  });

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="w-14 bg-slate-900 flex flex-col items-center py-4 gap-4">
        <button
          onClick={() => router.push('/')}
          title="Dashboard"
          className="w-9 h-9 rounded flex items-center justify-center text-white hover:bg-slate-700"
        >
          🏠
        </button>
        <button
          title="SKU Master"
          className="w-9 h-9 rounded flex items-center justify-center bg-slate-700 text-white"
        >
          📦
        </button>
      </div>

      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-slate-800">SKU Master</h1>
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 text-sm rounded bg-slate-800 text-white hover:bg-slate-700"
          >
            + New SKU
          </button>
        </div>

        <input
          className="w-full max-w-sm border border-slate-300 rounded px-3 py-2 text-sm mb-4"
          placeholder="Search by ERP code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isLoading && <p className="text-slate-500 text-sm">Loading...</p>}

        <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-2 font-medium">ERP Code</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">EAN Code</th>
                <th className="px-3 py-2 font-medium">HSN</th>
                <th className="px-3 py-2 font-medium">UOM</th>
                <th className="px-3 py-2 font-medium text-right">Agreed Rate</th>
                <th className="px-3 py-2 font-medium text-right">MRP</th>
                <th className="px-3 py-2 font-medium text-right">Tolerance</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((sku: any) => (
                <tr key={sku._id} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{sku.skuErpCode}</td>
                  <td className="px-3 py-2 text-slate-700">{sku.name}</td>
                  <td className="px-3 py-2 text-slate-500">{sku.eanCode || '—'}</td>
                  <td className="px-3 py-2 text-slate-500">{sku.hsnCode || '—'}</td>
                  <td className="px-3 py-2 text-slate-500">{sku.uom || '—'}</td>
                  <td className="px-3 py-2 text-right text-slate-700">₹{sku.agreedRate?.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-slate-700">₹{sku.mrp?.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {(sku.priceTolerance * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        setEditing(sku);
                        setModalOpen(true);
                      }}
                      className="text-xs text-blue-600 hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete SKU ${sku.skuErpCode}?`)) {
                          deleteMutation.mutate(sku._id);
                        }
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SkuMasterFormModal open={modalOpen} onClose={() => setModalOpen(false)} initialData={editing} />
    </div>
  );
}