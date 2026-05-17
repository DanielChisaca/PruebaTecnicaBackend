import { useState } from 'react';
import { authService } from '../services/api';

export default function Register({ onSwitch }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [documentType, setDocumentType] = useState('CC');
  const [documentId, setDocumentId] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.register({
        username,
        email,
        documentType,
        documentId,
        password,
        phone_number: phone
      });
      setMsg('¡Registro exitoso! Ya puedes iniciar sesión.');
      setTimeout(onSwitch, 2000);
    } catch (err) {
      setMsg('Error al registrar. El usuario, teléfono o correo podrían estar duplicados.');
    }
  };

  return (
    <div className="auth-card">
      <h2>Registro FinTech</h2>
      {msg && <p className={msg.includes('Error') ? "error" : "info"}>{msg}</p>}
      
      <form onSubmit={handleSubmit}>
        
        {/* 🚨 Aquí entra el nuevo Grid mágico */}
        <div className="form-grid">
          <input type="text" placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="email" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} required />
          
          <select value={documentType} onChange={e => setDocumentType(e.target.value)} required>
            <option value="CC">CC</option>
            <option value="CE">CE</option>
            <option value="PP">Pasaporte</option>
          </select>
          <input type="text" placeholder="N° Documento" value={documentId} onChange={e => setDocumentId(e.target.value)} required />
          
          <input type="text" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} required />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        <button type="submit">Crear Cuenta</button>
      </form>
      
      <p onClick={onSwitch} className="switch-link">Volver al Login</p>
    </div>
  );
}