import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface Order {
  id: string | number;
  customerName: string;
  status: string;
  cancellationReason?: string | null;
  totalPrice: number;
  createdAt: string;
}

export const OrderStatus: React.FC = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const queryParams = new URLSearchParams(window.location.search);
  const orderId = queryParams.get('id');

  const fetchStatus = async () => {
    if (!orderId) {
      setError('Keine Bestell-ID gefunden.');
      setLoading(false);
      return;
    }

    try {
      // 1. Nutze die zentrale Axios-Logik
      const orders = await apiService.fetchOrdersSafe();
      
      // 2. Deine spezifische UI-Suchlogik bleibt genau so, wie sie war
      const foundOrder = orders.find(o => String(o.id) === String(orderId));
      
      if (foundOrder) {
        setOrder(foundOrder);
        setError(null);
        calculateTimeLeft(foundOrder.createdAt, foundOrder.status);
      } else {
        setError('Bestellung nicht gefunden.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeLeft = (createdAtStr: string, status: string) => {
    if (status === 'storniert' || status === 'cancelled') {
      setTimeLeft('Abgebrochen 🛑');
      return;
    }

    if (status === 'erledigt' || status === 'done' || status === 'completed') {
      setTimeLeft('Geliefert! 🎉');
      return;
    }

    const orderTime = new Date(createdAtStr).getTime();
    const deliveryTime = orderTime + 30 * 60 * 1000; 
    const now = new Date().getTime();
    const difference = deliveryTime - now;

    if (difference <= 0) {
      if (status === 'offen' || status === 'open') {
        setTimeLeft('Wird gleich vorbereitet... 🍕');
      } else if (status === 'zubereitung' || status === 'cooking') {
        setTimeLeft('Frisch im Ofen! 🔥');
      } else {
        setTimeLeft('Gleich bei dir! 🚀');
      }
    } else {
      const minutes = Math.ceil(difference / (1000 * 60));
      setTimeLeft(`ca. ${minutes} Minuten`);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    const timeInterval = setInterval(() => {
      calculateTimeLeft(order.createdAt, order.status);
    }, 10000);
    return () => clearInterval(timeInterval);
  }, [order]);

  if (loading) return <div style={{ color: '#fff', padding: '20px', backgroundColor: '#1a202c', minHeight: '100vh' }}>Status wird geladen...</div>;
  if (error || !order) return <div style={{ color: '#ef4444', padding: '20px', backgroundColor: '#1a202c', minHeight: '100vh' }}>❌ {error || 'Fehler'}</div>;

  const getStepStyle = (currentStatus: string, targetStatus: string[], activeColor: string) => {
    const isCancelled = currentStatus === 'storniert' || currentStatus === 'cancelled';
    const isActive = !isCancelled && targetStatus.includes(currentStatus);
    
    return {
      flex: 1,
      padding: '15px',
      backgroundColor: isActive ? activeColor : '#2d3748',
      color: isCancelled ? '#718096' : '#fff',
      textAlign: 'center' as const,
      borderRadius: '8px',
      fontWeight: isActive ? 'bold' as const : 'normal' as const,
      transition: 'all 0.5s ease',
      boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.3)' : 'none',
      opacity: isCancelled ? 0.4 : 1
    };
  };

  const isStatusCancelled = order.status === 'storniert' || order.status === 'cancelled';

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a202c', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#2d3748', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '600px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#f6ad55' }}>🍕 Milano Enterprise Live-Tracker</h2>
        <p style={{ textAlign: 'center', color: '#a0aec0', marginBottom: '30px' }}>Hallo <strong>{order.customerName}</strong>, hier kannst du deine Bestellung live verfolgen!</p>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <div style={{ flex: 1, backgroundColor: '#1a202c', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#a0aec0' }}>Bestellnummer:</span>
            <h3 style={{ margin: '5px 0', fontSize: '14px', wordBreak: 'break-all' }}>#{order.id}</h3>
          </div>
          <div style={{ flex: 1, backgroundColor: '#1a202c', padding: '15px', borderRadius: '8px', textAlign: 'center', border: isStatusCancelled ? '1px solid #ef4444' : '1px solid #f6ad55' }}>
            <span style={{ fontSize: '12px', color: isStatusCancelled ? '#ef4444' : '#f6ad55', fontWeight: 'bold' }}>Status / Lieferzeit:</span>
            <h3 style={{ margin: '5px 0', fontSize: '20px', color: isStatusCancelled ? '#ef4444' : '#fff' }}>{timeLeft}</h3>
          </div>
        </div>

        {/* Status boxes */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <div style={getStepStyle(order.status, ['offen', 'open', 'zubereitung', 'cooking', 'erledigt', 'done', 'completed'], '#ef4444')}>
            📥<br />Eingegangen
          </div>
          <div style={getStepStyle(order.status, ['zubereitung', 'cooking', 'erledigt', 'done', 'completed'], '#f6ad55')}>
            👨‍🍳<br />Im Ofen
          </div>
          <div style={getStepStyle(order.status, ['erledigt', 'done', 'completed'], '#10b981')}>
            📦<br />Fertig!
          </div>
        </div>

        {/* Status-specific information */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '16px', 
          fontWeight: 'bold', 
          padding: '15px', 
          borderRadius: '6px', 
          border: isStatusCancelled ? '1px solid #ef4444' : '1px dashed #4a5568', 
          backgroundColor: isStatusCancelled ? '#742a2a' : 'transparent',
          marginBottom: '30px' 
        }}>
          {(order.status === 'offen' || order.status === 'open') && '⏳ Deine Bestellung ist in der Warteschlange und wird gleich bestätigt.'}
          {(order.status === 'zubereitung' || order.status === 'cooking') && '🔥 Gute Nachrichten! Deine Pizza wird gerade frisch gebacken.'}
          {(order.status === 'erledigt' || order.status === 'done' || order.status === 'completed') && '✅ Guten Appetit! Deine Bestellung ist fertig zubereitet oder bereits auf dem Weg.'}
          
          {isStatusCancelled && (
            <div>
              <span style={{ color: '#fca5a5' }}>🛑 Diese Bestellung wurde storniert.</span>
              {order.cancellationReason && (
                <div style={{ fontStyle: 'italic', fontWeight: 'normal', fontSize: '14px', marginTop: '8px', color: '#fecaca' }}>
                  Grund der Küche: "{order.cancellationReason}"
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => window.location.href = '/'}
            style={{ padding: '12px 24px', backgroundColor: '#4a5568', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#718096'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4a5568'}
          >
            ← Zurück zur Speisekarte
          </button>
        </div>

      </div>
    </div>
  );
};
