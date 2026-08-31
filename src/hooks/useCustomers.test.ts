import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCustomers } from './useCustomers';
import api from '../api/client';
import type { TranslationKey } from '../i18n';
import { makeCustomer } from '../test/fixtures';

vi.mock('../api/client');

const t = (key: TranslationKey) => key;

describe('useCustomers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with an empty state', () => {
    const { result } = renderHook(() => useCustomers(t));
    expect(result.current.customers).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches customers', async () => {
    const customers = [makeCustomer()];
    vi.mocked(api.get).mockResolvedValue({ data: customers });

    const { result } = renderHook(() => useCustomers(t));

    act(() => {
      void result.current.fetchCustomers();
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.customers).toEqual(customers);
    expect(api.get).toHaveBeenCalledWith('/customers');
  });

  it('reports the message from the ProblemDetail body', async () => {
    vi.mocked(api.get).mockRejectedValue({ response: { data: { detail: 'Konkretny błąd' } } });

    const { result } = renderHook(() => useCustomers(t));

    await act(async () => {
      await result.current.fetchCustomers();
    });

    expect(result.current.error).toBe('Konkretny błąd');
    expect(result.current.customers).toEqual([]);
  });

  it('falls back to a translated message when the backend gives no detail', async () => {
    vi.mocked(api.get).mockRejectedValue({ response: { data: {} } });

    const { result } = renderHook(() => useCustomers(t));

    await act(async () => {
      await result.current.fetchCustomers();
    });

    expect(result.current.error).toBe('fetchCustomersError');
  });

  it('rejects a response whose shape does not match the declared type', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 'nie-liczba' }] });

    const { result } = renderHook(() => useCustomers(t));

    await act(async () => {
      await result.current.fetchCustomers();
    });

    expect(result.current.customers).toEqual([]);
    expect(result.current.error).toBe('invalidServerResponse');
  });

  it('adds a customer and refetches the list', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [makeCustomer()] });

    const { result } = renderHook(() => useCustomers(t));

    await act(async () => {
      const success = await result.current.addCustomer({
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@example.com',
        customerNumber: 'C-001',
        phoneNumber: '600100200',
        country: 'PL',
        referrerCustomerNumber: '',
      });
      expect(success).toBe(true);
    });

    expect(api.post).toHaveBeenCalled();
    expect(api.get).toHaveBeenCalled();
  });

  it('converts the point count to a number at the send boundary', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useCustomers(t));

    await act(async () => {
      await result.current.addPoints('7', '250', ' Zakup ');
    });

    expect(api.post).toHaveBeenCalledWith('/customers/7/add-points', { points: 250, description: 'Zakup' });
  });

  it('runs the deferred fetch only once', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useCustomers(t));

    await act(async () => {
      await result.current.ensureCustomers();
      await result.current.ensureCustomers();
    });

    expect(api.get).toHaveBeenCalledTimes(1);
  });
});
