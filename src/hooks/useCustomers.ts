import { useState, useCallback } from 'react';
import api from '../api/client';
import type { Customer } from '../types';
import type { NewCustomerFormState } from '../types/ui';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Customer[]>('/customers');
      setCustomers(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCustomer = useCallback(async (newCustomer: NewCustomerFormState) => {
    setLoading(true);
    try {
      await api.post('/customers', newCustomer);
      await fetchCustomers();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add customer');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    addCustomer,
    setCustomers,
    setError,
  };
}
