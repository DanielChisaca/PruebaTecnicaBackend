// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bankService } from '../services/api';

export default function Movements({ refreshTrigger }) {
  const { user } = useAuth();
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    const fetchMovements = async () => {
      if (!user?.id || user.id === 'null') return;
      
      try {
        const res = await bankService.getMovements(user.id);
        setMovements(res.data);
      } catch (err) {
        console.error("No se pudo cargar el historial.");
      }
    };

    if (user && user.id && user.id !== 'null') {
      fetchMovements();
    }
  }, [user, refreshTrigger]);

  return (
    <div className="module-card">
      <h3>Historial de Movimientos</h3>
      {movements.length === 0 ? (
        <p className="no-data">No registras transacciones aún.</p>
      ) : (
        <ul className="movements-list">
          {movements.map((move) => {
            // Limpieza absoluta de caracteres no numéricos
            const cleanDest = String(move.destination_phone).replace(/[^0-9]/g, '');
            const cleanUserPhone = String(user?.phone_number).replace(/[^0-9]/g, '');
            
            const isIngreso = cleanDest === cleanUserPhone;

            return (
              <li key={move.id} className="movement-item" style={{ border: '1px solid #ffa500', marginBottom: '12px', padding: '10px', borderRadius: '6px' }}>
                <div className="move-info">
                  

                  <span className="dest">
                    {isIngreso ? '📥 Recibiste dinero' : `📤 Enviaste a: ${move.destination_phone}`}
                  </span>
                  <span className="date">{new Date(move.timestamp).toLocaleString()}</span>
                </div>
                
                {/* Asignación de clase y signo (+ / -) según corresponda */}
                <span className={isIngreso ? "move-amount-positive" : "move-amount-negative"}>
                  {isIngreso ? '+' : '-'}${parseFloat(move.amount).toFixed(2)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}