'use client';

import { useEffect, useState } from 'react';
import { getDocumentFileBlobUrl } from '../lib/api';

export default function FilePreview({ uploadedDocumentId }: { uploadedDocumentId: string | null }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    let currentUrl: string | null = null;
    setError('');
    setBlobUrl(null);

    if (!uploadedDocumentId) return;

    getDocumentFileBlobUrl(uploadedDocumentId)
      .then((url) => {
        currentUrl = url;
        setBlobUrl(url);
      })
      .catch(() => setError('Could not load preview for this document.'));

    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [uploadedDocumentId]);

  if (!uploadedDocumentId) {
    return (
      <div className="border border-slate-200 rounded-lg h-full flex items-center justify-center text-slate-400 text-sm p-8">
        No file available for preview.
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-slate-200 rounded-lg h-full flex items-center justify-center text-slate-400 text-sm p-8">
        {error}
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-end gap-2 border-b border-slate-200 px-3 py-2">
        <button
          onClick={() => setZoom((z) => Math.max(50, z - 10))}
          className="w-7 h-7 rounded border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
        >
          −
        </button>
        <span className="text-xs text-slate-500 w-10 text-center">{zoom}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(200, z + 10))}
          className="w-7 h-7 rounded border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2 bg-slate-50">
        {blobUrl ? (
          <iframe
            src={blobUrl}
            style={{ width: `${zoom}%`, height: '600px', border: 'none', background: 'white' }}
            title="Document preview"
          />
        ) : (
          <p className="text-slate-400 text-sm p-8">Loading preview...</p>
        )}
      </div>
    </div>
  );
}