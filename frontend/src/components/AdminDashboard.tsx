import React, { useEffect, useState } from 'react';

interface Zutat {
  id: number;
  name: string;
  aufpreis: number;
}

interface Product {
  id: number;
  name: string;
  beschreibung: string;
  preis: number;
  aktiv: boolean; 
  zutaten?: Zutat[];
}

interface Kategorie {
  id: number;
  name: string;
  produkte: Product[];
}

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
  const [kategorien, setKategorien] = useState<Kategorie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // GEÄNDERT: activeTab unterstützt jetzt auch 'zubereitung'
  const [activeTab, setActiveTab] = useState<'offen' | 'zubereitung' | 'erledigt' | 'menu'>('offen');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  const [newProdName, setNewProdName] = useState('');
  const [newProdBeschreibung, setNewProdBeschreibung] = useState('');
  const [newProdPreis, setNewProdPreis] = useState('');
  const [newProdKategorieId, setNewProdKategorieId] = useState<number | ''>('');

  const [newZutatNames, setNewZutatNames] = useState<Record<number, string>>({});
  const [newZutatPrices, setNewZutatPrices] = useState<Record<number, string>>({});

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3000/orders');
      if (response.ok) {
        const data = await response.json();
        const currentOffenCount = data.filter((o: Order) => o.status === 'offen').length;

        setOrders((prevOrders) => {
          const prevOffenCount = prevOrders.filter((o) => o.status === 'offen').length;
          if (soundEnabled && prevOrders.length > 0 && currentOffenCount > prevOffenCount) {
            playNotificationSound();
          }
          return data;
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const response = await fetch('http://localhost:3000/menu');
      if (response.ok) {
        const data = await response.json();
        setKategorien(data);
        if (data.length > 0 && newProdKategorieId === '') {
          setNewProdKategorieId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Speisekarte:', error);
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

  const toggleSound = () => {
    if (!soundEnabled) {
      setSoundEnabled(true);
      setTimeout(() => playNotificationSound(), 100);
    } else {
      setSoundEnabled(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3000/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) fetchOrders();
    } catch (error) {
      console.error('Verbindungsfehler:', error);
    }
  };

  const handleUpdateProduct = async (id: number, updatedData: Partial<Product>) => {
    try {
      const response = await fetch(`http://localhost:3000/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (response.ok) fetchMenu();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateZutat = async (id: number, updatedData: { name?: string; aufpreis?: number }) => {
    try {
      const response = await fetch(`http://localhost:3000/menu/zutat/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (response.ok) fetchMenu();
    } catch (error) {
      console.error('Fehler beim Update der Zutat:', error);
    }
  };

  const handleAddZutat = async (produktId: number) => {
    const name = newZutatNames[produktId];
    const preisStr = newZutatPrices[produktId] || '0.00';

    if (!name) {
      alert('Bitte gib einen Namen für das Extra ein!');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/menu/${produktId}/zutat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          preis: parseFloat(preisStr.replace(',', '.'))
        }),
      });

      if (response.ok) {
        setNewZutatNames(prev => ({ ...prev, [produktId]: '' }));
        setNewZutatPrices(prev => ({ ...prev, [produktId]: '' }));
        fetchMenu();
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Zutat:', error);
    }
  };

  const handleDeleteZutat = async (id: number) => {
    if (!window.confirm('Möchtest du dieses Extra wirklich löschen?')) return;
    try {
      const response = await fetch(`http://localhost:3000/menu/zutat/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) fetchMenu();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Möchtest du dieses Gericht wirklich von der Karte löschen?')) return;
    try {
      const response = await fetch(`http://localhost:3000/menu/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) fetchMenu();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPreis || !newProdKategorieId) {
      alert('Bitte Name, Preis und Kategorie ausfüllen!');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProdName,
          beschreibung: newProdBeschreibung,
          preis: parseFloat(newProdPreis.replace(',', '.')),
          kategorieId: Number(newProdKategorieId),
          aktiv: true
        }),
      });

      if (response.ok) {
        setNewProdName('');
        setNewProdBeschreibung('');
        setNewProdPreis('');
        fetchMenu();
      }
    } catch (error) {
      console.error(error);
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
    fetchMenu();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); 
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const totalUmsatz = orders.reduce((sum, o) => sum + Number(o.gesamtPreis), 0);
  const totalGerichte = orders.reduce((sum, o) => sum + o.positionen.reduce((pSum, p) => pSum + p.menge, 0), 0);
  const avgBestellwert = orders.length > 0 ? totalUmsatz / orders.length : 0;

  if (loading) {
    return <div style={{ color: '#fff', padding: '20px' }}>Bestellungen werden geladen...</div>;
  }

  // GEÄNDERT: Filtert die Liste passend zum ausgewählten activeTab
  const filteredOrders = orders.filter(o => o.status === activeTab);

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a202c', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🍕 Milano Enterprise - Küchen-Dashboard</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={toggleSound}
            style={{ padding: '8px 16px', backgroundColor: soundEnabled ? '#10b981' : '#4a5568', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {soundEnabled ? '🔔 Ton: AN' : '🔕 Ton: AUS (Aktivieren)'}
          </button>
          <button onClick={() => { fetchOrders(); fetchMenu(); }} style={{ padding: '8px 16px', backgroundColor: '#ef4444', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Aktualisieren
          </button>
        </div>
      </div>

      {/* KPI Leiste */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px', backgroundColor: '#2d3748', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '13px', color: '#a0aec0' }}>Gesamtumsatz</span>
          <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', color: '#10b981' }}>{totalUmsatz.toFixed(2).replace('.', ',')} €</h3>
        </div>
        <div style={{ flex: '1', minWidth: '200px', backgroundColor: '#2d3748', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3182ce' }}>
          <span style={{ fontSize: '13px', color: '#a0aec0' }}>Verkaufte Portionen</span>
          <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', color: '#3182ce' }}>{totalGerichte}x Gerichte</h3>
        </div>
        <div style={{ flex: '1', minWidth: '200px', backgroundColor: '#2d3748', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #f6ad55' }}>
          <span style={{ fontSize: '13px', color: '#a0aec0' }}>Ø Bestellwert</span>
          <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', color: '#f6ad55' }}>{avgBestellwert.toFixed(2).replace('.', ',')} €</h3>
        </div>
      </div>

      {/* GEÄNDERT: Tabs Layout mit neuem "Zubereitung"-Reiter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #2d3748', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('offen')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'offen' ? '#ef4444' : '#2d3748', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Neue Bestellungen ({orders.filter(o => o.status === 'offen').length})
        </button>
        <button onClick={() => setActiveTab('zubereitung')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'zubereitung' ? '#f6ad55' : '#2d3748', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          ⏳ In Zubereitung ({orders.filter(o => o.status === 'zubereitung').length})
        </button>
        <button onClick={() => setActiveTab('erledigt')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'erledigt' ? '#4a5568' : '#2d3748', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Archiv (Erledigt) ({orders.filter(o => o.status === 'erledigt').length})
        </button>
        <button onClick={() => setActiveTab('menu')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'menu' ? '#3182ce' : '#2d3748', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          📖 Speisekarte verwalten
        </button>
      </div>

      {/* --- BESTELLUNGEN TABS --- */}
      {activeTab !== 'menu' && (
        filteredOrders.length === 0 ? (
          <p style={{ color: '#a0aec0', fontSize: '16px' }}>Keine Bestellungen in dieser Kategorie. 🎉</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredOrders.map((order) => (
              <div key={order.id} style={{ border: '1px solid #2d3748', borderRadius: '8px', padding: '20px', backgroundColor: '#2d3748' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #4a5568', paddingBottom: '10px', marginBottom: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '18px' }}>Bestellung #{order.id}</strong> - {order.kundeName}
                    <br /><span style={{ fontSize: '13px', color: '#a0aec0' }}>{new Date(order.bestelltAm).toLocaleString('de-DE')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{Number(order.gesamtPreis).toFixed(2).replace('.', ',')} €</div>
                    <button onClick={() => handlePrintOrder(order)} style={{ padding: '8px 12px', backgroundColor: '#4a5568', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>🖨️</button>
                    
                    {/* GEÄNDERT: Dynamischer Aktions-Button je nach derzeitigem Status */}
                    {order.status === 'offen' && (
                      <button onClick={() => handleUpdateStatus(order.id, 'zubereitung')} style={{ padding: '8px 16px', backgroundColor: '#f6ad55', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        👨‍🍳 In den Ofen
                      </button>
                    )}
                    {order.status === 'zubereitung' && (
                      <button onClick={() => handleUpdateStatus(order.id, 'erledigt')} style={{ padding: '8px 16px', backgroundColor: '#10b981', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        ✔ Fertig / Ausgeliefert
                      </button>
                    )}
                    {order.status === 'erledigt' && (
                      <button onClick={() => handleUpdateStatus(order.id, 'zubereitung')} style={{ padding: '8px 16px', backgroundColor: '#3182ce', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        ↩ Reaktivieren
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#f6ad55' }}>Adresse</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>{order.strasse} {order.hausnummer}<br />{order.plz} {order.stadt}<br />Tel: {order.telefon}</p>
                  </div>
                  <div style={{ flex: '2', minWidth: '300px' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#f6ad55' }}>Gerichte</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      {order.positionen.map((pos) => (
                        <li key={pos.id} style={{ marginBottom: '8px' }}>
                          <strong>{pos.menge}x {pos.product?.name || `ID ${pos.produktId}`}</strong> ({Number(pos.preisSnapshot).toFixed(2)} €)
                          {pos.anmerkung && <div style={{ fontSize: '13px', color: '#cbd5e0' }}>↳ "{pos.anmerkung}"</div>}
                          {pos.zutatenText && <div style={{ fontSize: '13px', color: '#f6ad55' }}>{pos.zutatenText}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* --- SPEISEKARTEN VERWALTUNG TAB --- */}
      {activeTab === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ backgroundColor: '#2d3748', padding: '20px', borderRadius: '8px', border: '1px solid #3182ce' }}>
            <h3 style={{ color: '#3182ce', margin: '0 0 15px 0' }}>➕ Neues Gericht hinzufügen</h3>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1', minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#a0aec0' }}>Kategorie</label>
                <select 
                  value={newProdKategorieId} 
                  onChange={(e) => setNewProdKategorieId(Number(e.target.value))}
                  style={{ width: '100%', backgroundColor: '#1a202c', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #4a5568' }}
                >
                  {kategorien.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>
              <div style={{ flex: '2', minWidth: '180px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#a0aec0' }}>Name</label>
                <input type="text" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Pizza Tonno" style={{ width: '100%', backgroundColor: '#1a202c', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #4a5568' }} />
              </div>
              <div style={{ flex: '2', minWidth: '180px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#a0aec0' }}>Beschreibung</label>
                <input type="text" value={newProdBeschreibung} onChange={(e) => setNewProdBeschreibung(e.target.value)} placeholder="mit Thunfisch" style={{ width: '100%', backgroundColor: '#1a202c', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #4a5568' }} />
              </div>
              <div style={{ flex: '1', minWidth: '80px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#a0aec0' }}>Preis (€)</label>
                <input type="text" value={newProdPreis} onChange={(e) => setNewProdPreis(e.target.value)} placeholder="8.50" style={{ width: '100%', backgroundColor: '#1a202c', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #4a5568' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', height: '38px' }}>
                Hinzufügen
              </button>
            </form>
          </div>

          {kategorien.map((kat) => (
            <div key={kat.id} style={{ backgroundColor: '#2d3748', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ color: '#f6ad55', borderBottom: '2px solid #4a5568', paddingBottom: '5px', margin: '0 0 15px 0' }}>{kat.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {kat.produkte.map((prod) => (
                  <div 
                    key={prod.id} 
                    style={{ 
                      backgroundColor: '#1a202c', 
                      padding: '15px', 
                      borderRadius: '6px', 
                      opacity: prod.aktiv === false ? 0.6 : 1, 
                      borderLeft: prod.aktiv === false ? '4px solid #ef4444' : '4px solid #10b981'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '15px', flex: '1', minWidth: '300px' }}>
                        <input 
                          type="text" 
                          defaultValue={prod.name} 
                          onBlur={(e) => handleUpdateProduct(prod.id, { name: e.target.value })}
                          style={{ backgroundColor: '#2d3748', color: '#fff', border: '1px solid #4a5568', padding: '6px', borderRadius: '4px', fontWeight: 'bold', width: '150px' }}
                        />
                        <input 
                          type="text" 
                          defaultValue={prod.beschreibung || ''} 
                          onBlur={(e) => handleUpdateProduct(prod.id, { beschreibung: e.target.value })}
                          placeholder="Keine Beschreibung"
                          style={{ backgroundColor: '#2d3748', color: '#fff', border: '1px solid #4a5568', padding: '6px', borderRadius: '4px', flex: '1' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button
                          onClick={() => handleUpdateProduct(prod.id, { aktiv: !prod.aktiv })}
                          style={{
                            backgroundColor: prod.aktiv === false ? '#ef4444' : '#4a5568',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 'bold'
                          }}
                        >
                          {prod.aktiv === false ? '🔴 Ausverkauft' : '🟢 Verfügbar'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input 
                            type="text" 
                            defaultValue={Number(prod.preis).toFixed(2)} 
                            onBlur={(e) => handleUpdateProduct(prod.id, { preis: parseFloat(e.target.value.replace(',', '.')) })}
                            style={{ backgroundColor: '#2d3748', color: '#10b981', border: '1px solid #4a5568', padding: '6px', borderRadius: '4px', width: '70px', fontWeight: 'bold', textAlign: 'right' }}
                          />
                          <span style={{ color: '#10b981', fontWeight: 'bold' }}>€</span>
                        </div>

                        <button 
                          onClick={() => handleDeleteProduct(prod.id)}
                          style={{ backgroundColor: '#718096', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#2d3748', borderRadius: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#f6ad55', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                        🌶️ Extras / Zutaten für dieses Gericht bearbeiten:
                      </span>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '12px' }}>
                        {prod.zutaten && prod.zutaten.map((zutat) => (
                          <div 
                            key={zutat.id} 
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#1a202c', padding: '4px 8px', borderRadius: '4px', border: '1px solid #4a5568' }}
                          >
                            <input 
                              type="text"
                              defaultValue={zutat.name}
                              onBlur={(e) => handleUpdateZutat(zutat.id, { name: e.target.value })}
                              style={{ backgroundColor: 'transparent', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 'bold', width: '100px' }}
                            />
                            <input 
                              type="text"
                              defaultValue={Number(zutat.aufpreis).toFixed(2)}
                              onBlur={(e) => handleUpdateZutat(zutat.id, { aufpreis: parseFloat(e.target.value.replace(',', '.')) })}
                              style={{ backgroundColor: '#2d3748', color: '#f6ad55', border: '1px solid #4a5568', borderRadius: '3px', fontSize: '12px', width: '50px', textAlign: 'right', padding: '2px' }}
                            />
                            <span style={{ color: '#f6ad55', fontSize: '12px', marginRight: '5px' }}>€</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteZutat(zutat.id)}
                              style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '0 2px' }}
                              title="Extra permanent löschen"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                        {(!prod.zutaten || prod.zutaten.length === 0) && (
                          <span style={{ fontSize: '13px', color: '#a0aec0', fontStyle: 'italic' }}>Noch keine Extras für dieses Gericht.</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid #4a5568', paddingTop: '10px' }}>
                        <input 
                          type="text" 
                          placeholder="Zutat-Name (z.B. Extra Käse)" 
                          value={newZutatNames[prod.id] || ''}
                          onChange={(e) => setNewZutatNames(prev => ({ ...prev, [prod.id]: e.target.value }))}
                          style={{ backgroundColor: '#1a202c', color: '#fff', border: '1px solid #4a5568', padding: '5px 10px', borderRadius: '4px', fontSize: '13px', flex: '1', maxWidth: '200px' }}
                        />
                        <input 
                          type="text" 
                          placeholder="Aufpreis (z.B. 1.50)" 
                          value={newZutatPrices[prod.id] || ''}
                          onChange={(e) => setNewZutatPrices(prev => ({ ...prev, [prod.id]: e.target.value }))}
                          style={{ backgroundColor: '#1a202c', color: '#f6ad55', border: '1px solid #4a5568', padding: '5px 10px', borderRadius: '4px', fontSize: '13px', width: '120px' }}
                        />
                        <button 
                          type="button"
                          onClick={() => handleAddZutat(prod.id)}
                          style={{ backgroundColor: '#3182ce', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                        >
                          ➕ Extra hinzufügen
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};