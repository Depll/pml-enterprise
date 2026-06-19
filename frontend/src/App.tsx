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

function App() {
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isPlzModalOpen, setIsPlzModalOpen] = useState<boolean>(false);
  const [isImpressumOpen, setIsImpressumOpen] = useState<boolean>(false);
  const [isDatenschutzOpen, setIsDatenschutzOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [plz, setPlz] = useState<string>(() => {
    return localStorage.getItem('milano_plz') || '51373';
  });

  // GEÄNDERT: Wir holen uns den Cart und den fertig berechneten Gesamtpreis direkt aus dem Context
  const context = useCart();
  const cartItems = context?.cart || [];
  const totalPrice = context?.totalPrice || 0; // <-- Das ersetzt die fehlerhafte reduce-Berechnung!
  
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
    </div>
  );
}

export default App;