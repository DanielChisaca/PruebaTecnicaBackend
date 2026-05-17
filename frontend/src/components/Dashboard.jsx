import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bankService } from '../services/api';
import Transfer from './Transfer';
import Movements from './Movements';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState(0);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id || user.id === 'null' || user.id === 'undefined') {
        console.log("Petición de balance abortada: Esperando un ID de usuario real.");
        return;
      }

      try {
        console.log(`Enviando ID real a Java para balance: ${user.id}`);
        const res = await bankService.getBalance(user.id);
        setBalance(res.data.balance);
      } catch (err) {
        console.error("Error trayendo saldo (Circuit Breaker Activado en Orquestador)");
      }
    };

    if (user && user.id && user.id !== 'null' && user.id !== 'undefined') {
      fetchBalance();
    }
  }, [user, refresh]);

  return (
    <div className="dashboard-container">
      <header className="dash-header">
        <h1>Bienvenido, {user?.username || 'Usuario'} 🏦</h1>
        <button onClick={logout} className="logout-btn">Cerrar Sesión</button>
      </header>

      <section className="balance-box">
        <h3>Tu Saldo Disponible</h3>
        <p className="amount">${balance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
        <button onClick={() => setRefresh(!refresh)} className="refresh-btn">🔄 Actualizar</button>
      </section>

      <div className="grid-modules">
        <Transfer onTransferSuccess={() => setRefresh(!refresh)} />
        <Movements refreshTrigger={refresh} />
      </div>
    </div>
  );
}