// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Movements from '../components/Movements';
import { bankService } from '../services/api';
import { useAuth } from '../context/AuthContext';

vi.mock('../services/api', () => ({
  bankService: {
    getBalance: vi.fn(), getMovements: vi.fn(),
    executeTransfer: vi.fn(), getNotifications: vi.fn(),
  },
  authService: { login: vi.fn(), register: vi.fn() },
  default: {},
}));

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

describe('Movements', () => {
  const mockUser = { id: 1, username: 'testuser', phone_number: '3001112233' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  it('muestra estado vacío cuando no hay movimientos', async () => {
    bankService.getMovements.mockResolvedValue({ data: [] });

    render(<Movements refreshTrigger={false} />);

    await waitFor(() => {
      expect(screen.getByText(/no registras transacciones/i)).toBeInTheDocument();
    });
  });

  it('llama getMovements con el id del usuario', async () => {
    bankService.getMovements.mockResolvedValue({ data: [] });

    render(<Movements refreshTrigger={false} />);

    await waitFor(() => {
      expect(bankService.getMovements).toHaveBeenCalledWith(1);
    });
  });

  it('renderiza un egreso cuando el teléfono destino no coincide con el usuario', async () => {
    bankService.getMovements.mockResolvedValue({
      data: [
        {
          id: 1, origin_account_id: 10,
          destination_phone: '3009998877',
          amount: '500.00', type: 'egreso',
          timestamp: '2025-01-15T10:00:00',
        },
      ],
    });

    render(<Movements refreshTrigger={false} />);

    await waitFor(() => {
      expect(screen.getByText(/enviaste a: 3009998877/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/\-\$500\.00/)).toBeInTheDocument();
  });

  it('renderiza un ingreso cuando el teléfono destino coincide con el usuario', async () => {
    bankService.getMovements.mockResolvedValue({
      data: [
        {
          id: 2, origin_account_id: 20,
          destination_phone: '3001112233',
          amount: '100.00', type: 'ingreso',
          timestamp: '2025-01-16T10:00:00',
        },
      ],
    });

    render(<Movements refreshTrigger={false} />);

    await waitFor(() => {
      expect(screen.getByText(/recibiste dinero/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/\+\$100\.00/)).toBeInTheDocument();
  });

  it('renderiza múltiples movimientos correctamente', async () => {
    bankService.getMovements.mockResolvedValue({
      data: [
        {
          id: 1, origin_account_id: 10,
          destination_phone: '3009998877',
          amount: '200.00', type: 'egreso',
          timestamp: '2025-01-15T10:00:00',
        },
        {
          id: 2, origin_account_id: 20,
          destination_phone: '3001112233',
          amount: '50.00', type: 'ingreso',
          timestamp: '2025-01-16T10:00:00',
        },
      ],
    });

    render(<Movements refreshTrigger={false} />);

    await waitFor(() => {
      expect(screen.getByText(/enviaste a/i)).toBeInTheDocument();
      expect(screen.getByText(/recibiste dinero/i)).toBeInTheDocument();
    });
  });

  it('no llama getMovements si el usuario no tiene id', () => {
    useAuth.mockReturnValue({ user: null });

    render(<Movements refreshTrigger={false} />);

    expect(bankService.getMovements).not.toHaveBeenCalled();
  });
});
