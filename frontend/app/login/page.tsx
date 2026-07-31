'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '../../lib/apiClient';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { username, password });
      localStorage.setItem('authToken', res.data.token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm border border-slate-200"
      >
        <h1 className="text-xl font-semibold mb-6 text-slate-800">
          Three-Way Match Engine
        </h1>

        <label className="block text-sm font-medium text-slate-600 mb-1">Username</label>
        <input
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4 text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
        />

        <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
        <input
          type="password"
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="admin"
        />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-800 text-white rounded py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
}