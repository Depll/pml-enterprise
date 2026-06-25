import React, { useEffect, useState } from 'react';

// ==========================================
// TYPE DEFINITIONS & INTERFACES
// ==========================================

interface Zutat {
  id: number;
  name: string;
  price: number; 
}

interface Product {
  id: number;
  sku: string;
  name: string;
  description: string; 
  price: number;       
  isActive: boolean;   
  ingredients?: Zutat[]; 
}

interface Kategorie {
  id: number;
  name: string;
  products: Product[]; 
}

interface OrderPosition {
  id: string; // Represented as UUID string in PostgreSQL
  quantity: number;   
  priceSnapshot: number;
  selectedSize: string | null;
  selectedOption: string | null;
  comment: string | null; 
  ingredientsText: string | null;  
  selectedIngredientsIds: number[];
  removedIngredientsIds: number[];  
  product?: {
    id: number;
    name: string;
    description: string; 
  };
  productId: number;
}

interface Order {
  id: string; // Represented as UUID string in PostgreSQL
  customerName: string; 
  street: string;       
  houseNumber: string;  
  postcode: string;     
  city: string;         
  phone: string;        
  email: string | null;
  deliveryNote: string | null; 
  totalPrice: number;   
  status: string; // Matches database status values (e.g., 'open')
  stornoReason: string | null; 
  createdAt: string;    
  positions: OrderPosition[];  
}

