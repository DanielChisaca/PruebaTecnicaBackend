// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';

function TestConsumer() {
  const { user, token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="token">{token || 'no-token'}</span>
      <span data-testid="user">{user ? user.username : 'no-user'}</span>
      <button onClick={() => login('test-token', { id: 1, username: 'testuser' })}>Login</button>
      <button onClick={() => login(null, { id: 1, username: 'u' })}>Login Sin Token</button>
      <button onClick={() => login('tok', { username: 'sin-id' })}>Login Sin ID</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('inicia con token y usuario null cuando localStorage está vacío', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('token').textContent).toBe('no-token');
    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });

  it('login guarda token y usuario en estado y localStorage', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('token').textContent).toBe('test-token');
    expect(localStorage.getItem('bank_token')).toBe('test-token');
    expect(JSON.parse(localStorage.getItem('bank_user')).username).toBe('testuser');
  });

  it('login no hace nada si no se provee token', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);

    await act(async () => {
      screen.getByText('Login Sin Token').click();
    });

    expect(screen.getByTestId('token').textContent).toBe('no-token');
  });

  it('login no hace nada si el usuario no tiene id válido', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);

    await act(async () => {
      screen.getByText('Login Sin ID').click();
    });

    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });

  it('inicializa token desde localStorage', () => {
    localStorage.setItem('bank_token', 'stored-token');
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('token').textContent).toBe('stored-token');
  });

  it('inicializa usuario desde localStorage', () => {
    localStorage.setItem('bank_user', JSON.stringify({ id: 2, username: 'saveduser' }));
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('user').textContent).toBe('saveduser');
  });

  it('logout limpia token y usuario del estado y localStorage', async () => {
    localStorage.setItem('bank_token', 'some-token');
    localStorage.setItem('bank_user', JSON.stringify({ id: 1, username: 'u' }));

    render(<AuthProvider><TestConsumer /></AuthProvider>);

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('token').textContent).toBe('no-token');
    expect(screen.getByTestId('user').textContent).toBe('no-user');
    expect(localStorage.getItem('bank_token')).toBeNull();
  });
});
