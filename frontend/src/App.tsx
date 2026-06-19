import React, { useState } from 'react';
import { Hero } from './components/Hero';
import { SearchMenu } from './components/SearchMenu';
import { Menu } from './components/Menu';
import { Footer } from './components/Footer';
import { PlzModal } from './components/PlzModal';
import { CartDrawer } from './components/CartDrawer';
import { CartProvider } from './context/CartContext';
import { ImpressumModal } from './components/ImpressumModal';
import { DatenschutzModal } from './components/DatenschutzModal';
import { CheckoutForm } from './components/CheckoutForm';

function App() {
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isPlzModalOpen, setIsPlzModalOpen] = useState<boolean>(false);
  const [isImpressumOpen, setIsImpressumOpen] = useState<boolean>(false);
  const [isDatenschutzOpen, setIsDatenschutzOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [plz, setPlz] = useState<string>('51373'); // Startwert ist schon echtes Leverkusen!
  
  // NEU: Zustand für Fehlermeldungen im Modal
  const [plzError, setPlzError] = useState<string>('');

  const [activeCategory, setActiveCategory] = useState<string>('alle');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const echteKategorien = ['Pizza', 'Pasta', 'Salate', 'Indisch', 'Getränke'];

  // NEU: Die Validierungs-Funktion für das Backend
  const handlePlzSave = async (neuePlz: string) => {
    // Kurzer Vorab-Check im Frontend
    if (!/^\d{5}$/.test(neuePlz)) {
      setPlzError('Bitte eine gültige 5-stellige PLZ eingeben.');
      return;
    }

    try {
      // Verbindung zum NestJS-Controller (Schritt 3 aus dem vorherigen Schritt)
      const response = await fetch(`http://localhost:3000/api/liefergebiet/check/${neuePlz}`);
      const data = await response.json();

      if (data.erlaubt) {
        // PLZ existiert in der DB (gehört zu Leverkusen)
        setPlz(neuePlz);
        setPlzError(''); // Fehler zurücksetzen
        setIsPlzModalOpen(false); // Modal erst jetzt schließen!
      } else {
        // PLZ nicht in der DB gefunden
        setPlzError('Wir beliefern aktuell nur Leverkusen!');
      }
    } catch (error) {
      console.error('Fehler beim API-Aufruf:', error);
      setPlzError('Verbindung zum Server fehlgeschlagen.');
    }
  };

  return (
    <CartProvider>
      <div className="pml-app-wrapper">
        <Hero 
          onOpenCart={() => setIsCartOpen(true)} 
          onOpenPlz={() => {
            setPlzError(''); // Fehler leeren beim Öffnen
            setIsPlzModalOpen(true);
          }} 
          currentPlz={plz}
        />
        
        {/* ... Rest der Komponenten bleibt exakt gleich ... */}
        <SearchMenu 
          categories={echteKategorien}
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
          totalPrice={0}
          cartItems={[]}
        />

        {/* GEÄNDERT: Hier geben wir jetzt handlePlzSave und den Error mit! */}
        <PlzModal 
          isOpen={isPlzModalOpen}
          onClose={() => setIsPlzModalOpen(false)}
          onSave={handlePlzSave} // Nutzt jetzt unsere neue DB-Prüffunktion
          currentPlz={plz}
          errorMessage={plzError} // Reiche den Fehler runter ans Modal (musst du im Interface von PlzModal hinzufügen!)
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
    </CartProvider>
  );
}

export default App;