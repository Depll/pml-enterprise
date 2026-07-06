import React from 'react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: (finalPrice: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOpenCheckout }) => {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();

  if (!isOpen) return null;

  const DISCOUNT_PERCENT = 10;
  const discountAmount = totalPrice * (DISCOUNT_PERCENT / 100);
  const finalTotal = totalPrice - discountAmount;

  const MINIMUM_ORDER_VALUE = 15.0;
  const isBelowMinimumOrder = finalTotal < MINIMUM_ORDER_VALUE && cart.length > 0;
  const missingAmount = MINIMUM_ORDER_VALUE - finalTotal;

  return (
    <div className="pml-cart-overlay" onClick={onClose}>
      <div className="pml-cart-drawer" onClick={(e) => e.stopPropagation()}>
        
        <div className="pml-cart-header">
          <h2>Dein Warenkorbb</h2>
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
                const itemPrice = Number(item.price ?? (item as any).preis ?? 0);
                const quantity = Number(item.quantity ?? (item as any).menge ?? 1);
                const selectedIngredients = item.selectedIngredients ?? item.selectedExtras ?? (item as any).gewaehlteZutaten ?? [];
                const removedIngredients = item.removedIngredients ?? (item as any).removedZutaten ?? (item as any).entfernteZutaten ?? [];
                const comment = item.comment ?? (item as any).anmerkung ?? '';

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

                        {selectedIngredients.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#319795', marginTop: '4px' }}>
                            + {selectedIngredients.map((ingredient: { name: string }) => ingredient.name).join(', ')}
                          </div>
                        )}

                        {removedIngredients.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#e53e3e', marginTop: '2px', textDecoration: 'line-through' }}>
                            ohne {removedIngredients.map((ingredient: { name: string }) => ingredient.name).join(', ')}
                          </div>
                        )}

                        {comment.trim() !== '' && (
                          <div style={{ fontSize: '12px', color: '#718096', marginTop: '6px', fontStyle: 'italic', backgroundColor: '#f7fafc', padding: '4px 8px', borderRadius: '4px', borderLeft: '2px solid #cbd5e0' }}>
                            📝 "{comment}"
                          </div>
                        )}
                      </div>
                      <span className="pml-item-delete" onClick={() => removeFromCart(item.cartItemId)} style={{ cursor: 'pointer' }}>🗑️</span>
                    </div>
                    
                    <div className="pml-cart-item-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <div className="pml-quantity-control" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => updateQuantity(item.cartItemId, -1)} style={{ padding: '2px 8px', cursor: 'pointer' }}>-</button>
                        <span>{quantity}x</span>
                        <button onClick={() => updateQuantity(item.cartItemId, 1)} style={{ padding: '2px 8px', cursor: 'pointer' }}>+</button>
                      </div>
                      
                      <span className="pml-item-price">
                        {(itemPrice * quantity).toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pml-cart-footer">
          {isBelowMinimumOrder && (
            <div style={{ backgroundColor: '#fffaf0', border: '1px solid #feebc8', color: '#c05621', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', textAlign: 'center', fontWeight: '500' }}>
              ⚠️ Mindestbestellwert von {MINIMUM_ORDER_VALUE.toFixed(2).replace('.', ',')} € (nach Rabatt) nicht erreicht.<br />
              Dir fehlen noch <strong>{missingAmount.toFixed(2).replace('.', ',')} €</strong>!
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
                <span>-{discountAmount.toFixed(2).replace('.', ',')} €</span>
              </div>
            </div>
          )}

          <div className="pml-price-summary-row pml-total-row" style={{ marginTop: '0' }}>
            <span>Gesamtsumme:</span>
            <span className="pml-total-price-badge">
              {(cart.length > 0 ? finalTotal : 0).toFixed(2).replace('.', ',')} €
            </span>
          </div>

          <div className="pml-cart-action-area" style={{ marginTop: '15px' }}>
            <button 
              className="pml-btn-address-submit" 
              disabled={cart.length === 0 || isBelowMinimumOrder}
              onClick={() => onOpenCheckout(finalTotal)}
              style={{
                opacity: (cart.length === 0 || isBelowMinimumOrder) ? 0.5 : 1,
                cursor: (cart.length === 0 || isBelowMinimumOrder) ? 'not-allowed' : 'pointer'
              }}
            >
              {isBelowMinimumOrder ? 'Mindestbestellwert beachten' : 'Zur Kasse gehen'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
