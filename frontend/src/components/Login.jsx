// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login({ onSwitch }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await authService.login(username, password);
    
      
      if (response.data && response.data.token) {
        const token = response.data.token;
        
        const idDetectado = response.data.user?.id || response.data.id || response.data.userId;
        const usernameDetectado = response.data.user?.username || response.data.username || username;
        
        const phoneDetectado = response.data.user?.phone_number || response.data.phone_number;

        if (!idDetectado) {
          console.error("Error: El backend devolvió token pero no incluyó el ID del usuario.", response.data);
          setError('Error en la estructura de datos del servidor.');
          return;
        }

        const userPayload = {
          id: idDetectado,
          username: usernameDetectado,
          phone_number: phoneDetectado
        };

        login(token, userPayload);
        
      } else {
        setError('El servidor no devolvió los datos de usuario correctos.');
      }
    } catch (err) {
      console.error("Error en la petición de login:", err);
      
      const backendError = err.response?.data?.error;
      
      if (backendError) {
        setError(backendError);
      } else {
        setError('Credenciales inválidas o error de conexión con el Orquestador.');
      }
    }
  };

  return (
    <div className="auth-card">
      <h2>Banca Móvil - Iniciar Sesión</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Usuario" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        <button type="submit">Ingresar Seguro</button>
      </form>
      <p onClick={onSwitch} className="switch-link">¿No tienes cuenta? Regístrate aquí</p>
    </div>
  );
}