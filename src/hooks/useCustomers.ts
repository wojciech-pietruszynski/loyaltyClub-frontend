import { useCallback, useState } from 'react';
import api from '../api/client';
import { isCustomer, isCustomerTransaction, isCoupon, isPurchaseHistorySeries, parseList, parseObject } from '../api/schema';
import type { Coupon, Customer, CustomerTransaction } from '../types';
import type { CustomerEditFormState, NewCustomerFormState, PurchaseHistorySeries, StateSetter, Translator } from '../types/ui';
import { toInteger } from '../lib/numbers';
import { useApiErrorMessage } from './useApiError';
import { useEnsure } from './useEnsure';

const EMPTY_HISTORY: PurchaseHistorySeries = { points: [], maxTotal: 0 };

/** Backend może zwrócić liczbę zaimportowanych rekordów pod różnymi nazwami. */
function readImportedCount(payload: unknown): number {
  if (typeof payload === 'number') return payload;
  if (Array.isArray(payload)) return payload.length;
  if (payload && typeof payload === 'object') {
    for (const key of ['imported', 'importedCount', 'count'] as const) {
      const value = (payload as Record<string, unknown>)[key];
      if (typeof value === 'number') return value;
    }
  }
  return 0;
}

export type CustomersApi = {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  ensureCustomers: () => Promise<void>;
  addCustomer: (form: NewCustomerFormState) => Promise<boolean>;
  addPoints: (customerId: string, points: string, description: string) => Promise<boolean>;
  updateCustomer: (customerId: number, form: CustomerEditFormState) => Promise<boolean>;
  fetchTransactions: (customerId: number) => Promise<CustomerTransaction[]>;
  fetchCoupons: (customerId: number) => Promise<Coupon[]>;
  fetchPurchaseHistory: (customerId: number) => Promise<PurchaseHistorySeries>;
  importCustomers: (file: File) => Promise<number | null>;
  setCustomers: StateSetter<Customer[]>;
  setError: StateSetter<string | null>;
};

export function useCustomers(t: Translator): CustomersApi {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toMessage = useApiErrorMessage(t);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<unknown>('/customers');
      setCustomers(parseList('/customers', data, isCustomer));
      setError(null);
    } catch (err: unknown) {
      setError(toMessage(err, 'fetchCustomersError'));
    } finally {
      setLoading(false);
    }
  }, [toMessage]);

  const addCustomer = useCallback(async (form: NewCustomerFormState) => {
    setLoading(true);
    try {
      await api.post('/customers', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        customerNumber: form.customerNumber.trim(),
        phoneNumber: form.phoneNumber.trim(),
        country: form.country,
        referrerCustomerNumber: form.referrerCustomerNumber.trim() || null,
      });
      await fetchCustomers();
      return true;
    } catch (err: unknown) {
      setError(toMessage(err, 'addCustomerError'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers, toMessage]);

  // Konwersja liczby punktów na granicy wysyłki — formularz trzyma łańcuch znaków.
  const addPoints = useCallback(async (customerId: string, points: string, description: string) => {
    setLoading(true);
    try {
      await api.post(`/customers/${customerId}/add-points`, {
        points: toInteger(points),
        description: description.trim(),
      });
      await fetchCustomers();
      return true;
    } catch (err: unknown) {
      setError(toMessage(err, 'addPointsError'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers, toMessage]);

  const updateCustomer = useCallback(async (customerId: number, form: CustomerEditFormState) => {
    setLoading(true);
    try {
      await api.put(`/customers/${customerId}`, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        customerNumber: form.customerNumber.trim(),
        phoneNumber: form.phoneNumber.trim(),
        country: form.country,
      });
      await fetchCustomers();
      return true;
    } catch (err: unknown) {
      setError(toMessage(err, 'customerSaveError'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers, toMessage]);

  const fetchTransactions = useCallback(async (customerId: number) => {
    try {
      const { data } = await api.get<unknown>(`/customers/${customerId}/transactions`);
      return parseList('/customers/{id}/transactions', data, isCustomerTransaction);
    } catch (err: unknown) {
      setError(toMessage(err, 'fetchTransactionsError'));
      return [];
    }
  }, [toMessage]);

  const fetchCoupons = useCallback(async (customerId: number) => {
    try {
      const { data } = await api.get<unknown>(`/customers/${customerId}/coupons`);
      return parseList('/customers/{id}/coupons', data, isCoupon);
    } catch (err: unknown) {
      setError(toMessage(err, 'fetchCustomerCouponsError'));
      return [];
    }
  }, [toMessage]);

  const fetchPurchaseHistory = useCallback(async (customerId: number) => {
    try {
      const { data } = await api.get<unknown>(`/customers/${customerId}/purchase-history`);
      return parseObject('/customers/{id}/purchase-history', data, isPurchaseHistorySeries);
    } catch (err: unknown) {
      setError(toMessage(err, 'fetchPurchaseHistoryError'));
      return EMPTY_HISTORY;
    }
  }, [toMessage]);

  /**
   * Import CSV. Wołanie klienta HTTP z komponentu narzędzi przeniesione tutaj,
   * żeby warstwa prezentacji nie sięgała do sieci bezpośrednio.
   * Zwraca liczbę zaimportowanych klientów albo `null` przy błędzie.
   */
  const importCustomers = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<unknown>('/tools/import-customers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchCustomers();
      return readImportedCount(data);
    } catch (err: unknown) {
      setError(toMessage(err, 'importCustomersError'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers, toMessage]);

  // Pobranie odroczone: wołane przy wejściu na trasę, wykonuje się raz.
  const ensureCustomers = useEnsure(fetchCustomers);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    ensureCustomers,
    addCustomer,
    addPoints,
    updateCustomer,
    fetchTransactions,
    fetchCoupons,
    fetchPurchaseHistory,
    importCustomers,
    setCustomers,
    setError,
  };
}
