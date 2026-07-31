import apiClient from './apiClient';

export async function listPoNumbers() {
  const res = await apiClient.get('/po-list');
  return res.data;
}

export async function getMatch(poNumber: string) {
  const res = await apiClient.get(`/match/${poNumber}`);
  return res.data;
}

export async function getSummary(poNumber: string) {
  const res = await apiClient.get(`/summary/${poNumber}`);
  return res.data;
}

export async function uploadDocument(file: File, documentType: 'po' | 'grn' | 'invoice') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  const res = await apiClient.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getDocumentFileBlobUrl(uploadedDocumentId: string) {
  const res = await apiClient.get(`/documents/${uploadedDocumentId}/file`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(res.data);
}

export async function listSkuMasters(search?: string) {
  const res = await apiClient.get('/masters/sku', { params: search ? { search } : {} });
  return res.data;
}

export async function createSkuMaster(payload: any) {
  const res = await apiClient.post('/masters/sku', payload);
  return res.data;
}

export async function updateSkuMaster(id: string, payload: any) {
  const res = await apiClient.patch(`/masters/sku/${id}`, payload);
  return res.data;
}

export async function deleteSkuMaster(id: string) {
  const res = await apiClient.delete(`/masters/sku/${id}`);
  return res.data;
}