import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import type { Transaction } from '@/types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/escrow/list');
      setTransactions(res.data.transactions || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = {
    total: transactions.length,
    active: transactions.filter((t) =>
      ['PENDING', 'ACCEPTED', 'FUNDED', 'SHIPPED', 'PAID'].includes(t.status),
    ).length,
    completed: transactions.filter((t) => t.status === 'COMPLETED').length,
    disputed: transactions.filter((t) => t.status === 'DISPUTED').length,
  };

  return { transactions, loading, error, stats, refresh: load };
}
