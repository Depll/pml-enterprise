import { useState, type SubmitEvent } from 'react';
import { apiService } from '../services/api';

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  totalPrice: number;
  cartItems: any[];
  currentPostcode: string;
  voucherCode?: string; // NEU: Gutscheincode aus dem Warenkorb
  onOrderSuccess: () => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  isOpen, 
  onClose, 
  currentPostcode, 
  totalPrice, 
  cartItems,
  voucherCode, // NEU
  onOrderSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    houseNumber: '',
    phone: '',
    email: '',
    comment: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const phoneRegex = /^[0-9+\s/-]{6,20}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!formData.name.trim()) newErrors.name = 'Name wird benötigt';
    if (!formData.street.trim()) newErrors.street = 'Straße wird benötigt';
    if (!formData.houseNumber.trim()) newErrors.houseNumber = 'Nr. wird benötigt';
    
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Ungültige Telefonnummer';
    }
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    const mappedPositions = cartItems.map((item) => {
      const activeExtras = item.selectedIngredients || item.selectedExtras || item.gewaehlteZutaten || [];
      const activeRemoved = item.removedIngredients || item.removedZutaten || item.entfernteZutaten || [];

      return {
        productId: Number(item.id), 
        quantity: Number(item.quantity || item.menge || 1), 
        priceSnapshot: Number(item.price || item.preis || 0), 
        comment: (item.comment || item.anmerkung)?.trim() || undefined, 
        selectedSize: item.selectedSize || undefined, 
        selectedOption: item.selectedOption || undefined,
        selectedIngredientsIds: activeExtras.length > 0 
          ? activeExtras.map((ingredient: any) => Number(ingredient.id)) 
          : undefined,
        removedIngredientsIds: activeRemoved.length > 0 
          ? activeRemoved.map((ingredient: any) => Number(ingredient.id)) 
          : undefined,
      };
    });

    const payload = {
      customerName: formData.name,
      street: formData.street,
      houseNumber: formData.houseNumber,
      postcode: String(currentPostcode).trim(), 
      city: 'Leverkusen',
      phone: formData.phone,
      email: formData.email?.trim() || undefined, 
      deliveryNote: formData.comment?.trim() || undefined,
      totalPrice: Number(totalPrice), 
      voucherCode: voucherCode || undefined, // NEU: Gutscheincode mitsenden
      positions: mappedPositions 
    };

    try {
      const newOrder = await apiService.createOrder(payload);

      alert('Bestellung erfolgreich abgeschickt!');
      onOrderSuccess(); 
      onClose();        

      localStorage.setItem('milano_last_order_id', newOrder.id.toString());
      window.location.href = `${window.location.origin}/?id=${newOrder.id}`;

    } catch (errorData: any) {
      console.error("NestJS Validierungsfehler:", errorData);
      alert(
        `Fehler beim Senden: ${
          Array.isArray(errorData.message) 
            ? errorData.message.join(', ') 
            : (errorData.message || 'Bitte Eingaben prüfen!')
        }`
      );
    }
  };

  return (
    <div className="pml-modal-overlay" onClick={onClose} style={{ zIndex: 2500 }}>
      <div className="pml-modal-wrapper pml-checkout-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="pml-modal-header">
          <h2 className="pml-modal-title">Deine Bestellung</h2>
          <button type="button" className="pml-modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="pml-checkout-form">
          <div className="pml-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            
            <div className="pml-form-group">
              <label>Vor- & Nachname *</label>
              <input 
                type="text" 
                className={`pml-form-input ${errors.name ? 'pml-input-error' : ''}`}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              {errors.name && <span className="pml-error-text">{errors.name}</span>}
            </div>

            <div className="pml-form-row" style={{ display: 'flex', gap: '10px' }}>
              <div className="pml-form-group" style={{ flex: 3 }}>
                <label>Straße *</label>
                <input 
                  type="text" 
                  className={`pml-form-input ${errors.street ? 'pml-input-error' : ''}`}
                  value={formData.street}
                  onChange={(e) => setFormData({...formData, street: e.target.value})}
                />
                {errors.street && <span className="pml-error-text">{errors.street}</span>}
              </div>
              <div className="pml-form-group" style={{ flex: 1 }}>
                <label>Nr. *</label>
                <input 
                  type="text" 
                  className={`pml-form-input ${errors.houseNumber ? 'pml-input-error' : ''}`}
                  value={formData.houseNumber}
                  onChange={(e) => setFormData({...formData, houseNumber: e.target.value})}
                />
                {errors.houseNumber && <span className="pml-error-text">{errors.houseNumber}</span>}
              </div>
            </div>

            <div className="pml-form-row" style={{ display: 'flex', gap: '10px' }}>
              <div className="pml-form-group" style={{ flex: 1 }}>
                <label>PLZ *</label>
                <input 
                  type="text" 
                  className="pml-form-input"
                  value={currentPostcode}
                  disabled 
                />
              </div>
              
              <div className="pml-form-group" style={{ flex: 2 }}>
                <label>Stadt</label>
                <input 
                  type="text" 
                  className="pml-form-input" 
                  value="Leverkusen" 
                  disabled 
                />
              </div>
            </div>

            <div className="pml-form-group">
              <label>Telefonnummer *</label>
              <input 
                type="text" 
                placeholder="z.B. 01761234567"
                className={`pml-form-input ${errors.phone ? 'pml-input-error' : ''}`}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              {errors.phone && <span className="pml-error-text">{errors.phone}</span>}
            </div>

            <div className="pml-form-group">
              <label>E-Mail-Adresse (Optional)</label>
              <input 
                type="email" 
                className={`pml-form-input ${errors.email ? 'pml-input-error' : ''}`}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              {errors.email && <span className="pml-error-text">{errors.email}</span>}
            </div>

            <div className="pml-form-group">
              <label>Anmerkung zur Lieferung</label>
              <textarea 
                className="pml-form-input" 
                rows={3}
                placeholder="z.B. Bitte im Erdgeschoss klingeln..."
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
              />
            </div>

          </div>

          <div className="pml-checkout-footer" style={{ padding: '20px', borderTop: '1px solid #2d3748', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: '#718096', fontSize: '14px' }}>
                Gesamtsumme {voucherCode ? `(inkl. Gutschein ${voucherCode})` : ''}
              </span>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                {totalPrice.toFixed(2).replace('.', ',')} €
              </div>
            </div>
            <button type="submit" className="pml-btn-confirm-checkout" style={{ padding: '12px 24px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Kostenpflichtig bestellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};