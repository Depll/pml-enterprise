import React from 'react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: (finalPrice: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOpenCheckout }) => {
  const { cart, removeFromCart, updateMenge, totalPrice } = useCart();

  if (!isOpen) return null;

  const RABATT_PROZENT = 10;
  const rabattAbzug = totalPrice * (RABATT_PROZENT / 100);
  const endSumme = totalPrice - rabattAbzug;

  const MINDESTBESTELLWERT = 15.0;
  const istUnterMindestwert = endSumme < MINDESTBESTELLWERT && cart.length > 0;
  const fehlenderBetrag = MINDESTBESTELLWERT - endSumme;

  return (
    <div className="pml-cart-overlay" onClick={onClose}>
      <div className="pml-cart-drawer" onClick={(e) => e.stopPropagation()}>
        
        <div className="pml-cart-header">
          <h2>Dein Warenkorb</h2>
          <span className="pml-close-cart-btn" onClick={onClose}>&times;</span>
        </div>

        <div className="pml-cart-body">
          {cart.length === 0 ? (
            <div className="pml-cart-empty-section">
              <div className="pml-empty-msg-container">
                <p>Dein Warenkorb ist leer. 🍕</p>
              </div>
            </div>
          ) : (
            <div className="pml-cart-items-wrapper">
              {cart.map((item) => {
                const itemPreis = item.preis !== undefined ? item.preis : item.price;

                return (
                  <div key={item.cartItemId} className="pml-cart-item-card">
                    <div className="pml-cart-item-header">
                      <div>
                        <span className="pml-item-title" style={{ fontWeight: 'bold', display: 'block' }}>
                          {item.name} {item.selectedSize ? `(${item.selectedSize})` : ''}
                        </span>
                        
                        {item.selectedOption && (
                          <div style={{ fontSize: '12px', color: '#dd6b20', marginTop: '2px' }}>
                            Variante: {item.selectedOption}
                          </div>
                        )}

                        {item.gewaehlteZutaten && item.gewaehlteZutaten.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#319795', marginTop: '4px' }}>
                            + {item.gewaehlteZutaten.map(z => z.name).join(', ')}
                          </div>
                        )}

                        {item.entfernteZutaten && item.entfernteZutaten.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#e53e3e', marginTop: '2px', textDecoration: 'line-through' }}>
                            ohne {item.entfernteZutaten.map(z => z.name).join(', ')}
                          </div>
                        )}

                        {item.anmerkung && item.anmerkung.trim() !== '' && (
                          <div style={{ fontSize: '12px', color: '#718096', marginTop: '6px', fontStyle: 'italic', backgroundColor: '#f7fafc', padding: '4px 8px', borderRadius: '4px', borderLeft: '2px solid #cbd5e0' }}>
                            📝 "{item.anmerkung}"
                          </div>
                        )}
                      </div>
                      <span className="pml-item-delete" onClick={() => removeFromCart(item.cartItemId)} style={{ cursor: 'pointer' }}>🗑️</span>
                    </div>
                    
                    <div className="pml-cart-item-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <div className="pml-quantity-control" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => updateMenge(item.cartItemId, -1)} style={{ padding: '2px 8px', cursor: 'pointer' }}>-</button>
                        <span>{item.menge}x</span>
                        <button onClick={() => updateMenge(item.cartItemId, 1)} style={{ padding: '2px 8px', cursor: 'pointer' }}>+</button>
                      </div>
                      
                      <span className="pml-item-price">
                        {(Number(itemPreis || 0) * item.menge).toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pml-cart-footer">
          {istUnterMindestwert && (
            <div style={{ backgroundColor: '#fffaf0', border: '1px solid #feebc8', color: '#c05621', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', textAlign: 'center', fontWeight: '500' }}>
              ⚠️ Mindestbestellwert von {MINDESTBESTELLWERT.toFixed(2).replace('.', ',')} € (nach Rabatt) nicht erreicht.<br />
              Dir fehlen noch <strong>{fehlenderBetrag.toFixed(2).replace('.', ',')} €</strong>!
            </div>
          )}

          {cart.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#4a5568' }}>
                <span>Zwischensumme:</span>
                <span>{totalPrice.toFixed(2).replace('.', ',')} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#10b981', fontWeight: '500' }}>
                <span>🌐 Web-Rabatt (10%):</span>
                <span>-{rabattAbzug.toFixed(2).replace('.', ',')} €</span>
              </div>
            </div>
          )}

          <div className="pml-price-summary-row pml-total-row" style={{ marginTop: '0' }}>
            <span>Gesamtsumme:</span>
            <span className="pml-total-price-badge">
              {(cart.length > 0 ? endSumme : 0).toFixed(2).replace('.', ',')} €
            </span>
          </div>

          <div className="pml-cart-action-area" style={{ marginTop: '15px' }}>
            <button 
              className="pml-btn-address-submit" 
              disabled={cart.length === 0 || istUnterMindestwert}
              onClick={() => onOpenCheckout(endSumme)}
              style={{
                opacity: (cart.length === 0 || istUnterMindestwert) ? 0.5 : 1,
                cursor: (cart.length === 0 || istUnterMindestwert) ? 'not-allowed' : 'pointer'
              }}
            >
              {istUnterMindestwert ? 'Mindestbestellwert beachten' : 'Zur Kasse gehen'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};