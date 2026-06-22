import React, { useEffect, useState } from 'react';

interface Order {
  id: number;
  kundeName: string;
  status: string;
  stornoGrund?: string | null; // NEU: Stornogrund vom Backend empfangen
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
    // NEU: Wenn storniert, gibt es keine verbleibende Lieferzeit
    if (status === 'storniert') {
      setTimeLeft('Abgebrochen 🛑');
      return;
    }

    if (status === 'erledigt') {
      setTimeLeft('Geliefert! 🎉');
      return;
    }

    const bestellZeit = new Date(bestelltAmStr).getTime();
    const lieferZeit = bestellZeit + 30 * 60 * 1000; 
    const jetzt = new Date().getTime();
    const differenz = lieferZeit - jetzt;

    if (differenz <= 0) {
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
    // Wenn storniert ist, grauen wir die Standardbalken aus
    const isCancelled = currentStatus === 'storniert';
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
          <div style={{ flex: 1, backgroundColor: '#1a202c', padding: '15px', borderRadius: '8px', textAlign: 'center', border: order.status === 'storniert' ? '1px solid #ef4444' : '1px solid #f6ad55' }}>
            <span style={{ fontSize: '12px', color: order.status === 'storniert' ? '#ef4444' : '#f6ad55', fontWeight: 'bold' }}>Status / Lieferzeit:</span>
            <h3 style={{ margin: '5px 0', fontSize: '20px', color: order.status === 'storniert' ? '#ef4444' : '#fff' }}>{timeLeft}</h3>
          </div>
        </div>

        {/* Die Statusboxen */}
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

        {/* Informationstext je nach Status */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '16px', 
          fontWeight: 'bold', 
          padding: '15px', 
          borderRadius: '6px', 
          border: order.status === 'storniert' ? '1px solid #ef4444' : '1px dashed #4a5568', 
          backgroundColor: order.status === 'storniert' ? '#742a2a' : 'transparent',
          marginBottom: '30px' 
        }}>
          {order.status === 'offen' && '⏳ Deine Bestellung ist in der Warteschlange und wird gleich bestätigt.'}
          {order.status === 'zubereitung' && '🔥 Gute Nachrichten! Deine Pizza wird gerade frisch gebacken.'}
          {order.status === 'erledigt' && '✅ Guten Appetit! Deine Bestellung ist fertig zubereitet oder bereits auf dem Weg.'}
          
          {/* NEU: Anzeige für die Stornierung */}
          {order.status === 'storniert' && (
            <div>
              <span style={{ color: '#fca5a5' }}>🛑 Diese Bestellung wurde storniert.</span>
              {order.stornoGrund && (
                <div style={{ fontStyle: 'italic', fontWeight: 'normal', fontSize: '14px', marginTop: '8px', color: '#fecaca' }}>
                  Grund der Küche: "{order.stornoGrund}"
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