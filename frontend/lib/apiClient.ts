import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://three-way-match-engine-all0.onrender.com',
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default apiClient;