export const AdminDashboard: React.FC = () => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [orders, setOrders] = useState<Order[]>([]);
  const [kategorien, setKategorien] = useState<Kategorie[]>([]);
  const [, setLoading] = useState<boolean>(true);
  
  // Tab states aligned with backend entity naming conventions
  const [activeTab, setActiveTab] = useState<'open' | 'zubereitung' | 'erledigt' | 'storniert' | 'menu'>('open');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // Form states for adding new products
  const [newProdName, setNewProdName] = useState('');
  const [newProdBeschreibung, setNewProdBeschreibung] = useState('');
  const [newProdPreis, setNewProdPreis] = useState('');
  const [newProdKategorieId, setNewProdKategorieId] = useState<number | ''>('');

  // Dynamic tracking states for adding ingredients per product ID
  const [newZutatNames, setNewZutatNames] = useState<Record<number, string>>({});
  const [newZutatPrices, setNewZutatPrices] = useState<Record<number, string>>({});

  // ==========================================
  // API DATA FETCHING
  // ==========================================

  /**
   * Fetches all orders from the NestJS backend and handles real-time audio notification flags.
   */
  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3000/orders');
      if (response.ok) {
        const data = await response.json();
        // Fallback guarding to prevent React rendering crashes if data format shifts
        const safeData = Array.isArray(data) ? data : [];
        
        const currentOffenCount = safeData.filter((o: Order) => o.status === 'open').length;

        setOrders((prevOrders) => {
          const prevOffenCount = prevOrders.filter((o) => o.status === 'open').length;
          // Trigger audio if sound is active and a new incoming order hits 'open' state
          if (soundEnabled && prevOrders.length > 0 && currentOffenCount > prevOffenCount) {
            playNotificationSound();
          }
          return safeData;
        });
      }
    } catch (error) {
      console.error('Failed fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches the menu taxonomy (Categories -> Products -> Ingredients) from the database.
   */
  const fetchMenu = async () => {
    try {
      const response = await fetch('http://localhost:3000/menu');
      if (response.ok) {
        const data = await response.json();
        const safeData = Array.isArray(data) ? data : [];
        setKategorien(safeData);
        // Pre-select the first available category inside the dropdown form
        if (safeData.length > 0 && newProdKategorieId === '') {
          setNewProdKategorieId(safeData[0].id);
        }
      }
    } catch (error) {
      console.error('Failed fetching menu structure:', error);
    }
  };

  // ==========================================
  // SYSTEM AUDIO & NOTIFICATIONS
  // ==========================================

  /**
   * Programmatically generates a notification chime using the browser's native Web Audio API.
   */
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
      console.warn('Audio contextual playback failed or blocked by browser policy:', e);
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

  // ==========================================
  // ORDER MUTATION HANDLERS
  // ==========================================

  /**
   * Updates an order workflow phase (e.g., transitions to 'zubereitung', 'erledigt').
   */
  const handleUpdateStatus = async (orderId: string, newStatus: string, cancellationReason?: string) => {
    try {
      const response = await fetch(`http://localhost:3000/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, stornoReason: cancellationReason || undefined }),
      });
      if (response.ok) fetchOrders();
    } catch (error) {
      console.error('Network error during status transition:', error);
    }
  };

  /**
   * Prompts user input for cancellation rationale before finalizing status mutation.
   */
  const handleCancelOrder = (orderId: string) => {
    const grund = window.prompt('Please enter a cancellation reason (visible to the client):');
    if (grund === null) return; 
    if (!grund.trim()) {
      alert('A valid reason is required to cancel an order!');
      return;
    }
    handleUpdateStatus(orderId, 'storniert', grund);
  };

  // ==========================================
  // MENU MUTATION HANDLERS
  // ==========================================

  /**
   * Updates core properties of a menu item (e.g., description modifications or toggling availability).
   */
  const handleUpdateProduct = async (id: number, updatedData: Partial<Product>) => {
    try {
      const response = await fetch(`http://localhost:3000/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (response.ok) fetchMenu();
    } catch (error) {
      console.error('Failed mutating menu product entries:', error);
    }
  };

  /**
   * Updates values for a sub-allocated recipe extra.
   */
  const handleUpdateZutat = async (id: number, updatedData: { name?: string; price?: number }) => {
    try {
      const response = await fetch(`http://localhost:3000/menu/ingredient/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (response.ok) fetchMenu();
    } catch (error) {
      console.error('Failed modifying target extra asset:', error);
    }
  };

  /**
   * Spawns a new ingredient option linked directly to a product entity ID.
   */
  const handleAddZutat = async (productId: number) => {
    const name = newZutatNames[productId];
    const preisStr = newZutatPrices[productId] || '0.00';

    if (!name) {
      alert('Please fill out the name field for this extra option!');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/menu/${productId}/ingredient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          price: parseFloat(preisStr.replace(',', '.'))
        }),
      });

      if (response.ok) {
        setNewZutatNames(prev => ({ ...prev, [productId]: '' }));
        setNewZutatPrices(prev => ({ ...prev, [productId]: '' }));
        fetchMenu();
      }
    } catch (error) {
      console.error('Failed appending new ingredient dependency:', error);
    }
  };

  const handleDeleteZutat = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this item extra?')) return;
    try {
      const response = await fetch('http://localhost:3000/menu/ingredient/' + id, {
        method: 'DELETE',
      });
      if (response.ok) fetchMenu();
    } catch (error) {
      console.error('Deletion error on target extra asset:', error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this dish from the menu layout?')) return;
    try {
      const response = await fetch('http://localhost:3000/menu/' + id, {
        method: 'DELETE',
      });
      if (response.ok) fetchMenu();
    } catch (error) {
      console.error('Deletion query failed on core product resource:', error);
    }
  };

  /**
   * Dispatches form fields to persist a new dish profile inside the database records.
   * Leverages explicit structural validation parsing for backend data transfer objects (DTO).
   */
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPreis || !newProdKategorieId) {
      alert('Bitte Name, Preis und Kategorie ausfüllen!');
      return;
    }

    const generatedSku = `PROD-${Date.now()}`;

    try {
      const response = await fetch('http://localhost:3000/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: generatedSku,
          name: newProdName,
          description: newProdBeschreibung,
          price: parseFloat(newProdPreis.replace(',', '.')),
          categoryId: Number(newProdKategorieId),
          isActive: true
        }),
      });

      if (response.ok) {
        setNewProdName('');
        setNewProdBeschreibung('');
        setNewProdPreis('');
        fetchMenu(); // Sync UI table layouts instantly
      } else {
        // Intercepts and maps explicit DTO/validation errors thrown by NestJS pipes
        const errResult = await response.json();
        alert(`Server-Fehler (400): ${JSON.stringify(errResult.message || errResult)}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ==========================================
  // HARDWARE PRINT RECEIPT ROUTINES
  // ==========================================

  /**
   * Compiles data into an isolated virtual iframe sandbox layout to call the hardware thermal print spooler window.
   */
  const handlePrintOrder = (order: Order) => {
    const oldFrame = document.getElementById('print-iframe-container');
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'print-iframe-container';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const positionenHtml = order.positions?.map(pos => `
      <div style="border-bottom: 1px dashed #000; padding: 5px 0;">
        <strong>${pos.quantity}x ${pos.product?.name || `ID: ${pos.productId}`}</strong>
        ${pos.comment ? `<br><span style="font-style:italic; font-size:12px;">↳ "${pos.comment}"</span>` : ''}
        ${pos.ingredientsText ? `<br><span style="font-size:12px; font-weight:bold;">${pos.ingredientsText}</span>` : ''}
      </div>
    `).join('') || '';

    doc.write(`
      <html>
      <head>
        <title>Küchenbon #${order.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; width: 280px; margin: 10px; padding: 0; font-size: 14px; color: #000; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .hr { border-top: 1px solid #000; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 18px;">MILANO ENTERPRISE</div>
        <div class="center">KÜCHENZETTEL</div>
        <div class="hr"></div>
        <div><strong>BESTELLUNG #${order.id.substring(0, 8)}</strong></div>
        <div>Datum: ${new Date(order.createdAt).toLocaleString('de-DE')}</div>
        <div class="hr"></div>
        <div><strong>Kunde:</strong> ${order.customerName}</div>
        <div><strong>Adresse:</strong><br>${order.street} ${order.houseNumber}<br>${order.postcode} Leverkusen</div>
        <div><strong>Tel:</strong> ${order.phone}</div>
        ${order.deliveryNote ? `<div style="margin-top:5px; background:#eee; padding:3px;"><strong>Anmerkung:</strong> ${order.deliveryNote}</div>` : ''}
        <div class="hr"></div>
        <div class="bold">POSITIONEN:</div>
        ${positionenHtml}
        <div class="hr"></div>
        <div class="bold" style="font-size: 16px; text-align: right;">GESAMT: ${Number(order.totalPrice).toFixed(2).replace('.', ',')} €</div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  };

  // ==========================================
  // REAL-TIME POLLING LIFECYCLE HOOK
  // ==========================================
  useEffect(() => {
    fetchOrders();
    fetchMenu();
    // 5-second asynchronous polling layer to mirror real-time database updates
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); 
    return () => clearInterval(interval);
  }, [soundEnabled]);

  // ==========================================
  // ANALYTICS & STATISTICAL KPI CALCULATIONS
  // ==========================================
  const activeOrdersOnly = orders.filter(o => o.status !== 'storniert');
  const totalUmsatz = activeOrdersOnly.reduce((sum, o) => sum + Number(o.totalPrice), 0);
  const totalGerichte = activeOrdersOnly.reduce((sum, o) => sum + (o.positions?.reduce((pSum, p) => pSum + p.quantity, 0) || 0), 0);
  const avgBestellwert = activeOrdersOnly.length > 0 ? totalUmsatz / activeOrdersOnly.length : 0;

  const filteredOrders = orders.filter(o => o.status === activeTab);

  // ==========================================
  // RENDER INTERFACE UI
  // ==========================================
  return (
    <div style={{ padding: '20px', backgroundColor: '#1a202c', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* Header Controls */}
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

      {/* KPI Performance Bar */}
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

      {/* Tab Controls Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #2d3748', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('open')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'open' ? '#ef4444' : '#2d3748', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Neue Bestellungen ({orders.filter(o => o.status === 'open').length})
        </button>
        <button onClick={() => setActiveTab('zubereitung')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'zubereitung' ? '#f6ad55' : '#2d3748', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          ⏳ In Zubereitung ({orders.filter(o => o.status === 'zubereitung').length})
        </button>
        <button onClick={() => setActiveTab('erledigt')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'erledigt' ? '#4a5568' : '#2d3748', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Archiv (Erledigt) ({orders.filter(o => o.status === 'erledigt').length})
        </button>
        <button onClick={() => setActiveTab('storniert')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'storniert' ? '#718096' : '#2d3748', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          ❌ Storniert ({orders.filter(o => o.status === 'storniert').length})
        </button>
        <button onClick={() => setActiveTab('menu')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'menu' ? '#3182ce' : '#2d3748', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          📖 Speisekarte verwalten
        </button>
      </div>

      {/* --- WORKFLOW ORDERS TAB SECTION --- */}
      {activeTab !== 'menu' && (
        filteredOrders.length === 0 ? (
          <p style={{ color: '#a0aec0', fontSize: '16px' }}>Keine Bestellungen in dieser Kategorie. 🎉</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredOrders.map((order) => (
              <div key={order.id} style={{ border: '1px solid #2d3748', borderRadius: '8px', padding: '20px', backgroundColor: '#2d3748' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #4a5568', paddingBottom: '10px', marginBottom: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '18px' }}>Bestellung #{order.id.substring(0, 8)}</strong> - {order.customerName}
                    <br /><span style={{ fontSize: '13px', color: '#a0aec0' }}>{new Date(order.createdAt).toLocaleString('de-DE')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{Number(order.totalPrice).toFixed(2).replace('.', ',')} €</div>
                    <button onClick={() => handlePrintOrder(order)} style={{ padding: '8px 12px', backgroundColor: '#4a5568', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>🖨️</button>
                    
                    {order.status === 'open' && (
                      <>
                        <button onClick={() => handleUpdateStatus(order.id, 'zubereitung')} style={{ padding: '8px 16px', backgroundColor: '#f6ad55', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                          👨‍🍳 In den Ofen
                        </button>
                        <button onClick={() => handleCancelOrder(order.id)} style={{ padding: '8px 16px', backgroundColor: '#e53e3e', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                          ❌ Stornieren
                        </button>
                      </>
                    )}
                    {order.status === 'zubereitung' && (
                      <>
                        <button onClick={() => handleUpdateStatus(order.id, 'erledigt')} style={{ padding: '8px 16px', backgroundColor: '#10b981', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                          ✔ Fertig / Ausgeliefert
                        </button>
                        <button onClick={() => handleCancelOrder(order.id)} style={{ padding: '8px 16px', backgroundColor: '#e53e3e', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                          ❌ Stornieren
                        </button>
                      </>
                    )}
                    {(order.status === 'erledigt' || order.status === 'storniert') && (
                      <button onClick={() => handleUpdateStatus(order.id, 'zubereitung')} style={{ padding: '8px 16px', backgroundColor: '#3182ce', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        ↩ Reaktivieren
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#f6ad55' }}>Adresse</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>{order.street} {order.houseNumber}<br />{order.postcode} {order.city}<br />Tel: {order.phone}</p>
                    
                    {order.stornoReason && (
                      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#742a2a', borderLeft: '4px solid #e53e3e', borderRadius: '4px' }}>
                        <strong style={{ fontSize: '13px', color: '#feb2b2' }}>Stornogrund:</strong>
                        <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#fff' }}>"{order.stornoReason}"</p>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: '2', minWidth: '300px' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#f6ad55' }}>Gerichte</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      {order.positions?.map((pos) => (
                        <li key={pos.id} style={{ margin: '0 0 8px 0' }}>
                          <strong>{pos.quantity}x {pos.product?.name || `ID ${pos.productId}`}</strong> ({Number(pos.priceSnapshot).toFixed(2)} €)
                          {pos.comment && <div style={{ fontSize: '13px', color: '#cbd5e0' }}>↳ "{pos.comment}"</div>}
                          {pos.ingredientsText && <div style={{ fontSize: '13px', color: '#f6ad55' }}>{pos.ingredientsText}</div>}
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

      {/* --- MENU MANAGEMENT TAB SECTION --- */}
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
                {kat.products?.map((prod) => (
                  <div 
                    key={prod.id} 
                    style={{ 
                      backgroundColor: '#1a202c', 
                      padding: '15px', 
                      borderRadius: '6px', 
                      opacity: prod.isActive === false ? 0.6 : 1, 
                      borderLeft: prod.isActive === false ? '4px solid #ef4444' : '4px solid #10b981'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '15px', flex: '1', minWidth: '300px' }}>
                        <input 
                          type="text" 
                          defaultValue={prod.name} 
                          onBlur={(e) => handleUpdateProduct(prod.id, { name: e.target.value })}
                          style={{ backgroundColor: '#2d3748', color: '#fff', border: '1px solid #4a5568', padding: '6px', borderRadius: '4px', fontWeight: 'bold', width: '150px' }}
                        />
                        <input 
                          type="text" 
                          defaultValue={prod.description || ''} 
                          onBlur={(e) => handleUpdateProduct(prod.id, { description: e.target.value })}
                          placeholder="Keine Beschreibung"
                          style={{ backgroundColor: '#2d3748', color: '#fff', border: '1px solid #4a5568', padding: '6px', borderRadius: '4px', flex: '1' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button
                          onClick={() => handleUpdateProduct(prod.id, { isActive: !prod.isActive })}
                          style={{
                            backgroundColor: prod.isActive === false ? '#ef4444' : '#4a5568',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 'bold'
                          }}
                        >
                          {prod.isActive === false ? '🔴 Ausverkauft' : '🟢 Verfügbar'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input 
                            type="text" 
                            defaultValue={Number(prod.price).toFixed(2)} 
                            onBlur={(e) => handleUpdateProduct(prod.id, { price: parseFloat(e.target.value.replace(',', '.')) })}
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
                        {prod.ingredients?.map((zutat) => (
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
                              defaultValue={Number(zutat.price).toFixed(2)}
                              onBlur={(e) => handleUpdateZutat(zutat.id, { price: parseFloat(e.target.value.replace(',', '.')) })}
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
                        {(!prod.ingredients || prod.ingredients.length === 0) && (
                          <span style={{ fontSize: '13px', color: '#a0aec0', fontStyle: 'italic' }}>Noch keine Extras für dieses Gericht.</span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px', maxWidth: '400px' }}>
                        <input
                          type="text"
                          placeholder="Zutat-Name (z.B. Extra Käse)"
                          value={newZutatNames[prod.id] || ''}
                          onChange={(e) => setNewZutatNames(prev => ({ ...prev, [prod.id]: e.target.value }))}
                          style={{ backgroundColor: '#1a202c', color: '#fff', border: '1px solid #4a5568', padding: '5px', borderRadius: '4px', fontSize: '13px', flex: '2' }}
                        />
                        <input
                          type="text"
                          placeholder="Aufpreis (z.B. 1.50)"
                          value={newZutatPrices[prod.id] || ''}
                          onChange={(e) => setNewZutatPrices(prev => ({ ...prev, [prod.id]: e.target.value }))}
                          style={{ backgroundColor: '#1a202c', color: '#fff', border: '1px solid #4a5568', padding: '5px', borderRadius: '4px', fontSize: '13px', flex: '1', width: '60px' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddZutat(prod.id)}
                          style={{ backgroundColor: '#3182ce', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}
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