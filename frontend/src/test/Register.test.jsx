// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Register from '../components/Register';
import { authService } from '../services/api';

vi.mock('../services/api', () => ({
  authService: { login: vi.fn(), register: vi.fn() },
  bankService: {
    getBalance: vi.fn(), getMovements: vi.fn(),
    executeTransfer: vi.fn(), getNotifications: vi.fn(),
  },
  default: {},
}));

describe('Register', () => {
  const mockOnSwitch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza todos los campos del formulario', () => {
    render(<Register onSwitch={mockOnSwitch} />);
    expect(screen.getByPlaceholderText('Usuario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('N° Documento')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Teléfono')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
  });

  // Timeout de 10s: el componente llama setTimeout(onSwitch, 2000) tras el registro
  it('muestra mensaje de éxito y llama onSwitch tras registro exitoso', async () => {
    authService.register.mockResolvedValue({ data: { message: 'OK' } });

    render(<Register onSwitch={mockOnSwitch} />);
    fireEvent.change(screen.getByPlaceholderText('Usuario'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByPlaceholderText('Correo'), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('N° Documento'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '3001112233' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(await screen.findByText(/registro exitoso/i)).toBeInTheDocument();
    await waitFor(() => expect(mockOnSwitch).toHaveBeenCalled(), { timeout: 3000 });
  }, 10000);

  it('muestra mensaje de error si el registro falla', async () => {
    authService.register.mockRejectedValue(new Error('Conflict'));

    render(<Register onSwitch={mockOnSwitch} />);
    fireEvent.change(screen.getByPlaceholderText('Usuario'), { target: { value: 'dup' } });
    fireEvent.change(screen.getByPlaceholderText('Correo'), { target: { value: 'dup@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('N° Documento'), { target: { value: '000000' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '3001112233' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'anypass' } });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(await screen.findByText(/error al registrar/i)).toBeInTheDocument();
  });

  it('llama authService.register con los datos correctos', async () => {
    authService.register.mockResolvedValue({ data: {} });

    render(<Register onSwitch={mockOnSwitch} />);
    fireEvent.change(screen.getByPlaceholderText('Usuario'), { target: { value: 'myuser' } });
    fireEvent.change(screen.getByPlaceholderText('Correo'), { target: { value: 'my@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('N° Documento'), { target: { value: '987654' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '3009998877' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith(expect.objectContaining({
        username: 'myuser',
        email: 'my@test.com',
        phone_number: '3009998877',
        password: 'secret',
      }));
    });
  });

  it('llama onSwitch al hacer clic en volver al login', () => {
    render(<Register onSwitch={mockOnSwitch} />);
    fireEvent.click(screen.getByText(/volver al login/i));
    expect(mockOnSwitch).toHaveBeenCalled();
  });
});
