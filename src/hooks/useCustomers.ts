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

  const addPoints = useCallback(async (customerId: string, points: number, description: string) => {
    setLoading(true);
    try {
      await api.post(`/customers/${customerId}/points`, { points, description });
      await fetchCustomers();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add points');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  const updateCustomer = useCallback(async (customerId: number, data: any) => {
    setLoading(true);
    try {
      await api.put(`/customers/${customerId}`, data);
      await fetchCustomers();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update customer');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  const fetchTransactions = useCallback(async (customerId: number) => {
    try {
      const { data } = await api.get(`/customers/${customerId}/transactions`);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch transactions');
      return [];
    }
  }, []);

  const fetchCoupons = useCallback(async (customerId: number) => {
    try {
      const { data } = await api.get(`/customers/${customerId}/coupons`);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch customer coupons');
      return [];
    }
  }, []);

  const fetchPurchaseHistory = useCallback(async (customerId: number) => {
    try {
      const { data } = await api.get(`/customers/${customerId}/purchase-history`);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch purchase history');
      return { points: [], maxTotal: 0 };
    }
  }, []);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    addCustomer,
    addPoints,
    updateCustomer,
    fetchTransactions,
    fetchCoupons,
    fetchPurchaseHistory,
    setCustomers,
    setError,
  };
}
