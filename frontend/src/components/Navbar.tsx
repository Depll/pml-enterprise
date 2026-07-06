import React from 'react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenPostcode: () => void;
  currentPostcode: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart, onOpenPostcode, currentPostcode }) => {
  const context = useCart();
  const cart = context?.cart || [];

  const totalItems = cart.reduce((sum: number, item: any) => {
    const quantity = item.quantity || item.menge || 1;
    return sum + quantity;
  }, 0);

  return (
    <header className="pml-navbar-milano">
      <div className="pml-nav-container">
        
        <div className="pml-logo-box">
          <span className="pml-logo-top">Milano</span>
          <span className="pml-logo-bottom">PIZZERIA</span>
        </div>

        <button className="pml-delivery-area" id="delivery-trigger" onClick={onOpenPostcode}>
          <span className="material-symbols-outlined pml-pin-icon">location_on</span>
          <span className="pml-delivery-text">
            Liefergebiet: <strong id="nav-postcode">{currentPostcode || 'Prüfen'}</strong>
            <span className="pml-change-link">Ändern</span>
          </span>
        </button>

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
