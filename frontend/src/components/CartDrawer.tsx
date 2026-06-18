import React from 'react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void; // Hier deklariert
}

// Hier fügen wir onOpenCheckout in den Klammern hinzu, damit wir es nutzen können:
export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOpenCheckout }) => {
  const context = useCart();
  const cart = context?.cart || [];
  const removeFromCart = context?.removeFromCart; 

  if (!isOpen) return null;

  // Gesamtsumme berechnen
  const totalBestellung = cart.reduce((sum: number, item: any) => {
    const qty = item.anzahl || item.quantity || 1;
    return sum + (Number(item.preis) * qty);
  }, 0);

  return (
    <div className="pml-cart-overlay" onClick={onClose}>
      {/* stopPropagation verhindert, dass der Drawer schließt, wenn man in den Drawer klickt */}
      <div className="pml-cart-drawer" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="pml-cart-header">
          <h2>Dein Warenkorb</h2>
          <span className="pml-close-cart-btn" onClick={onClose}>&times;</span>
        </div>

        {/* Body */}
        <div className="pml-cart-body">
          {cart.length === 0 ? (
            <div className="pml-cart-empty-section">
              <div className="pml-empty-msg-container">
                <p>Dein Warenkorb ist leer. 🍕</p>
              </div>
            </div>
          ) : (
            <div className="pml-cart-items-wrapper">
              {cart.map((item: any) => {
                const qty = item.anzahl || item.quantity || 1;
                return (
                  <div key={item.id} className="pml-cart-item-card">
                    <div className="pml-cart-item-header">
                      <span className="pml-item-title">{item.name}</span>
                      {removeFromCart && (
                        <span className="pml-item-delete" onClick={() => removeFromCart(item.id)}>🗑️</span>
                      )}
                    </div>
                    <div className="pml-cart-item-footer">
                      <span className="pml-quantity-control">Anzahl: {qty}</span>
                      <span className="pml-item-price">
                        {(Number(item.preis) * qty).toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pml-cart-footer">
          <div className="pml-price-summary-row pml-total-row">
            <span>Gesamtsumme:</span>
            <span className="pml-total-price-badge">
              {totalBestellung.toFixed(2).replace('.', ',')} €
            </span>
          </div>
          <div className="pml-cart-action-area">
            {/* Hier ist jetzt der Klick-Event aktiv verknüpft */}
            <button 
              className="pml-btn-address-submit" 
              disabled={cart.length === 0}
              onClick={onOpenCheckout}
            >
              Zur Kasse gehen
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};