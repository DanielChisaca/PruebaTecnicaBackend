// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Login from '../components/Login';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

vi.mock('../services/api', () => ({
  authService: { login: vi.fn(), register: vi.fn() },
  bankService: {
    getBalance: vi.fn(), getMovements: vi.fn(),
    executeTransfer: vi.fn(), getNotifications: vi.fn(),
  },
  default: {},
}));

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

describe('Login', () => {
  const mockLogin = vi.fn();
  const mockOnSwitch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  it('renderiza inputs y botón de envío', () => {
    render(<Login onSwitch={mockOnSwitch} />);
    expect(screen.getByPlaceholderText('Usuario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  it('llama authService.login con los datos del formulario', async () => {
    authService.login.mockResolvedValue({
      data: { token: 'jwt', user: { id: 1, username: 'testuser', phone_number: '3001112233' } },
    });

    render(<Login onSwitch={mockOnSwitch} />);
    fireEvent.change(screen.getByPlaceholderText('Usuario'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('testuser', 'pass123');
    });
  });

  it('llama la función login del contexto tras respuesta exitosa', async () => {
    authService.login.mockResolvedValue({
      data: { token: 'jwt-token', user: { id: 5, username: 'testuser', phone_number: '3001112233' } },
    });

    render(<Login onSwitch={mockOnSwitch} />);
    fireEvent.change(screen.getByPlaceholderText('Usuario'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('jwt-token', expect.objectContaining({ id: 5 }));
    });
  });

  it('muestra el error del backend en caso de credenciales incorrectas', async () => {
    authService.login.mockRejectedValue({
      response: { data: { error: 'Credenciales incorrectas' } },
    });

    render(<Login onSwitch={mockOnSwitch} />);
    fireEvent.change(screen.getByPlaceholderText('Usuario'), { target: { value: 'user' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
    });
  });

  it('muestra error genérico ante fallo de red', async () => {
    authService.login.mockRejectedValue(new Error('Network Error'));

    render(<Login onSwitch={mockOnSwitch} />);
    fireEvent.change(screen.getByPlaceholderText('Usuario'), { target: { value: 'user' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    });
  });

  it('llama onSwitch al hacer clic en el enlace de registro', () => {
    render(<Login onSwitch={mockOnSwitch} />);
    fireEvent.click(screen.getByText(/no tienes cuenta/i));
    expect(mockOnSwitch).toHaveBeenCalled();
  });
});
