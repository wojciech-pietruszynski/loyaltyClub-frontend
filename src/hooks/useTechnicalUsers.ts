import { useState, useCallback } from 'react';
import api from '../api/client';
import type { TechnicalUser } from '../types';
import type { TechnicalUserFormState } from '../types/ui';

export function useTechnicalUsers() {
  const [technicalUsers, setTechnicalUsers] = useState<TechnicalUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTechnicalUsers = useCallback(async () => {
    try {
      const { data } = await api.get<TechnicalUser[]>('/technical-users');
      setTechnicalUsers(data);
    } catch (err: any) {
      setError('Failed to fetch technical users');
    }
  }, []);

  const createTechnicalUser = useCallback(async (form: TechnicalUserFormState) => {
    setLoading(true);
    try {
      await api.post('/technical-users', form);
      await fetchTechnicalUsers();
      return true;
    } catch (err: any) {
      setError('Failed to create technical user');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTechnicalUsers]);

  const toggleTechnicalUser = useCallback(async (id: number, enabled: boolean) => {
    try {
      await api.patch(`/technical-users/${id}/status`, { enabled });
      await fetchTechnicalUsers();
      return true;
    } catch (err: any) {
      setError('Failed to toggle user status');
      return false;
    }
  }, [fetchTechnicalUsers]);

  const updatePassword = useCallback(async (id: number, password: string) => {
    try {
      await api.patch(`/technical-users/${id}/password`, { password });
      return true;
    } catch (err: any) {
      setError('Failed to update password');
      return false;
    }
  }, []);

  return {
    technicalUsers,
    loading,
    error,
    fetchTechnicalUsers,
    createTechnicalUser,
    toggleTechnicalUser,
    updatePassword,
    setError,
  };
}
