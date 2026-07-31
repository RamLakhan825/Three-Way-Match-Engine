'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getMatch } from '../../../lib/api';
import { useAuthGuard } from '../../../lib/useAuthGuard';
import UploadModal from '../../../components/UploadModal';
import PurchaseOrderTab from '../../../components/po-tabs/PurchaseOrderTab';
import DeliveryTab from '../../../components/po-tabs/DeliveryTab';
import FulfillmentTab from '../../../components/po-tabs/FulfillmentTab';
import SummaryTab from '../../../components/po-tabs/SummaryTab';

type TabKey = 'po' | 'fulfillment' | 'delivery' | 'summary';

export default function PoDetailPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const poNumber = params.poNumber as string;

  const [activeTab, setActiveTab] = useState<TabKey>('po');
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', poNumber],
    queryFn: () => getMatch(poNumber),
    enabled: ready && !!poNumber,
  });

  if (!ready) return null;

  const poCount = match?.documents?.po?.length ?? 0;
  const grnCount = match?.documents?.grns?.length ?? 0;
  const invoiceCount = match?.documents?.invoices?.length ?? 0;

  // Naming note from the assignment: Fulfillment tab shows Invoices, Delivery tab shows GRNs.
  const tabs: { key: TabKey; label: string; count: number | null }[] = [
    { key: 'po', label: 'Purchase Order', count: poCount },
    { key: 'fulfillment', label: 'Fulfillment', count: invoiceCount },
    { key: 'delivery', label: 'Delivery', count: grnCount },
    { key: 'summary', label: 'Summary', count: null },
  ];

  const statusStyles: Record<string, string> = {
    matched: 'bg-green-100 text-green-700',
    partially_matched: 'bg-amber-100 text-amber-700',
    mismatch: 'bg-red-100 text-red-700',
    insufficient_documents: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left icon rail — static per assignment spec */}
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
          onClick={() => router.push('/sku-master')}
          className="w-9 h-9 rounded flex items-center justify-center text-white hover:bg-slate-700"
        >
          📦
        </button>
      </div>

      <div className="flex-1">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{poNumber}</h1>
            {match?.status && (
              <span
                className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded ${
                  statusStyles[match.status] || 'bg-slate-100 text-slate-600'
                }`}
              >
                {match.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="px-4 py-2 text-sm rounded bg-slate-800 text-white hover:bg-slate-700"
          >
            + Upload Document
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-200 px-6 flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.count !== null && <span className="ml-1 text-xs text-slate-400">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* Tab content — stubs for now, filled in over the next phases */}
        <div className="p-6">
          {isLoading && <p className="text-slate-500 text-sm">Loading match data...</p>}
          {!isLoading && activeTab === 'po' && match && <PurchaseOrderTab match={match} />}
          {!isLoading && activeTab === 'fulfillment' && match && <FulfillmentTab match={match} />}
{!isLoading && activeTab === 'delivery' && match && <DeliveryTab match={match} />}
          {!isLoading && activeTab === 'summary' && <SummaryTab poNumber={poNumber} />}
        </div>
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}