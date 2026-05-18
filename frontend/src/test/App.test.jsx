// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../App';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

vi.mock('../components/Login', () => ({
  default: ({ onSwitch }) => (
    <div>
      <span>Pantalla de Login</span>
      <button onClick={onSwitch}>Ir a Registro</button>
    </div>
  ),
}));

vi.mock('../components/Register', () => ({
  default: ({ onSwitch }) => (
    <div>
      <span>Pantalla de Registro</span>
      <button onClick={onSwitch}>Volver al Login</button>
    </div>
  ),
}));

vi.mock('../components/Dashboard', () => ({
  default: () => <div>Pantalla Dashboard</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra Login cuando el usuario no está autenticado', () => {
    useAuth.mockReturnValue({ token: null });
    render(<App />);
    expect(screen.getByText('Pantalla de Login')).toBeInTheDocument();
  });

  it('muestra Dashboard cuando el usuario está autenticado', () => {
    useAuth.mockReturnValue({ token: 'valid-jwt-token' });
    render(<App />);
    expect(screen.getByText('Pantalla Dashboard')).toBeInTheDocument();
  });

  it('cambia a Register al hacer clic en el enlace desde Login', () => {
    useAuth.mockReturnValue({ token: null });
    render(<App />);
    fireEvent.click(screen.getByText('Ir a Registro'));
    expect(screen.getByText('Pantalla de Registro')).toBeInTheDocument();
  });

  it('regresa a Login al hacer clic en volver desde Register', () => {
    useAuth.mockReturnValue({ token: null });
    render(<App />);
    fireEvent.click(screen.getByText('Ir a Registro'));
    fireEvent.click(screen.getByText('Volver al Login'));
    expect(screen.getByText('Pantalla de Login')).toBeInTheDocument();
  });
});
