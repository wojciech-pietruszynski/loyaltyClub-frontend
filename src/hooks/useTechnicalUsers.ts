import { useCallback, useState } from 'react';
import api from '../api/client';
import { isTechnicalUser, parseList } from '../api/schema';
import type { TechnicalUser } from '../types';
import type { StateSetter, TechnicalUserFormState, Translator } from '../types/ui';
import { useApiErrorMessage } from './useApiError';
import { useEnsure } from './useEnsure';

export type TechnicalUsersApi = {
  technicalUsers: TechnicalUser[];
  loading: boolean;
  error: string | null;
  fetchTechnicalUsers: () => Promise<void>;
  ensureTechnicalUsers: () => Promise<void>;
  createTechnicalUser: (form: TechnicalUserFormState) => Promise<boolean>;
  toggleTechnicalUser: (id: number, enabled: boolean) => Promise<boolean>;
  updatePassword: (id: number, password: string) => Promise<boolean>;
  setError: StateSetter<string | null>;
};

export function useTechnicalUsers(t: Translator): TechnicalUsersApi {
  const [technicalUsers, setTechnicalUsers] = useState<TechnicalUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toMessage = useApiErrorMessage(t);

  const fetchTechnicalUsers = useCallback(async () => {
    try {
      const { data } = await api.get<unknown>('/technical-users');
      setTechnicalUsers(parseList('/technical-users', data, isTechnicalUser));
      setError(null);
    } catch (err: unknown) {
      setError(toMessage(err, 'fetchTechnicalUsersError'));
    }
  }, [toMessage]);

  const createTechnicalUser = useCallback(async (form: TechnicalUserFormState) => {
    setLoading(true);
    try {
      await api.post('/technical-users', {
        username: form.username.trim(),
        password: form.password,
        country: form.country,
        enabled: form.enabled,
      });
      await fetchTechnicalUsers();
      return true;
    } catch (err: unknown) {
      setError(toMessage(err, 'technicalUserCreateError'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTechnicalUsers, toMessage]);

  /** Aktualizacja optymistyczna z wycofaniem — jak w promocjach. */
  const toggleTechnicalUser = useCallback(async (id: number, enabled: boolean) => {
    const applyLocally = (value: boolean) => {
      setTechnicalUsers((previous) => previous.map(
        (user) => (user.id === id ? { ...user, enabled: value } : user),
      ));
    };

    applyLocally(enabled);
    try {
      await api.patch(`/technical-users/${id}/status`, { enabled });
      setError(null);
      return true;
    } catch (err: unknown) {
      applyLocally(!enabled);
      setError(toMessage(err, 'technicalUserToggleError'));
      return false;
    }
  }, [toMessage]);

  const updatePassword = useCallback(async (id: number, password: string) => {
    try {
      await api.patch(`/technical-users/${id}/password`, { password });
      setError(null);
      return true;
    } catch (err: unknown) {
      setError(toMessage(err, 'technicalUserPasswordUpdateError'));
      return false;
    }
  }, [toMessage]);

  // Pobranie odroczone: wołane przy wejściu na trasę, wykonuje się raz.
  const ensureTechnicalUsers = useEnsure(fetchTechnicalUsers);

  return {
    technicalUsers,
    loading,
    error,
    fetchTechnicalUsers,
    ensureTechnicalUsers,
    createTechnicalUser,
    toggleTechnicalUser,
    updatePassword,
    setError,
  };
}
