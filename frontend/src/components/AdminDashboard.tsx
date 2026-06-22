import React, { useEffect, useState, useRef } from 'react';

interface OrderPosition {
  id: number;
  name?: string; 
  produktId: number;
  menge: number;
  preisSnapshot: number;
  anmerkung: string | null;
  gewaehlteZutatenIds: number[];
  entfernteZutatenIds: number[];
  zutatenText: string | null;
  product?: {
    id: number;
    name: string;
    beschreibung: string;
  };
}

interface Order {
  id: number;
  kundeName: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  stadt: string;
  telefon: string;
  email: string | null;
  lieferAnmerkung: string | null;
  gesamtPreis: number;
  status: string; 
  bestelltAm: string;
  positionen: OrderPosition[];
}

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'offen' | 'erledigt'>('offen');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false); // NEU: Aktivierungs-State für Ton

  const prevOrdersCount = useRef<number | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3000/orders');
      if (response.ok) {
        const data = await response.json();
        
        // Filtert nur die offenen Bestellungen, um sie für den Sound-Vergleich zu nutzen
        const currentOffenCount = data.filter((o: Order) => o.status === 'offen').length;

        // Sound abspielen, wenn die Anzahl der OFFENEN Bestellungen steigt UND Sound aktiv ist
        if (soundEnabled && prevOrdersCount.current !== null && currentOffenCount > prevOrdersCount.current) {
          playNotificationSound();
        }
        prevOrdersCount.current = currentOffenCount;
        
        setOrders(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
      
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); 
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        gain2.gain.setValueAtTime(0.4, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.2);
      }, 120);
    } catch (e) {
      console.log('Audio fehlgeschlagen:', e);
    }
  };

  // Test-Sound abspielen, damit der User direkt hört, ob es klappt
  const toggleSound = () => {
    if (!soundEnabled) {
      setSoundEnabled(true);
      // Kurzer Test-Piep, damit der Browser die Audio-Rechte freigibt
      setTimeout(() => playNotificationSound(), 100);
    } else {
      setSoundEnabled(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3000/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders();
      } else {
        alert('Fehler beim Aktualisieren der Bestellung.');
      }
    } catch (error) {
      console.error('Verbindungsfehler:', error);
    }
  };

  const handlePrintOrder = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const positionenHtml = order.positionen.map(pos => `
      <div style="border-bottom: 1px dashed #000; padding: 5px 0;">
        <strong>${pos.menge}x ${pos.product?.name || `ID: ${pos.produktId}`}</strong>
        ${pos.anmerkung ? `<br><span style="font-style:italic; font-size:12px;">↳ "${pos.anmerkung}"</span>` : ''}
        ${pos.zutatenText ? `<br><span style="font-size:12px; font-weight:bold;">${pos.zutatenText}</span>` : ''}
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
      <head>
        <title>Küchenbon #${order.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; width: 280px; margin: 10px; padding: 0; font-size: 14px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .hr { border-top: 1px solid #000; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 18px;">MILANO ENTERPRISE</div>
        <div class="center">KÜCHENZETTEL</div>
        <div class="hr"></div>
        <div><strong>BESTELLUNG #${order.id}</strong></div>
        <div>Datum: ${new Date(order.bestelltAm).toLocaleString('de-DE')}</div>
        <div class="hr"></div>
        <div><strong>Kunde:</strong> ${order.kundeName}</div>
        <div><strong>Adresse:</strong><br>${order.strasse} ${order.hausnummer}<br>${order.plz} Leverkusen</div>
        <div><strong>Tel:</strong> ${order.telefon}</div>
        ${order.lieferAnmerkung ? `<div style="margin-top:5px; background:#eee; padding:3px;"><strong>Anmerkung:</strong> ${order.lieferAnmerkung}</div>` : ''}
        <div class="hr"></div>
        <div class="bold">POSITIONEN:</div>
        ${positionenHtml}
        <div class="hr"></div>
        <div class="bold" style="font-size: 16px; text-align: right;">GESAMT: ${Number(order.gesamtPreis).toFixed(2).replace('.', ',')} €</div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); 
    return () => clearInterval(interval);
  }, [soundEnabled]); // Trigger neu setzen, wenn sich soundEnabled ändert

  if (loading) {
    return <div style={{ color: '#fff', padding: '20px' }}>Bestellungen werden geladen...</div>;
  }

  // Filtert die Bestellungen für die Anzeige
  const filteredOrders = orders.filter(o => activeTab === 'offen' ? o.status === 'offen' : o.status === 'erledigt');

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a202c', minHeight: '100vh', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🍕 Milano Enterprise - Küchen-Dashboard</h2>
        
        {/* NEU: Sound-Aktivierungs-Button im Header */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={toggleSound}
            style={{
              padding: '8px 16px',
              backgroundColor: soundEnabled ? '#10b981' : '#4a5568',
              border: 'none',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {soundEnabled ? '🔔 Ton: AN' : '🔕 Ton: AUS (Klicken zum Aktivieren)'}
          </button>

          <button 
            onClick={fetchOrders} 
            style={{ padding: '8px 16px', backgroundColor: '#ef4444', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #2d3748', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('offen')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'offen' ? '#ef4444' : '#2d3748',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Offene Bestellungen ({orders.filter(o => o.status === 'offen').length})
        </button>
        <button
          onClick={() => setActiveTab('erledigt')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'erledigt' ? '#4a5568' : '#2d3748',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Archiv (Erledigt) ({orders.filter(o => o.status === 'erledigt').length})
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <p style={{ color: '#a0aec0', fontSize: '16px' }}>Keine Bestellungen in dieser Ansicht vorhanden. 🎉</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredOrders.map((order) => (
            <div key={order.id} style={{ border: '1px solid #2d3748', borderRadius: '8px', padding: '20px', backgroundColor: '#2d3748' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #4a5568', paddingBottom: '10px', marginBottom: '10px' }}>
                <div>
                  <strong style={{ fontSize: '18px' }}>Bestellung #{order.id}</strong> - {order.kundeName}
                  <br />
                  <span style={{ fontSize: '13px', color: '#a0aec0' }}>
                    {new Date(order.bestelltAm).toLocaleString('de-DE')}
                  </span>
                </div>
                
                {/* Actions & Preis */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                    {Number(order.gesamtPreis).toFixed(2).replace('.', ',')} €
                  </div>

                  <button
                    onClick={() => handlePrintOrder(order)}
                    style={{ padding: '8px 12px', backgroundColor: '#4a5568', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    🖨️ Drucken
                  </button>

                  {activeTab === 'offen' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'erledigt')}
                      style={{ padding: '8px 16px', backgroundColor: '#10b981', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✔ Erledigt
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'offen')}
                      style={{ padding: '8px 16px', backgroundColor: '#3182ce', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ↩ Reaktivieren
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                {/* Lieferadresse */}
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#f6ad55' }}>Lieferadresse</h4>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    {order.strasse} {order.hausnummer}<br />
                    {order.plz} {order.stadt}<br />
                    Tel: {order.telefon}
                    {order.email && <><br />E-Mail: {order.email}</>}
                  </p>
                  {order.lieferAnmerkung && (
                    <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#1a202c', borderRadius: '4px', fontSize: '13px', borderLeft: '3px solid #f6ad55' }}>
                      <strong>Anmerkung:</strong> {order.lieferAnmerkung}
                    </div>
                  )}
                </div>

                {/* Gerichte */}
                <div style={{ flex: '2', minWidth: '300px' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#f6ad55' }}>Positionen</h4>
                  <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '15px' }}>
                    {order.positionen.map((pos) => (
                      <li key={pos.id} style={{ marginBottom: '12px', borderBottom: '1px dashed #4a5568', paddingBottom: '8px' }}>
                        <strong style={{ fontSize: '16px', color: '#fff' }}>{pos.menge}x {pos.product?.name || `Produkt-ID ${pos.produktId}`}</strong> 
                        <span style={{ color: '#a0aec0', fontSize: '14px', marginLeft: '10px' }}>
                          (je {Number(pos.preisSnapshot).toFixed(2).replace('.', ',')} €)
                        </span>
                        
                        {pos.anmerkung && (
                          <div style={{ fontSize: '13px', color: '#cbd5e0', fontStyle: 'italic', marginTop: '2px' }}>
                            ↳ Anmerkung Küche: "{pos.anmerkung}"
                          </div>
                        )}
                        
                        {pos.zutatenText && (
                          <div style={{ fontSize: '13px', color: '#f6ad55', marginTop: '4px', fontWeight: '500' }}>
                            {pos.zutatenText}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};