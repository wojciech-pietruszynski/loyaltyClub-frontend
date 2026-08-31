import { describe, it, expect } from 'vitest';
import { extractApiError, getErrorStatus } from './errors';

describe('extractApiError', () => {
  it('prefers the detail field of ProblemDetail', () => {
    const err = { response: { data: { detail: 'Klient nie istnieje', title: 'Not Found' } } };
    expect(extractApiError(err, 'zapasowy')).toBe('Klient nie istnieje');
  });

  it('falls back to title, error and message from the body', () => {
    expect(extractApiError({ response: { data: { title: 'Konflikt' } } }, 'zapasowy')).toBe('Konflikt');
    expect(extractApiError({ response: { data: { error: 'Bad Request' } } }, 'zapasowy')).toBe('Bad Request');
    expect(extractApiError({ response: { data: { message: 'Za mało punktów' } } }, 'zapasowy')).toBe('Za mało punktów');
  });

  it('uses the fallback when the body carries no message', () => {
    expect(extractApiError({ response: { data: {} } }, 'zapasowy')).toBe('zapasowy');
    expect(extractApiError({ response: { data: { detail: '  ' } } }, 'zapasowy')).toBe('zapasowy');
  });

  it('uses the message of a network error', () => {
    expect(extractApiError(new Error('Network Error'), 'zapasowy')).toBe('Network Error');
  });

  it('uses the fallback for anything else', () => {
    expect(extractApiError(null, 'zapasowy')).toBe('zapasowy');
    expect(extractApiError('coś', 'zapasowy')).toBe('zapasowy');
    expect(extractApiError(undefined, 'zapasowy')).toBe('zapasowy');
  });
});

describe('getErrorStatus', () => {
  it('reads the HTTP status of the response', () => {
    expect(getErrorStatus({ response: { status: 404 } })).toBe(404);
  });

  it('returns null when there is no response', () => {
    expect(getErrorStatus(new Error('boom'))).toBeNull();
    expect(getErrorStatus(null)).toBeNull();
  });
});
