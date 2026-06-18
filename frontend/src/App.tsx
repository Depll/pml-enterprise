import React, { useState } from 'react';
import { Hero } from './components/Hero';
import { SearchMenu } from './components/SearchMenu';
import { Menu } from './components/Menu';
import { Footer } from './components/Footer';
import { PlzModal } from './components/PLZModal';
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
  const [plz, setPlz] = useState<string>('51373');
  
  const [activeCategory, setActiveCategory] = useState<string>('alle');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const echteKategorien = ['Pizza', 'Pasta', 'Salate', 'Indisch', 'Getränke'];

  return (
    <CartProvider>
      <div className="pml-app-wrapper">
        <Hero 
          onOpenCart={() => setIsCartOpen(true)} 
          onOpenPlz={() => setIsPlzModalOpen(true)} 
          currentPlz={plz}
        />
        
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
          totalPrice={0} // Wird später dynamisch über den Cart-Context ausgelesen
          cartItems={[]} // Wird später dynamisch über den Cart-Context ausgelesen
        />

        <PlzModal 
          isOpen={isPlzModalOpen}
          onClose={() => setIsPlzModalOpen(false)}
          onSave={(neuePlz) => setPlz(neuePlz)}
          currentPlz={plz}
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