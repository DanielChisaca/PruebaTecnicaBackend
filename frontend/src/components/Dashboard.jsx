// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bankService } from '../services/api';
import Transfer from './Transfer';
import Movements from './Movements';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [refresh, setRefresh] = useState(false);

  //Efecto existente para el Balance
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
        console.error("Error trayendo saldo (Circuit Breaker Activado)");
      }
    };

    if (user && user.id && user.id !== 'null' && user.id !== 'undefined') {
      fetchBalance();
    }
  }, [user, refresh]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id || user.id === 'null' || user.id === 'undefined') return;
      
      try {
        const res = await bankService.getNotifications(user.id);
        setNotifications(res.data);
      } catch (err) {
        console.error("Error trayendo notificaciones locales", err);
      }
    };

    if (user && user.id && user.id !== 'null' && user.id !== 'undefined') {
      fetchNotifications();
    }
  }, [user, refresh]);

  return (
    <div className="dashboard-container">
      <header className="dash-header">
        <h1>Bienvenido, {user?.username || 'Usuario'} 🏦</h1>
        <button onClick={logout} className="logout-btn">Cerrar Sesión</button>
      </header>

      {/* Caja de Saldo */}
      <section className="balance-box">
        <h3>Tu Saldo Disponible</h3>
        <p className="amount">${balance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
        <button onClick={() => setRefresh(!refresh)} className="refresh-btn">🔄 Actualizar</button>
      </section>

      {notifications.length > 0 && (
        <section className="notifications-box" style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f4f6f9', borderRadius: '8px', borderLeft: '5px solid #0056b3' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🔔 Avisos y Centro de Alertas</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#555', lineHeight: '1.6' }}>
            {notifications.map((alert, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>{alert}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid-modules">
        <Transfer onTransferSuccess={() => setRefresh(!refresh)} />
        <Movements refreshTrigger={refresh} />
      </div>
    </div>
  );
}