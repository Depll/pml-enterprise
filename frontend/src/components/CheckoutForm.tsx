import React, { useState } from 'react';

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  totalPrice: number;
  cartItems: any[];
  currentPlz: string;
  onOrderSuccess: () => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  isOpen, 
  onClose, 
  currentPlz, 
  totalPrice, 
  cartItems,
  onOrderSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    strasse: '',
    hausnummer: '',
    telefon: '',
    email: '',
    anmerkung: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const phoneRegex = /^[0-9+\s/-]{6,20}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!formData.name.trim()) newErrors.name = 'Name wird benötigt';
    if (!formData.strasse.trim()) newErrors.strasse = 'Straße wird benötigt';
    if (!formData.hausnummer.trim()) newErrors.hausnummer = 'Nr. wird benötigt';
    
    if (!phoneRegex.test(formData.telefon)) {
      newErrors.telefon = 'Ungültige Telefonnummer';
    }
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Positionen mappen: productId als Zahl senden & priceSnapshot hinzufügen
    const mappedPositions = cartItems.map((item) => {
      const activeExtras = item.gewaehlteZutaten || [];
      const activeRemoved = item.entfernteZutaten || [];

      return {
        productId: Number(item.id), 
        quantity: Number(item.menge || 1), 
        priceSnapshot: Number(item.preis || item.price || 0), 
        comment: item.anmerkung?.trim() || undefined, 
        selectedSize: undefined, 
        selectedOption: undefined,
        selectedIngredientsIds: activeExtras.length > 0 
          ? activeExtras.map((z: any) => Number(z.id)) 
          : undefined,
        removedIngredientsIds: activeRemoved.length > 0 
          ? activeRemoved.map((z: any) => Number(z.id)) 
          : undefined,
      };
    });

    const payload = {
      customerName: formData.name,
      street: formData.strasse,
      houseNumber: formData.hausnummer,
      postcode: String(currentPlz).trim(), 
      city: 'Leverkusen',
      phone: formData.telefon,
      email: formData.email?.trim() || undefined, 
      deliveryNote: formData.anmerkung?.trim() || undefined,
      totalPrice: Number(totalPrice), 
      positions: mappedPositions 
    };

    try {
      const response = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const neueBestellung = await response.json();
        
        alert('Bestellung erfolgreich abgeschickt!');
        onOrderSuccess(); 
        onClose();        

        localStorage.setItem('milano_last_order_id', neueBestellung.id.toString());
        
        window.location.href = `http://localhost:5173/?id=${neueBestellung.id}`;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("NestJS Validierungsfehler:", errorData);
        alert(`Fehler beim Senden: ${Array.isArray(errorData.message) ? errorData.message.join(', ') : (errorData.message || 'Bitte Eingaben prüfen!')}`);
      }
    } catch (error) {
      console.error('Verbindungsfehler zum Backend:', error);
      alert('Der Server antwortet nicht. Läuft das NestJS-Backend?');
    }
  };

  return (
    <div className="pml-modal-overlay" onClick={onClose} style={{ zIndex: 2500 }}>
      <div className="pml-modal-wrapper pml-checkout-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="pml-modal-header">
          <h2 className="pml-modal-title">Deine Bestellung</h2>
          <button className="pml-modal-close-btn" onClick={onClose}>&times;</button>
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
                  className={`pml-form-input ${errors.strasse ? 'pml-input-error' : ''}`}
                  value={formData.strasse}
                  onChange={(e) => setFormData({...formData, strasse: e.target.value})}
                />
                {errors.strasse && <span className="pml-error-text">{errors.strasse}</span>}
              </div>
              <div className="pml-form-group" style={{ flex: 1 }}>
                <label>Nr. *</label>
                <input 
                  type="text" 
                  className={`pml-form-input ${errors.hausnummer ? 'pml-input-error' : ''}`}
                  value={formData.hausnummer}
                  onChange={(e) => setFormData({...formData, hausnummer: e.target.value})}
                />
                {errors.hausnummer && <span className="pml-error-text">{errors.hausnummer}</span>}
              </div>
            </div>

            <div className="pml-form-row" style={{ display: 'flex', gap: '10px' }}>
              <div className="pml-form-group" style={{ flex: 1 }}>
                <label>PLZ *</label>
                <input 
                  type="text" 
                  className="pml-form-input"
                  value={currentPlz}
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
                className={`pml-form-input ${errors.telefon ? 'pml-input-error' : ''}`}
                value={formData.telefon}
                onChange={(e) => setFormData({...formData, telefon: e.target.value})}
              />
              {errors.telefon && <span className="pml-error-text">{errors.telefon}</span>}
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
                value={formData.anmerkung}
                onChange={(e) => setFormData({...formData, anmerkung: e.target.value})}
              />
            </div>

          </div>

          <div className="pml-checkout-footer" style={{ padding: '20px', borderTop: '1px solid #2d3748', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: '#718096', fontSize: '14px' }}>Gesamtsumme</span>
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