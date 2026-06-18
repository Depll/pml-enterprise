import React, { useState } from 'react';

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  totalPrice: number;
  cartItems: any[];
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ isOpen, onClose, totalPrice, cartItems }) => {
  const [formData, setFormData] = useState({
    name: '',
    strasse: '',
    hausnummer: '',
    plz: '51373',
    stadt: 'Leverkusen',
    telefon: '',
    email: '',
    anmerkung: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Regex-Validierungen
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Telefonnummer: Nur Zahlen, Leerzeichen, Schrägstrich, Bindestrich, Plus. Mindestens 6 Zeichen.
    const phoneRegex = /^[0-9+\s/-]{6,20}$/;
    // E-Mail: Standard-Validierung
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // PLZ: Exakt 5 Zahlen
    const plzRegex = /^[0-9]{5}$/;

    if (!formData.name.trim()) newErrors.name = 'Name wird benötigt';
    if (!formData.strasse.trim()) newErrors.strasse = 'Straße wird benötigt';
    if (!formData.hausnummer.trim()) newErrors.hausnummer = 'Nr. wird benötigt';
    
    if (!plzRegex.test(formData.plz)) {
      newErrors.plz = 'Ungültige PLZ (5 Stellen erforderlich)';
    }
    if (!phoneRegex.test(formData.telefon)) {
      newErrors.telefon = 'Ungültige Telefonnummer';
    }
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      alert('Bestellung erfolgreich abgeschickt! (Backend-Anbindung folgt)');
      // Hier schicken wir die Daten später ans Express-Backend
      console.log('Bestelldaten:', { kunde: formData, produkte: cartItems, gesamt: totalPrice });
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
            
            {/* Name */}
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

            {/* Straße und Hausnummer */}
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

            {/* PLZ und Stadt */}
            <div className="pml-form-row" style={{ display: 'flex', gap: '10px' }}>
              <div className="pml-form-group" style={{ flex: 1 }}>
                <label>PLZ *</label>
                <input 
                  type="text" 
                  className={`pml-form-input ${errors.plz ? 'pml-input-error' : ''}`}
                  value={formData.plz}
                  onChange={(e) => setFormData({...formData, plz: e.target.value})}
                />
                {errors.plz && <span className="pml-error-text">{errors.plz}</span>}
              </div>
              <div className="pml-form-group" style={{ flex: 2 }}>
                <label>Stadt</label>
                <input type="text" className="pml-form-input" value={formData.stadt} disabled />
              </div>
            </div>

            {/* Telefon */}
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

            {/* E-Mail */}
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

            {/* Anmerkungen */}
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

          {/* Footer des Formulars */}
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