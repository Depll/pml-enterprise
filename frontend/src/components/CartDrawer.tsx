import React from 'react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOpenCheckout }) => {
  const { cart, removeFromCart, updateMenge, totalPrice } = useCart();

  if (!isOpen) return null;

  return (
    <div className="pml-cart-overlay" onClick={onClose}>
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
              {cart.map((item, index) => {
                // Da ID bei identischen Produkten gleich sein kann, nutzen wir hier am besten eine Kombi oder den Index als Key
                const itemKey = `${item.id}-${index}`;

                return (
                  <div key={itemKey} className="pml-cart-item-card">
                    <div className="pml-cart-item-header">
                      <div>
                        <span className="pml-item-title">{item.name}</span>
                        
                        {/* 1. GEWÄHLTE EXTRAS */}
                        {item.gewaehlteZutaten && item.gewaehlteZutaten.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#319795', marginTop: '4px' }}>
                            + {item.gewaehlteZutaten.map(z => z.name).join(', ')}
                          </div>
                        )}

                        {/* 2. NEU: ENTFERNTE ZUTATEN */}
                        {item.entfernteZutaten && item.entfernteZutaten.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#e53e3e', marginTop: '2px', textDecoration: 'line-through' }}>
                            ohne {item.entfernteZutaten.map(z => z.name).join(', ')}
                          </div>
                        )}

                        {/* 3. NEU: ANMERKUNG FÜR DIE KÜCHE */}
                        {item.anmerkung && item.anmerkung.trim() !== '' && (
                          <div style={{ fontSize: '12px', color: '#718096', marginTop: '6px', fontStyle: 'italic', backgroundColor: '#f7fafc', padding: '4px 8px', borderRadius: '4px', borderLeft: '2px solid #cbd5e0' }}>
                            📝 "{item.anmerkung}"
                          </div>
                        )}
                      </div>
                      <span className="pml-item-delete" onClick={() => removeFromCart(item.id)}>🗑️</span>
                    </div>
                    
                    <div className="pml-cart-item-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <div className="pml-quantity-control" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => updateMenge(item.id, -1)}
                          style={{ padding: '2px 8px', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span>{item.menge}x</span>
                        <button 
                          onClick={() => updateMenge(item.id, 1)}
                          style={{ padding: '2px 8px', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>
                      
                      <span className="pml-item-price">
                        {(item.preis * item.menge).toFixed(2).replace('.', ',')} €
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
              {totalPrice.toFixed(2).replace('.', ',')} €
            </span>
          </div>
          <div className="pml-cart-action-area">
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