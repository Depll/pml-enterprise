import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Menu } from './components/Menu';
import { Footer } from './components/Footer';
import { PlzModal } from './components/PLZModal';
import { CartDrawer } from './components/CartDrawer'; // Neu importiert
import { CartProvider } from './context/CartContext';

function App() {
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isPlzModalOpen, setIsPlzModalOpen] = useState<boolean>(false);
  const [plz, setPlz] = useState<string>('51373');

  return (
    <CartProvider>
      <div className="pml-app-wrapper">
        <Navbar 
          onOpenCart={() => setIsCartOpen(true)} 
          onOpenPlz={() => setIsPlzModalOpen(true)} 
          currentPlz={plz}
        />
        
        <Menu />

        <Footer />

        <PlzModal 
          isOpen={isPlzModalOpen}
          onClose={() => setIsPlzModalOpen(false)}
          onSave={(neuePlz) => setPlz(neuePlz)}
          currentPlz={plz}
        />

        {/* Der Cart Drawer wird hier gesteuert */}
        <CartDrawer 
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
        />
      </div>
    </CartProvider>
  );
}

export default App;