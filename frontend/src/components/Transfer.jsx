import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { bankService } from '../services/api';

export default function Transfer({ onTransferSuccess }) {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const handleTransfer = async (e) => {
    e.preventDefault();
    setStatus('Procesando transacción...');
    try {
      await bankService.executeTransfer(user.id, phone, amount);
      setStatus('✅ ¡Transferencia exitosa!');
      setPhone('');
      setAmount('');
      onTransferSuccess();
    } catch (err) {
      setStatus('❌ Fallo: Fondos insuficientes o número de destino no registrado.');
    }
  };

  return (
    <div className="module-card">
      <h3>Enviar Dinero por Celular</h3>
      <form onSubmit={handleTransfer}>
        <input type="text" placeholder="Número de Celular Destino" value={phone} onChange={e => setPhone(e.target.value)} required />
        <input type="number" placeholder="Monto a Enviar ($)" value={amount} onChange={e => setAmount(e.target.value)} required min="1" step="0.01"/>
        <button type="submit" className="action-btn">Confirmar Envío</button>
      </form>
      {status && <p className="status-msg">{status}</p>}
    </div>
  );
}