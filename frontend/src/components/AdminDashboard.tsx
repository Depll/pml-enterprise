import React, { useEffect, useState } from 'react';

interface OrderPosition {
  id: number;
  name?: string; // Falls Name in der Relation oder JSON drin ist
  produktId: number;
  menge: number;
  preisSnapshot: number;
  anmerkung: string | null;
  gewaehlteZutatenIds: number[];
  entfernteZutatenIds: number[];
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
  bestelltAm: string;
  positionen: OrderPosition[];
}

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3000/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Optional: Alle 30 Sekunden automatisch neu laden
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div style={{ color: '#fff', padding: '20px' }}>Bestellungen werden geladen...</div>;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a202c', minHeight: '100vh', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🍕 Milano Enterprise - Küchen-Dashboard</h2>
        <button 
          onClick={fetchOrders} 
          style={{ padding: '8px 16px', backgroundColor: '#ef4444', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Aktualisieren
        </button>
      </div>

      {orders.length === 0 ? (
        <p>Noch keine Bestellungen eingegangen.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order) => (
            <div key={order.id} style={{ border: '1px solid #2d3748', borderRadius: '8px', padding: '20px', backgroundColor: '#2d3748' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #4a5568', paddingBottom: '10px', marginBottom: '10px' }}>
                <div>
                  <strong>Bestellung #{order.id}</strong> - {order.kundeName}
                  <br />
                  <span style={{ fontSize: '13px', color: '#a0aec0' }}>
                    {new Date(order.bestelltAm).toLocaleString('de-DE')}
                  </span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                  {Number(order.gesamtPreis).toFixed(2).replace('.', ',')} €
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
                      <li key={pos.id} style={{ marginBottom: '8px' }}>
                        <strong>{pos.menge}x</strong> Produkt-ID {pos.produktId} ({Number(pos.preisSnapshot).toFixed(2)} €)
                        {pos.anmerkung && <div style={{ fontSize: '13px', color: '#cbd5e0', fontStyle: 'italic' }}>↳ "{pos.anmerkung}"</div>}
                        {(pos.gewaehlteZutatenIds.length > 0) && <div style={{ fontSize: '12px', color: '#48bb78' }}>+ Extras (Zutaten-IDs: {pos.gewaehlteZutatenIds.join(', ')})</div>}
                        {(pos.entfernteZutatenIds.length > 0) && <div style={{ fontSize: '12px', color: '#f56565' }}>- Ohne (Zutaten-IDs: {pos.entfernteZutatenIds.join(', ')})</div>}
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