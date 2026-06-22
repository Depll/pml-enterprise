import React, { useEffect, useState } from 'react';

interface Order {
  id: number;
  kundeName: string;
  status: string;
  gesamtPreis: number;
  bestelltAm: string; 
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
      const response = await fetch('http://localhost:3000/orders');
      if (response.ok) {
        const orders: Order[] = await response.json();
        const foundOrder = orders.find(o => o.id === Number(orderId));
        
        if (foundOrder) {
          setOrder(foundOrder);
          setError(null);
          calculateTimeLeft(foundOrder.bestelltAm, foundOrder.status);
        } else {
          setError('Bestellung nicht gefunden.');
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden des Status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Berechnet die verbleibende Lieferzeit (30 Min Lieferzeit standardmäßig)
  const calculateTimeLeft = (bestelltAmStr: string, status: string) => {
    if (status === 'erledigt') {
      setTimeLeft('Geliefert! 🎉');
      return;
    }

    const bestellZeit = new Date(bestelltAmStr).getTime();
    const lieferZeit = bestellZeit + 30 * 60 * 1000; // 30 Minuten in Millisekunden
    const jetzt = new Date().getTime();
    const differenz = lieferZeit - jetzt;

    if (differenz <= 0) {
      // GEÄNDERT: Text orientiert sich bei abgelaufener Zeit am tatsächlichen Status
      if (status === 'offen') {
        setTimeLeft('Wird gleich vorbereitet... 🍕');
      } else if (status === 'zubereitung') {
        setTimeLeft('Frisch im Ofen! 🔥');
      } else {
        setTimeLeft('Gleich bei dir! 🚀');
      }
    } else {
      const minuten = Math.ceil(differenz / (1000 * 60));
      setTimeLeft(`ca. ${minuten} Minuten`);
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
      calculateTimeLeft(order.bestelltAm, order.status);
    }, 10000);
    return () => clearInterval(timeInterval);
  }, [order]);

  if (loading) return <div style={{ color: '#fff', padding: '20px', backgroundColor: '#1a202c', minHeight: '100vh' }}>Status wird geladen...</div>;
  if (error || !order) return <div style={{ color: '#ef4444', padding: '20px', backgroundColor: '#1a202c', minHeight: '100vh' }}>❌ {error || 'Fehler'}</div>;

  const getStepStyle = (currentStatus: string, targetStatus: string[], activeColor: string) => {
    const isActive = targetStatus.includes(currentStatus);
    return {
      flex: 1,
      padding: '15px',
      backgroundColor: isActive ? activeColor : '#2d3748',
      color: '#fff',
      textAlign: 'center' as const,
      borderRadius: '8px',
      fontWeight: isActive ? 'bold' as const : 'normal' as const,
      transition: 'all 0.5s ease',
      boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.3)' : 'none'
    };
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a202c', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#2d3748', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '600px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#f6ad55' }}>🍕 Milano Enterprise Live-Tracker</h2>
        <p style={{ textAlign: 'center', color: '#a0aec0', marginBottom: '30px' }}>Hallo <strong>{order.kundeName}</strong>, hier kannst du deine Bestellung live verfolgen!</p>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <div style={{ flex: 1, backgroundColor: '#1a202c', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#a0aec0' }}>Bestellnummer:</span>
            <h3 style={{ margin: '5px 0', fontSize: '20px' }}>#{order.id}</h3>
          </div>
          <div style={{ flex: 1, backgroundColor: '#1a202c', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f6ad55' }}>
            <span style={{ fontSize: '12px', color: '#f6ad55', fontWeight: 'bold' }}>Geschätzte Lieferzeit:</span>
            <h3 style={{ margin: '5px 0', fontSize: '20px', color: '#fff' }}>{timeLeft}</h3>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <div style={getStepStyle(order.status, ['offen', 'zubereitung', 'erledigt'], '#ef4444')}>
            📥<br />Eingegangen
          </div>
          <div style={getStepStyle(order.status, ['zubereitung', 'erledigt'], '#f6ad55')}>
            👨‍🍳<br />Im Ofen
          </div>
          <div style={getStepStyle(order.status, ['erledigt'], '#10b981')}>
            📦<br />Fertig!
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', padding: '15px', borderRadius: '6px', border: '1px dashed #4a5568', marginBottom: '30px' }}>
          {order.status === 'offen' && '⏳ Deine Bestellung ist in der Warteschlange und wird gleich bestätigt.'}
          {order.status === 'zubereitung' && '🔥 Gute Nachrichten! Deine Pizza wird gerade frisch gebacken.'}
          {order.status === 'erledigt' && '✅ Guten Appetit! Deine Bestellung ist fertig zubereitet oder bereits auf dem Weg.'}
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