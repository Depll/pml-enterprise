import React from 'react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenPlz: () => void;
  currentPlz: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart, onOpenPlz, currentPlz }) => {
  const context = useCart();
  const cart = context?.cart || [];

  // Berechnet die Gesamtzahl der Artikel und fängt sowohl deutsche als auch englische Keys ab
  const totalItems = cart.reduce((sum: number, item: any) => {
    const qty = item.quantity || item.anzahl || 1;
    return sum + qty;
  }, 0);

  return (
    <header className="pml-navbar-milano">
      <div className="pml-nav-container">
        
        <div className="pml-logo-box">
          <span className="pml-logo-top">Milano</span>
          <span className="pml-logo-bottom">PIZZERIA</span>
        </div>

        {/* Klick führt onOpenPlz aus */}
        <button className="pml-delivery-area" id="delivery-trigger" onClick={onOpenPlz}>
          <span className="material-symbols-outlined pml-pin-icon">location_on</span>
          <span className="pml-delivery-text">
            Liefergebiet: <strong id="nav-plz">{currentPlz || 'Prüfen'}</strong>
            <span className="pml-change-link">Ändern</span>
          </span>
        </button>

        {/* Klick führt onOpenCart aus */}
        <button className="pml-cart-box" onClick={onOpenCart}>
          <span className="pml-cart-icon">🛒</span>
          <span className={`pml-cart-badge ${totalItems === 0 ? 'pml-hidden' : ''}`}>
            ({totalItems})
          </span>
        </button>

      </div>
    </header>
  );
};