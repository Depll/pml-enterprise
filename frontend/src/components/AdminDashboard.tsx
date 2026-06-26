import React, { useEffect, useState } from 'react';

// ==========================================
// TYPE DEFINITIONS & INTERFACES
// ==========================================

interface Zutat {
  id: number;
  name: string;
  extraPrice: number; 
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
  id: string; 
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
  id: string; 
  customerName: string; 
  street: string;       
  houseNumber: string;  
  postcode: string;     
  city: string;         
  phone: string;        
  email: string | null;
  deliveryNote: string | null; 
  totalPrice: number;   
  status: string; 
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
  
  const [activeTab, setActiveTab] = useState<'open' | 'zubereitung' | 'erledigt' | 'storniert' | 'menu'>('open');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  const [newProdName, setNewProdName] = useState('');
  const [newProdBeschreibung, setNewProdBeschreibung] = useState('');
  const [newProdPreis, setNewProdPreis] = useState('');
  const [newProdKategorieId, setNewProdKategorieId] = useState<number | ''>('');

  // Dynamische States für Zutaten-Formulare pro Produkt
  const [newZutatNames, setNewZutatNames] = useState<Record<number, string>>({});
  const [newZutatPrices, setNewZutatPrices] = useState<Record<number, string>>({});

  // ==========================================
  // API DATA FETCHING
  // ==========================================

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3000/orders');
      if (response.ok) {
        const data = await response.json();
        const safeData = Array.isArray(data) ? data : [];
        const currentOffenCount = safeData.filter((o: Order) => o.status === 'open').length;

        setOrders((prevOrders) => {
          const prevOffenCount = prevOrders.filter((o) => o.status === 'open').length;
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

  const fetchMenu = async () => {
    try {
      const response = await fetch('http://localhost:3000/menu');
      if (response.ok) {
        const data = await response.json();
        const safeData = Array.isArray(data) ? data : [];
        setKategorien(safeData);
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
      console.warn('Audio playback dynamic interception failed:', e);
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

  const handleCancelOrder = (orderId: string) => {
    const grund = window.prompt('Bitte Stornierungsgrund angeben:');
    if (grund === null) return; 
    if (!grund.trim()) {
      alert('Ein Grund ist zwingend erforderlich!');
      return;
    }
    handleUpdateStatus(orderId, 'storniert', grund);
  };

  // ==========================================
  // MENU MUTATION HANDLERS
  // ==========================================

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
   * Absicherung & Fehlerbehebung für das Hinzufügen neuer Zutaten
   */
  const handleAddZutat = async (productId: number) => {
    const name = newZutatNames[productId]?.trim();
    const preisStr = newZutatPrices[productId] || '0.00';

    if (!name) {
      alert('Bitte einen Namen für die Zutat eingeben!');
      return;
    }

    // Komma zu Punkt Konvertierung vor dem Absenden ans Backend
    const parsedPrice = parseFloat(preisStr.replace(',', '.'));
    const finalPrice = isNaN(parsedPrice) ? 0.0 : parsedPrice;

    try {
      const response = await fetch(`http://localhost:3000/menu/${productId}/ingredient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          extraPrice: finalPrice
        }),
      });

      if (response.ok) {
        // Zustand für dieses Produkt nach Erfolg leeren
        setNewZutatNames(prev => ({ ...prev, [productId]: '' }));
        setNewZutatPrices(prev => ({ ...prev, [productId]: '' }));
        fetchMenu();
      } else {
        alert('Fehler beim Speichern der Zutat auf dem Server.');
      }
    } catch (error) {
      console.error('Failed appending new ingredient dependency:', error);
    }
  };

  const handleDeleteZutat = async (id: number) => {
    if (!window.confirm('Zutat unumkehrbar löschen?')) return;
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
    if (!window.confirm('Gericht aus Speisekarte löschen?')) return;
    try {
      const response = await fetch('http://localhost:3000/menu/' + id, {
        method: 'DELETE',
      });
      if (response.ok) fetchMenu();
    } catch (error) {
      console.error('Deletion query failed on core product resource:', error);
    }
  };

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
        fetchMenu(); 
      } else {
        const errResult = await response.json();
        alert(`Server-Fehler (400): ${JSON.stringify(errResult.message || errResult)}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePrintOrder = (order: Order) => {
    const oldFrame = document.getElementById('print-iframe-container');
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'print-iframe-container';
    iframe.className = 'fixed right-0 bottom-0 w-0 h-0 border-none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const positionenHtml = order.positions?.map(pos => `
      <div style="border-bottom: 1px dashed #000; padding: 5px 0;">
        <strong>${pos.quantity}x ${pos.product?.name || `ID: ${pos.productId}`}</strong>
        ${pos.selectedSize ? ` [${pos.selectedSize}]` : ''}
        ${pos.selectedOption ? ` (${pos.selectedOption})` : ''}
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
        <div><strong>Adresse:</strong><br>${order.street} ${order.houseNumber}<br>${order.postcode} ${order.city}</div>
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

  useEffect(() => {
    fetchOrders();
    fetchMenu();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); 
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const activeOrdersOnly = orders.filter(o => o.status !== 'storniert');
  const totalUmsatz = activeOrdersOnly.reduce((sum, o) => sum + Number(o.totalPrice), 0);
  const totalGerichte = activeOrdersOnly.reduce((sum, o) => sum + (o.positions?.reduce((pSum, p) => pSum + p.quantity, 0) || 0), 0);
  const avgBestellwert = activeOrdersOnly.length > 0 ? totalUmsatz / activeOrdersOnly.length : 0;

  const filteredOrders = orders.filter(o => o.status === activeTab);

  return (
    <div className="p-5 bg-slate-900 min-h-screen text-white font-sans">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <h2 className="text-xl sm:text-2xl font-bold tracking-wide">🍕 Milano Enterprise - Küchen-Dashboard</h2>
        <div className="flex gap-2.5 items-center w-full sm:w-auto justify-end">
          <button
            onClick={toggleSound}
            className={`px-4 py-2 text-sm rounded border-none font-bold text-white cursor-pointer transition-colors ${
              soundEnabled ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-600 hover:bg-slate-700'
            }`}
          >
            {soundEnabled ? '🔔 Ton: AN' : '🔕 Ton: AUS (Aktivieren)'}
          </button>
          <button 
            onClick={() => { fetchOrders(); fetchMenu(); }} 
            className="px-4 py-2 text-sm rounded border-none font-bold text-white cursor-pointer bg-red-500 hover:bg-red-600 transition-colors"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {/* KPI Performance Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-emerald-500 shadow-md">
          <span className="text-xs sm:text-sm text-slate-400 block font-medium">Gesamtumsatz</span>
          <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-emerald-400">{totalUmsatz.toFixed(2).replace('.', ',')} €</h3>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500 shadow-md">
          <span className="text-xs sm:text-sm text-slate-400 block font-medium">Verkaufte Portionen</span>
          <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-blue-400">{totalGerichte}x Gerichte</h3>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-amber-500 shadow-md">
          <span className="text-xs sm:text-sm text-slate-400 block font-medium">Ø Bestellwert</span>
          <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-amber-400">{avgBestellwert.toFixed(2).replace('.', ',')} €</h3>
        </div>
      </div>

      {/* Tab Controls Navigation */}
      <div className="flex gap-2 mb-5 border-b-2 border-slate-800 pb-2.5 overflow-x-auto whitespace-nowrap scrollbar-thin">
        <button 
          onClick={() => setActiveTab('open')} 
          className={`px-4 py-2 text-sm font-bold border-none rounded cursor-pointer transition-colors ${
            activeTab === 'open' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Neue Bestellungen ({orders.filter(o => o.status === 'open').length})
        </button>
        <button 
          onClick={() => setActiveTab('zubereitung')} 
          className={`px-4 py-2 text-sm font-bold border-none rounded cursor-pointer transition-colors ${
            activeTab === 'zubereitung' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          ⏳ In Zubereitung ({orders.filter(o => o.status === 'zubereitung').length})
        </button>
        <button 
          onClick={() => setActiveTab('erledigt')} 
          className={`px-4 py-2 text-sm font-bold border-none rounded cursor-pointer transition-colors ${
            activeTab === 'erledigt' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Archiv (Erledigt) ({orders.filter(o => o.status === 'erledigt').length})
        </button>
        <button 
          onClick={() => setActiveTab('storniert')} 
          className={`px-4 py-2 text-sm font-bold border-none rounded cursor-pointer transition-colors ${
            activeTab === 'storniert' ? 'bg-slate-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          ❌ Storniert ({orders.filter(o => o.status === 'storniert').length})
        </button>
        <button 
          onClick={() => setActiveTab('menu')} 
          className={`px-4 py-2 text-sm font-bold border-none rounded cursor-pointer transition-colors ${
            activeTab === 'menu' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          📖 Speisekarte verwalten
        </button>
      </div>

      {/* --- WORKFLOW ORDERS TAB SECTION --- */}
      {activeTab !== 'menu' && (
        filteredOrders.length === 0 ? (
          <p className="text-slate-400 text-base italic mt-4">Keine Bestellungen in dieser Kategorie. 🎉</p>
        ) : (
          <div className="flex flex-col gap-5">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border border-slate-800 rounded-lg p-5 bg-slate-800 shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700 pb-2.5 mb-3 gap-3">
                  <div>
                    <strong className="text-base sm:text-lg text-white">Bestellung #{order.id.substring(0, 8)}</strong> - <span className="font-medium text-slate-200">{order.customerName}</span>
                    <br /><span className="text-xs text-slate-400 font-mono">{new Date(order.createdAt).toLocaleString('de-DE')}</span>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-lg font-bold text-emerald-400 font-mono">{Number(order.totalPrice).toFixed(2).replace('.', ',')} €</div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePrintOrder(order)} 
                        className="p-2 bg-slate-700 border-none text-white rounded cursor-pointer hover:bg-slate-600 transition-colors"
                        title="Küchenbon drucken"
                      >
                        🖨️
                      </button>
                      
                      {order.status === 'open' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'zubereitung')} 
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white border-none rounded cursor-pointer font-bold text-sm transition-colors"
                          >
                            👨‍🍳 In den Ofen
                          </button>
                          <button 
                            onClick={() => handleCancelOrder(order.id)} 
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white border-none rounded cursor-pointer font-bold text-sm transition-colors"
                          >
                            ❌ Stornieren
                          </button>
                        </>
                      )}
                      {order.status === 'zubereitung' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'erledigt')} 
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded cursor-pointer font-bold text-sm transition-colors"
                          >
                            ✔ Fertig
                          </button>
                          <button 
                            onClick={() => handleCancelOrder(order.id)} 
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white border-none rounded cursor-pointer font-bold text-sm transition-colors"
                          >
                            ❌ Stornieren
                          </button>
                        </>
                      )}
                      {(order.status === 'erledigt' || order.status === 'storniert') && (
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'zubereitung')} 
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border-none rounded cursor-pointer font-bold text-sm transition-colors"
                        >
                          ↩ Reaktivieren
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-1">Adresse</h4>
                    <p className="text-sm leading-relaxed text-slate-300">
                      {order.street} {order.houseNumber}<br />
                      {order.postcode} {order.city}<br />
                      <span className="font-semibold text-slate-400">Tel:</span> {order.phone}
                    </p>
                    
                    {order.deliveryNote && (
                      <div className="mt-2.5 p-2 bg-slate-900 rounded text-xs border border-slate-700 text-slate-300">
                        <strong className="text-amber-400">Anmerkung:</strong> "{order.deliveryNote}"
                      </div>
                    )}

                    {order.stornoReason && (
                      <div className="mt-4 p-2.5 bg-red-950/50 border-l-4 border-red-500 rounded">
                        <strong className="text-xs text-red-300">Stornogrund:</strong>
                        <p className="margin-0 text-xs text-white italic mt-0.5">"{order.stornoReason}"</p>
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-1">Gerichte</h4>
                    <ul className="pl-5 m-0 space-y-2 list-disc text-slate-300">
                      {order.positions?.map((pos) => {
                        const allIngredients = kategorien.flatMap(k => k.products.flatMap(p => p.ingredients || []));
                        
                        const extraZutatenNamen = (pos.selectedIngredientsIds || [])
                          .map(id => allIngredients.find(i => i.id === id)?.name)
                          .filter(Boolean);

                        const entfernteZutatenNamen = (pos.removedIngredientsIds || [])
                          .map(id => allIngredients.find(i => i.id === id)?.name)
                          .filter(Boolean);

                        return (
                          <li key={pos.id} className="text-sm">
                            <strong className="text-white">{pos.quantity}x {pos.product?.name || `ID ${pos.productId}`}</strong>
                            {pos.selectedSize && <span className="text-blue-400 font-bold ml-1">[{pos.selectedSize}]</span>}
                            {pos.selectedOption && <span className="text-purple-400 italic ml-1">({pos.selectedOption})</span>}
                            <span className="font-mono text-slate-400 text-xs ml-1">({Number(pos.priceSnapshot).toFixed(2)} €)</span>
                            
                            {pos.comment && <div className="text-xs text-slate-400 pl-1.5 italic mt-0.5">↳ Anmerkung: "{pos.comment}"</div>}
                            
                            {extraZutatenNamen.length > 0 && (
                              <div className="text-xs text-emerald-400 pl-1.5 font-medium mt-0.5">
                                ➕ Extra: {extraZutatenNamen.join(', ')}
                              </div>
                            )}

                            {entfernteZutatenNamen.length > 0 && (
                              <div className="text-xs text-red-400 pl-1.5 font-medium mt-0.5 line-through">
                                ❌ Ohne: {entfernteZutatenNamen.join(', ')}
                              </div>
                            )}
                          </li>
                        );
                      })}
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
        <div className="flex flex-col gap-8">
          <div className="bg-slate-800 p-5 rounded-lg border border-blue-600 shadow-md">
            <h3 className="text-blue-400 font-bold text-lg mb-4">➕ Neues Gericht hinzufügen</h3>
            <form onSubmit={handleAddProduct} className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-37.5">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">Kategorie</label>
                <select 
                  value={newProdKategorieId} 
                  onChange={(e) => setNewProdKategorieId(Number(e.target.value))}
                  className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700 outline-none focus:border-blue-500"
                >
                  {kategorien.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>
              <div className="flex-2 min-w-45">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">Name</label>
                <input type="text" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Pizza Tonno" className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700 outline-none focus:border-blue-500" />
              </div>
              <div className="flex-2 min-w-45">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">Beschreibung</label>
                <input type="text" value={newProdBeschreibung} onChange={(e) => setNewProdBeschreibung(e.target.value)} placeholder="mit Thunfisch" className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700 outline-none focus:border-blue-500" />
              </div>
              <div className="flex-1 min-w-20">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">Preis (€)</label>
                <input type="text" value={newProdPreis} onChange={(e) => setNewProdPreis(e.target.value)} placeholder="8.50" className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700 outline-none focus:border-blue-500 font-mono" />
              </div>
              <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white border-none py-2 px-5 rounded font-bold cursor-pointer h-9.5 transition-colors">
                Hinzufügen
              </button>
            </form>
          </div>

          {kategorien.map((kat) => (
            <div key={kat.id} className="bg-slate-800 p-5 rounded-lg shadow-md">
              <h3 className="text-amber-400 font-bold text-lg border-b border-slate-700 pb-1 mb-4 uppercase tracking-wider">{kat.name}</h3>
              <div className="flex flex-col gap-5">
                {kat.products?.map((prod) => (
                  <div 
                    key={prod.id} 
                    className={`bg-slate-900 p-4 rounded-md transition-opacity duration-200 border-l-4 ${
                      prod.isActive === false ? 'opacity-60 border-red-500' : 'opacity-100 border-emerald-500'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-3">
                      <div className="flex flex-wrap gap-3 flex-1 w-full lg:w-auto">
                        <input 
                          type="text" 
                          defaultValue={prod.name} 
                          onBlur={(e) => handleUpdateProduct(prod.id, { name: e.target.value })}
                          className="bg-slate-800 text-white border border-slate-700 p-1.5 rounded font-bold w-full sm:w-45 outline-none focus:border-blue-500"
                        />
                        <input 
                          type="text" 
                          defaultValue={prod.description || ''} 
                          onBlur={(e) => handleUpdateProduct(prod.id, { description: e.target.value })}
                          placeholder="Keine Beschreibung"
                          className="bg-slate-800 text-white border border-slate-700 p-1.5 rounded flex-1 min-w-50 outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                        <button
                          onClick={() => handleUpdateProduct(prod.id, { isActive: !prod.isActive })}
                          className={`border-none px-3 py-1.5 rounded cursor-pointer text-xs font-bold text-white transition-colors ${
                            prod.isActive === false ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          {prod.isActive === false ? '🔴 Ausverkauft' : '🟢 Verfügbar'}
                        </button>

                        <div className="flex items-center gap-1">
                          <input 
                            type="text" 
                            defaultValue={prod.price ? Number(prod.price).toFixed(2) : '0.00'} 
                            onBlur={(e) => {
                              const parsed = parseFloat(e.target.value.replace(',', '.'));
                              handleUpdateProduct(prod.id, { price: isNaN(parsed) ? 0 : parsed });
                            }}
                            className="bg-slate-800 text-emerald-400 border border-slate-700 p-1.5 rounded w-20 font-bold text-right outline-none focus:border-blue-500 font-mono"
                          />
                          <span className="text-emerald-400 font-bold text-sm">€</span>
                        </div>

                        <button 
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="bg-slate-700 hover:bg-slate-600 border-none text-white px-3 py-1.5 rounded cursor-pointer font-bold text-xs transition-colors"
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-slate-800 rounded-md border border-slate-700">
                      <span className="text-xs font-bold text-amber-400 block mb-2 uppercase tracking-wide">
                        🌶️ Extras / Zutaten für dieses Gericht bearbeiten:
                      </span>
                      
                      <div className="flex flex-wrap gap-3 mb-3">
                        {prod.ingredients?.map((zutat) => (
                          <div 
                            key={zutat.id} 
                            className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-700"
                          >
                            <input 
                              type="text"
                              defaultValue={zutat.name}
                              onBlur={(e) => handleUpdateZutat(zutat.id, { name: e.target.value })}
                              className="bg-transparent text-white border-none text-xs font-bold w-27.5 outline-none"
                            />
                            <input 
                              type="text"
                              defaultValue={zutat.extraPrice ? Number(zutat.extraPrice).toFixed(2).replace('.', ',') : '0,00'}
                              onBlur={(e) => {
                                const parsed = parseFloat(e.target.value.replace(',', '.'));
                                handleUpdateZutat(zutat.id, { price: isNaN(parsed) ? 0 : parsed });
                              }}
                              className="bg-slate-800 text-amber-400 border border-slate-700 rounded text-xs w-16 text-right p-0.5 outline-none font-mono"
                            />
                            <span className="text-amber-400 text-xs font-bold mr-1">€</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteZutat(zutat.id)}
                              className="bg-transparent border-none text-red-400 hover:text-red-500 cursor-pointer text-sm p-0"
                              title="Extra permanent löschen"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                        {(!prod.ingredients || prod.ingredients.length === 0) && (
                          <span className="text-xs text-slate-400 italic">Noch keine Extras für dieses Gericht.</span>
                        )}
                      </div>
                      
                      <div className="flex gap-2 items-center mt-2 max-w-105">
                        <input
                          type="text"
                          placeholder="Zutat-Name (z.B. Extra Käse)"
                          value={newZutatNames[prod.id] || ''}
                          onChange={(e) => setNewZutatNames(prev => ({ ...prev, [prod.id]: e.target.value }))}
                          className="bg-slate-900 text-white border border-slate-700 p-1.5 rounded text-xs flex-2 outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="1,50"
                          value={newZutatPrices[prod.id] || ''}
                          onChange={(e) => setNewZutatPrices(prev => ({ ...prev, [prod.id]: e.target.value }))}
                          className="bg-slate-900 text-white border border-slate-700 p-1.5 rounded text-xs flex-1 w-16 outline-none focus:border-blue-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddZutat(prod.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white border-none px-3 py-1.5 rounded text-xs cursor-pointer font-bold transition-colors whitespace-nowrap"
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