import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

// ==========================================
// TYPE DEFINITIONS & INTERFACES
// ==========================================

interface Ingredient {
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
  ingredients?: Ingredient[]; 
  sizes?: Array<{
    name: string;
    price: number;
    extraIngredientPrice: number;
  }> | null;
  options?: string[] | null;
}

interface Category {
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
  appliedVoucherCode?: string | null; // 👈 Gutschein-Code
  discountAmount?: number | null;     // 👈 Rabattbetrag
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setLoading] = useState<boolean>(true);
  
  const [activeTab, setActiveTab] = useState<'open' | 'zubereitung' | 'erledigt' | 'storniert' | 'menu'>('open');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState<number | ''>('');

  const [newProductSizes, setNewProductSizes] = useState<
    Array<{ name: string; price: string; extraIngredientPrice: string }>
  >([]);
  const [newProductOptions, setNewProductOptions] = useState<string[]>([]);
  const [newProductOptionText, setNewProductOptionText] = useState('');
  const [lastProductCategoryId, setLastProductCategoryId] = useState<number | ''>('');

  const [newIngredientNames, setNewIngredientNames] = useState<Record<number, string>>({});
  const [newIngredientPrices, setNewIngredientPrices] = useState<Record<number, string>>({});

  // ==========================================
  // API DATA FETCHING
  // ==========================================

  const fetchOrders = async () => {
    const safeData = await apiService.fetchOrdersSafe();
    const currentOpenCount = safeData.filter((o: any) => o.status === 'open').length;

    setOrders((prevOrders) => {
      const previousOpenCount = prevOrders.filter((o) => o.status === 'open').length;
      if (soundEnabled && prevOrders.length > 0 && currentOpenCount > previousOpenCount) {
        playNotificationSound();
      }
      return safeData;
    });
    setLoading(false);
  };

  const fetchMenu = async () => {
    const safeData = await apiService.fetchMenu();
    setCategories(safeData);
    if (safeData.length > 0 && newProductCategoryId === '') {
      setNewProductCategoryId(safeData[0].id);
    }
  };

  const currentCategory = categories.find(
    (category) => category.id === Number(newProductCategoryId),
  );
  const currentCategoryName = currentCategory?.name || '';
  const isPizzaCategory = currentCategoryName === 'pizza';
  const isSalateCategory = currentCategoryName === 'salate';
  const isNudelgerichteCategory = currentCategoryName === 'nudelgerichte';

  const initializeCategoryDefaults = () => {
    if (newProductCategoryId === lastProductCategoryId) return;

    setLastProductCategoryId(newProductCategoryId);
    setNewProductSizes([]);
    setNewProductOptions([]);
    setNewProductOptionText('');

    if (currentCategoryName === 'pizza') {
      setNewProductSizes([
        { name: 'Normal', price: newProductPrice || '', extraIngredientPrice: '1.50' },
        { name: 'XXL', price: '', extraIngredientPrice: '2.00' },
        { name: 'Partyblech', price: '', extraIngredientPrice: '4.00' },
      ]);
    }

    if (currentCategoryName === 'salate') {
      setNewProductOptions([
        'Joghurt-Dressing',
        'Essig-Öl-Dressing',
        'Kein Dressing',
      ]);
    }

    if (currentCategoryName === 'nudelgerichte') {
      setNewProductOptions([
        'Spaghetti',
        'Rigatoni',
        'Tortellini',
        'Tagliatelle',
      ]);
    }
  };

  useEffect(() => {
    initializeCategoryDefaults();
  }, [newProductCategoryId, categories]);

  const handleAddSize = () => {
    setNewProductSizes((prev) => [
      ...prev,
      { name: 'Neue Größe', price: '', extraIngredientPrice: '0.00' },
    ]);
  };

  const handleUpdateSize = (
    index: number,
    field: 'name' | 'price' | 'extraIngredientPrice',
    value: string,
  ) => {
    setNewProductSizes((prev) =>
      prev.map((size, idx) =>
        idx === index ? { ...size, [field]: value } : size,
      ),
    );
  };

  const handleRemoveSize = (index: number) => {
    setNewProductSizes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddOption = () => {
    const optionText = newProductOptionText.trim();
    if (!optionText) return;
    setNewProductOptions((prev) => [...prev, optionText]);
    setNewProductOptionText('');
  };

  const handleRemoveOption = (index: number) => {
    setNewProductOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  useEffect(() => {
    if (!isPizzaCategory) return;
    setNewProductSizes((current) =>
      current.map((size, index) =>
        index === 0
          ? { ...size, price: newProductPrice || size.price }
          : size,
      ),
    );
  }, [newProductPrice, isPizzaCategory]);

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
    const success = await apiService.updateOrderStatus(orderId, newStatus, cancellationReason);
    if (success) fetchOrders();
  };

  const handleCancelOrder = (orderId: string) => {
    const reason = window.prompt('Bitte Stornierungsgrund angeben:');
    if (reason === null) return; 
    if (!reason.trim()) {
      alert('Ein Grund ist zwingend erforderlich!');
      return;
    }
    handleUpdateStatus(orderId, 'storniert', reason);
  };

  // ==========================================
  // MENU MUTATION HANDLERS
  // ==========================================

  const handleUpdateProduct = async (id: number, updatedData: Partial<Product>) => {
    const success = await apiService.updateProduct(id, updatedData);
    if (success) fetchMenu();
  };

  const handleUpdateIngredient = async (id: number, updatedData: { name?: string; extraPrice?: number }) => {
    const success = await apiService.updateIngredient(id, updatedData);
    if (success) fetchMenu();
  };

  const handleAddIngredient = async (productId: number) => {
    const name = newIngredientNames[productId]?.trim();
    const priceText = newIngredientPrices[productId] || '0.00';

    if (!name) {
      alert('Bitte einen Namen für die Zutat eingeben!');
      return;
    }

    const parsedPrice = parseFloat(priceText.replace(',', '.'));
    const finalPrice = isNaN(parsedPrice) ? 0.0 : parsedPrice;

    const success = await apiService.addIngredient(productId, name, finalPrice);

    if (success) {
      setNewIngredientNames(prev => ({ ...prev, [productId]: '' }));
      setNewIngredientPrices(prev => ({ ...prev, [productId]: '' }));
      fetchMenu();
    } else {
      alert('Fehler beim Speichern der Zutat auf dem Server.');
    }
  };

  const handleDeleteIngredient = async (id: number) => {
    if (!window.confirm('Zutat unumkehrbar löschen?')) return;
    const success = await apiService.deleteIngredient(id);
    if (success) fetchMenu();
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Gericht aus Speisekarte löschen?')) return;
    const success = await apiService.deleteProduct(id);
    if (success) fetchMenu();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice || !newProductCategoryId) {
      alert('Bitte Name, Preis und Kategorie ausfüllen!');
      return;
    }

    const generatedSku = `PROD-${Date.now()}`;

    const payload: Record<string, unknown> = {
      sku: generatedSku,
      name: newProductName,
      description: newProductDescription,
      price: parseFloat(newProductPrice.replace(',', '.')),
      categoryId: Number(newProductCategoryId),
      is_active: true, 
    };

    if (isPizzaCategory && newProductSizes.length > 0) {
      payload.sizes = newProductSizes.map((size) => ({
        name: size.name,
        price: parseFloat(size.price.replace(',', '.')) || 0,
        extraIngredientPrice: parseFloat(size.extraIngredientPrice.replace(',', '.')) || 0,
      }));
    }

    if ((isSalateCategory || isNudelgerichteCategory) && newProductOptions.length > 0) {
      payload.options = newProductOptions;
    }

    try {
      await apiService.addProduct(payload);

      setNewProductName('');
      setNewProductDescription('');
      setNewProductPrice('');
      setNewProductSizes([]);
      setNewProductOptions([]);
      setNewProductOptionText('');
      fetchMenu(); 
    } catch (errResult: any) {
      alert(`Server-Fehler: ${JSON.stringify(errResult.message || errResult)}`);
    }
  };

  // ==========================================
  // PRINT BON WITH VOUCHER SUPPORT
  // ==========================================

  const handlePrintOrder = (order: Order) => {
    const oldFrame = document.getElementById('print-iframe-container');
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'print-iframe-container';
    iframe.className = 'fixed right-0 bottom-0 w-0 h-0 border-none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const positionsHtml = order.positions?.map(position => `
      <div style="border-bottom: 1px dashed #000; padding: 5px 0;">
        <strong>${position.quantity}x ${position.product?.name || `ID: ${position.productId}`}</strong>
        ${position.selectedSize ? ` [${position.selectedSize}]` : ''}
        ${position.selectedOption ? ` (${position.selectedOption})` : ''}
        ${position.comment ? `<br><span style="font-style:italic; font-size:12px;">↳ "${position.comment}"</span>` : ''}
        ${position.ingredientsText ? `<br><span style="font-size:12px; font-weight:bold;">${position.ingredientsText}</span>` : ''}
      </div>
    `).join('') || '';

    const rawTotal = Number(order.totalPrice || 0);
    const discount = Number(order.discountAmount || 0);
    const finalTotal = Math.max(0, rawTotal - discount);

    doc.write(`
      <html>
      <head>
        <title>Küchenbon #${order.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; width: 280px; margin: 10px; padding: 0; font-size: 14px; color: #000; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .hr { border-top: 1px solid #000; margin: 10px 0; }
          .flex-between { display: flex; justify-content: space-between; }
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
        ${order.email ? `<div><strong>E-Mail:</strong> ${order.email}</div>` : ''}
        ${order.deliveryNote ? `<div style="margin-top:5px; background:#eee; padding:3px;"><strong>Anmerkung:</strong> ${order.deliveryNote}</div>` : ''}
        <div class="hr"></div>
        <div class="bold">POSITIONEN:</div>
        ${positionsHtml}
        <div class="hr"></div>
        
        ${order.appliedVoucherCode && discount > 0 ? `
          <div class="flex-between"><span>Zwischensumme:</span> <span>${rawTotal.toFixed(2).replace('.', ',')} €</span></div>
          <div class="flex-between" style="font-weight:bold;">
            <span>Gutschein (${order.appliedVoucherCode}):</span> 
            <span>-${discount.toFixed(2).replace('.', ',')} €</span>
          </div>
          <div class="hr"></div>
        ` : ''}

        <div class="bold flex-between" style="font-size: 16px;">
          <span>GESAMT:</span> 
          <span>${finalTotal.toFixed(2).replace('.', ',')} €</span>
        </div>
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
  
  // KPI Berechnung inklusive Rabatte
  const totalRevenue = activeOrdersOnly.reduce((sum, o) => {
    const rawTotal = Number(o.totalPrice || 0);
    const discount = Number(o.discountAmount || 0);
    return sum + Math.max(0, rawTotal - discount);
  }, 0);

  const totalDishes = activeOrdersOnly.reduce((sum, order) => sum + (order.positions?.reduce((positionSum, position) => positionSum + position.quantity, 0) || 0), 0);
  const averageOrderValue = activeOrdersOnly.length > 0 ? totalRevenue / activeOrdersOnly.length : 0;

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
          <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-emerald-400">{totalRevenue.toFixed(2).replace('.', ',')} €</h3>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500 shadow-md">
          <span className="text-xs sm:text-sm text-slate-400 block font-medium">Verkaufte Portionen</span>
          <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-blue-400">{totalDishes}x Gerichte</h3>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-amber-500 shadow-md">
          <span className="text-xs sm:text-sm text-slate-400 block font-medium">Ø Bestellwert</span>
          <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-amber-400">{averageOrderValue.toFixed(2).replace('.', ',')} €</h3>
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
            {filteredOrders.map((order) => {
              const rawTotal = Number(order.totalPrice || 0);
              const discount = Number(order.discountAmount || 0);
              const finalPrice = Math.max(0, rawTotal - discount);

              return (
                <div key={order.id} className="border border-slate-800 rounded-lg p-5 bg-slate-800 shadow-md">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700 pb-2.5 mb-3 gap-3">
                    <div>
                      <strong className="text-base sm:text-lg text-white">Bestellung #{order.id.substring(0, 8)}</strong> - <span className="font-medium text-slate-200">{order.customerName}</span>
                      <br /><span className="text-xs text-slate-400 font-mono">{new Date(order.createdAt).toLocaleString('de-DE')}</span>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        {order.appliedVoucherCode && discount > 0 && (
                          <div className="text-xs text-amber-400 font-bold">
                            🎟️ {order.appliedVoucherCode} (-{discount.toFixed(2).replace('.', ',')} €)
                          </div>
                        )}
                        <div className="text-lg font-bold text-emerald-400 font-mono">
                          {finalPrice.toFixed(2).replace('.', ',')} €
                        </div>
                      </div>
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
                        {order.email && (
                          <>
                            <br />
                            <span className="font-semibold text-slate-400">E-Mail:</span>{" "}
                            <a href={`mailto:${order.email}`} className="text-blue-400 hover:underline">
                              {order.email}
                            </a>
                          </>
                        )}
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
                        {order.positions?.map((position) => {
                          const allIngredients = categories.flatMap(category => category.products.flatMap(product => product.ingredients || []));
                          
                          const extraIngredientNames = (position.selectedIngredientsIds || [])
                            .map(id => allIngredients.find(ingredient => ingredient.id === id)?.name)
                            .filter(Boolean);

                          const removedIngredientNames = (position.removedIngredientsIds || [])
                            .map(id => allIngredients.find(ingredient => ingredient.id === id)?.name)
                            .filter(Boolean);

                          return (
                            <li key={position.id} className="text-sm">
                              <strong className="text-white">{position.quantity}x {position.product?.name || `ID ${position.productId}`}</strong>
                              {position.selectedSize && <span className="text-blue-400 font-bold ml-1">[{position.selectedSize}]</span>}
                              {position.selectedOption && <span className="text-purple-400 italic ml-1">({position.selectedOption})</span>}
                              <span className="font-mono text-slate-400 text-xs ml-1">({Number(position.priceSnapshot).toFixed(2)} €)</span>
                              
                              {position.comment && <div className="text-xs text-slate-400 pl-1.5 italic mt-0.5">↳ Anmerkung: "{position.comment}"</div>}
                              
                              {extraIngredientNames.length > 0 && (
                                <div className="text-xs text-emerald-400 pl-1.5 font-medium mt-0.5">
                                  ➕ Extra: {extraIngredientNames.join(', ')}
                                </div>
                              )}

                              {removedIngredientNames.length > 0 && (
                                <div className="text-xs text-red-400 pl-1.5 font-medium mt-0.5 line-through">
                                  ❌ Ohne: {removedIngredientNames.join(', ')}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
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
                  value={newProductCategoryId} 
                  onChange={(e) => setNewProductCategoryId(Number(e.target.value))}
                  className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700 outline-none focus:border-blue-500"
                >
                  {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <div className="flex-2 min-w-45">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">Name</label>
                <input type="text" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="Pizza Tonno" className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700 outline-none focus:border-blue-500" />
              </div>
              <div className="flex-2 min-w-45">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">Beschreibung</label>
                <input type="text" value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} placeholder="mit Thunfisch" className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700 outline-none focus:border-blue-500" />
              </div>
              <div className="flex-1 min-w-20">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">Preis (€)</label>
                <input type="text" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} placeholder="8.50" className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700 outline-none focus:border-blue-500 font-mono" />
              </div>

              {isPizzaCategory && (
                <div className="w-full">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">Pizza-Größen und Extra-Zutatenpreis</div>
                  <div className="grid grid-cols-1 gap-2">
                    {newProductSizes.map((size, index) => (
                      <div key={`${size.name}-${index}`} className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-2">
                        <input
                          type="text"
                          value={size.name}
                          onChange={(e) => handleUpdateSize(index, 'name', e.target.value)}
                          className="bg-slate-900 text-white p-2 rounded border border-slate-700 outline-none"
                          placeholder="Normal"
                        />
                        <input
                          type="text"
                          value={size.price}
                          onChange={(e) => handleUpdateSize(index, 'price', e.target.value)}
                          className="bg-slate-900 text-white p-2 rounded border border-slate-700 outline-none font-mono"
                          placeholder="8.00"
                        />
                        <input
                          type="text"
                          value={size.extraIngredientPrice}
                          onChange={(e) => handleUpdateSize(index, 'extraIngredientPrice', e.target.value)}
                          className="bg-slate-900 text-white p-2 rounded border border-slate-700 outline-none font-mono"
                          placeholder="1.50"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(index)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 rounded"
                        >
                          Entfernen
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddSize}
                      className="self-start bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
                    >
                      Größe hinzufügen
                    </button>
                  </div>
                </div>
              )}

              {(isSalateCategory || isNudelgerichteCategory) && (
                <div className="w-full">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">Varianten / Optionen</div>
                  <div className="flex flex-wrap gap-2 items-center mb-2">
                    <input
                      type="text"
                      value={newProductOptionText}
                      onChange={(e) => setNewProductOptionText(e.target.value)}
                      placeholder={isSalateCategory ? 'Neues Dressing' : 'Neue Nudelart'}
                      className="flex-1 min-w-0 bg-slate-900 text-white p-2 rounded border border-slate-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
                    >
                      Option hinzufügen
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newProductOptions.map((option, index) => (
                      <span key={`${option}-${index}`} className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded border border-slate-700">
                        {option}
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="text-red-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white border-none py-2 px-5 rounded font-bold cursor-pointer h-9.5 transition-colors">
                Hinzufügen
              </button>
            </form>
          </div>

          {categories.map((category) => (
            <div key={category.id} className="bg-slate-800 p-5 rounded-lg shadow-md">
              <h3 className="text-amber-400 font-bold text-lg border-b border-slate-700 pb-1 mb-4 uppercase tracking-wider">{category.name}</h3>
              <div className="flex flex-col gap-5">
                {category.products?.map((product) => (
                  <div 
                    key={product.id} 
                    className={`bg-slate-900 p-4 rounded-md transition-opacity duration-200 border-l-4 ${
                      product.isActive === false ? 'opacity-60 border-red-500' : 'opacity-100 border-emerald-500'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-3">
                      <div className="flex flex-wrap gap-3 flex-1 w-full lg:w-auto">
                        <input 
                          type="text" 
                          defaultValue={product.name} 
                          onBlur={(e) => handleUpdateProduct(product.id, { name: e.target.value })}
                          className="bg-slate-800 text-white border border-slate-700 p-1.5 rounded font-bold w-full sm:w-45 outline-none focus:border-blue-500"
                        />
                        <input 
                          type="text" 
                          defaultValue={product.description || ''} 
                          onBlur={(e) => handleUpdateProduct(product.id, { description: e.target.value })}
                          placeholder="Keine Beschreibung"
                          className="bg-slate-800 text-white border border-slate-700 p-1.5 rounded flex-1 min-w-50 outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                        <button
                          onClick={() => handleUpdateProduct(product.id, { isActive: !product.isActive })}
                          className={`border-none px-3 py-1.5 rounded cursor-pointer text-xs font-bold text-white transition-colors ${
                            product.isActive === false ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          {product.isActive === false ? '🔴 Ausverkauft' : '🟢 Verfügbar'}
                        </button>

                        <div className="flex items-center gap-1">
                          <input 
                            type="text" 
                            defaultValue={product.price ? Number(product.price).toFixed(2) : '0.00'} 
                            onBlur={(e) => {
                              const parsed = parseFloat(e.target.value.replace(',', '.'));
                              handleUpdateProduct(product.id, { price: isNaN(parsed) ? 0 : parsed });
                            }}
                            className="bg-slate-800 text-emerald-400 border border-slate-700 p-1.5 rounded w-20 font-bold text-right outline-none focus:border-blue-500 font-mono"
                          />
                          <span className="text-emerald-400 font-bold text-sm">€</span>
                        </div>

                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
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
                        {product.ingredients?.map((ingredient) => (
                          <div 
                            key={ingredient.id} 
                            className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-700"
                          >
                            <input 
                              type="text"
                              defaultValue={ingredient.name}
                              onBlur={(e) => handleUpdateIngredient(ingredient.id, { name: e.target.value })}
                              className="bg-transparent text-white border-none text-xs font-bold w-27.5 outline-none"
                            />
                            <input 
                              type="text"
                              defaultValue={ingredient.extraPrice ? Number(ingredient.extraPrice).toFixed(2).replace('.', ',') : '0,00'}
                              onBlur={(e) => {
                                const parsed = parseFloat(e.target.value.replace(',', '.'));
                                handleUpdateIngredient(ingredient.id, { extraPrice: isNaN(parsed) ? 0 : parsed });
                              }}
                              className="bg-slate-800 text-amber-400 border border-slate-700 rounded text-xs w-16 text-right p-0.5 outline-none font-mono"
                            />
                            <span className="text-amber-400 text-xs font-bold mr-1">€</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteIngredient(ingredient.id)}
                              className="bg-transparent border-none text-red-400 hover:text-red-500 cursor-pointer text-sm p-0"
                              title="Extra permanent löschen"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                        {(!product.ingredients || product.ingredients.length === 0) && (
                          <span className="text-xs text-slate-400 italic">Noch keine Extras für dieses Gericht.</span>
                        )}
                      </div>
                      
                      <div className="flex gap-2 items-center mt-2 max-w-105">
                        <input
                          type="text"
                          placeholder="Zutat-Name (z.B. Extra Käse)"
                          value={newIngredientNames[product.id] || ''}
                          onChange={(e) => setNewIngredientNames(prev => ({ ...prev, [product.id]: e.target.value }))}
                          className="bg-slate-900 text-white border border-slate-700 p-1.5 rounded text-xs flex-2 outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="1,50"
                          value={newIngredientPrices[product.id] || ''}
                          onChange={(e) => setNewIngredientPrices(prev => ({ ...prev, [product.id]: e.target.value }))}
                          className="bg-slate-900 text-white border border-slate-700 p-1.5 rounded text-xs flex-1 w-16 outline-none focus:border-blue-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddIngredient(product.id)}
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