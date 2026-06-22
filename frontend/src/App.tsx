import React, { useState } from 'react';
import { useCart } from './context/CartContext';
import { Hero } from './components/Hero';
import { SearchMenu } from './components/SearchMenu';
import { Menu } from './components/Menu';
import { Footer } from './components/Footer';
import { PlzModal } from './components/PlzModal';
import { CartDrawer } from './components/CartDrawer';
import { ImpressumModal } from './components/ImpressumModal';
import { DatenschutzModal } from './components/DatenschutzModal';
import { CheckoutForm } from './components/CheckoutForm';
import { AdminDashboard } from './components/AdminDashboard'; // <-- NEU: Importieren

function App() {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false); // <-- NEU: Zustand für Admin-Modus
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isPlzModalOpen, setIsPlzModalOpen] = useState<boolean>(false);
  const [isImpressumOpen, setIsImpressumOpen] = useState<boolean>(false);
  const [isDatenschutzOpen, setIsDatenschutzOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [plz, setPlz] = useState<string>(() => {
    return localStorage.getItem('milano_plz') || '51373';
  });

  const cartContext = useCart();
  const cartItems = cartContext?.cart || [];
  const totalPrice = cartContext?.totalPrice || 0;
  const clearCart = cartContext?.clearCart || (() => {});
  
  const [plzError, setPlzError] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('alle');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handlePlzSave = async (neuePlz: string) => {
    if (!/^\d{5}$/.test(neuePlz)) {
      setPlzError('Bitte eine gültige 5-stellige PLZ eingeben.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/liefergebiet/check/${neuePlz}`);
      const data = await response.json();

      if (data.erlaubt) {
        setPlz(neuePlz);
        localStorage.setItem('milano_plz', neuePlz);
        setPlzError('');
        setIsPlzModalOpen(false);
      } else {
        setPlzError('Wir beliefern aktuell nur Leverkusen!');
      }
    } catch (error) {
      console.error('Fehler beim API-Aufruf:', error);
      setPlzError('Verbindung zum Server fehlgeschlagen.');
    }
  };

  // <-- NEU: Wenn der Admin-Modus aktiv ist, rendern wir NUR das Dashboard
  if (isAdminMode) {
    return (
      <div>
        <div style={{ padding: '10px', backgroundColor: '#2d3748', borderBottom: '1px solid #4a5568' }}>
          <button 
            onClick={() => setIsAdminMode(false)}
            style={{ padding: '6px 12px', backgroundColor: '#4a5568', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ← Zurück zum Pizza-Shop
          </button>
        </div>
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div className="pml-app-wrapper">
      <Hero 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenPlz={() => {
          setPlzError('');
          setIsPlzModalOpen(true);
        }} 
        currentPlz={plz}
      />
      
      <SearchMenu 
        activeCategory={activeCategory}
        onCategoryChange={(cat) => setActiveCategory(cat)}
        onSearchChange={(term) => setSearchTerm(term)}
      />
      
      <Menu 
        activeCategory={activeCategory} 
        searchTerm={searchTerm} 
      />

      <Footer 
        onOpenImpressum={() => setIsImpressumOpen(true)} 
        onOpenDatenschutz={() => setIsDatenschutzOpen(true)}
      />

      <ImpressumModal 
        isOpen={isImpressumOpen} 
        onClose={() => setIsImpressumOpen(false)} 
      />

      <DatenschutzModal
        isOpen={isDatenschutzOpen}
        onClose={() => setIsDatenschutzOpen(false)}
      />

      <CheckoutForm 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        totalPrice={totalPrice}
        cartItems={cartItems}
        currentPlz={plz}
        onOrderSuccess={clearCart}
      />

      <PlzModal 
        isOpen={isPlzModalOpen}
        onClose={() => setIsPlzModalOpen(false)}
        onSave={handlePlzSave}
        currentPlz={plz}
        errorMessage={plzError}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* NEU: Ein kleiner, diskreter Button unten rechts in der Ecke für die Küche */}
      <button
        onClick={() => setIsAdminMode(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          opacity: 0.3,
          backgroundColor: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '10px',
          cursor: 'pointer',
          zIndex: 9999
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
      >
        🔑 Küchen-Login
      </button>
    </div>
  );
}

export default App;