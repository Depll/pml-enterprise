import React, { useState, useEffect } from 'react';

interface Zutat {
  id: number;
  name: string;
  extraPrice: string | number; // von 'aufpreis' zu 'extraPrice'
}

interface Product {
  id: number;
  name: string;
  description: string; // von 'beschreibung' zu 'description'
  price: string | number; // von 'preis' zu 'price'
  ingredients: Zutat[]; // von 'zutaten' zu 'ingredients'
}

interface ZutatenModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (
    product: { id: number; name: string; preis: number }, 
    selectedExtras: Zutat[], 
    removedZutaten: Array<{ id: number; name: string }>,
    anmerkung: string
  ) => void;
}

export const ZutatenModal: React.FC<ZutatenModalProps> = ({ isOpen, product, onClose, onConfirm }) => {
  const [selectedExtras, setSelectedExtras] = useState<Zutat[]>([]);
  const [removedZutaten, setRemovedZutaten] = useState<Array<{ id: number; name: string }>>([]);
  const [anmerkung, setAnmerkung] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedExtras([]);
      setRemovedZutaten([]);
      setAnmerkung('');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const basePrice = Number(product.price); // product.price statt product.preis
  const extrasPrice = selectedExtras.reduce((sum, zutat) => sum + Number(zutat.extraPrice), 0); // zutat.extraPrice statt zutat.aufpreis
  const currentTotalPrice = basePrice + extrasPrice;

  // Extrahiert die Standard-Zutaten direkt aus der englischen "description"
  const getStandardZutaten = () => {
    if (!product.description || product.description.trim() === '') return []; // product.description statt product.beschreibung
    
    const saubererText = product.description
      .replace(/^[mM]it\s+/, '')
      .replace(/^[fF]rische\s+/, '');
      
    const teile = saubererText.split(/,|\bund\b/).map(z => z.trim());
    
    return teile
      .filter(z => z.length > 0 && !z.toLowerCase().includes('klassiker') && !z.toLowerCase().includes('pfand'))
      .map((name, index) => ({
        id: 9000 + index,
        name: name.charAt(0).toUpperCase() + name.slice(1)
      }));
  };

  const standardZutaten = getStandardZutaten();

  const handleToggleExtra = (zutat: Zutat) => {
    setSelectedExtras((prev) =>
      prev.some((z) => z.id === zutat.id) ? prev.filter((z) => z.id !== zutat.id) : [...prev, zutat]
    );
  };

  const handleToggleRemoveStandard = (zutat: { id: number; name: string }) => {
    setRemovedZutaten((prev) =>
      prev.some((z) => z.id === zutat.id) ? prev.filter((z) => z.id !== zutat.id) : [...prev, zutat]
    );
  };

  return (
    <div className="pml-cart-overlay" onClick={onClose} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
      <div className="pml-cart-drawer" onClick={(e) => e.stopPropagation()} style={{ height: 'auto', maxHeight: '90vh', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
        
        <div className="pml-cart-header">
          <div>
            <h2 style={{ margin: 0 }}>{product.name} anpassen</h2>
            {/* product.description statt product.beschreibung */}
            <p style={{ fontSize: '14px', color: '#718096', margin: '4px 0 0 0' }}>{product.description}</p>
          </div>
          <span className="pml-close-cart-btn" onClick={onClose}>&times;</span>
        </div>

        <div className="pml-cart-body" style={{ padding: '20px', overflowY: 'auto', maxHeight: '55vh' }}>
          
          {/* SEKTION 1: STANDARD-ZUTATEN ABWÄHLEN */}
          {standardZutaten.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '10px', color: '#e53e3e' }}>Zutaten abwählen:</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {standardZutaten.map((z) => {
                  const isRemoved = removedZutaten.some((r) => r.name === z.name);
                  return (
                    <button
                      key={z.id}
                      onClick={() => handleToggleRemoveStandard(z)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        backgroundColor: isRemoved ? '#fed7d7' : '#edf2f7',
                        color: isRemoved ? '#9b2c2c' : '#2d3748',
                        fontWeight: 500,
                        textDecoration: isRemoved ? 'line-through' : 'none'
                      }}
                    >
                      {isRemoved ? '❌ Ohne ' : '✔️ '} {z.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEKTION 2: EXTRAS HINZUFÜGEN */}
          <h3 style={{ fontSize: '15px', marginBottom: '10px', color: '#319795' }}>Extra Zutaten hinzufügen:</h3>
          {/* product.ingredients statt product.zutaten */}
          {product.ingredients && product.ingredients.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {product.ingredients.map((zutat) => {
                const isChecked = selectedExtras.some((z) => z.id === zutat.id);
                return (
                  <label key={zutat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', backgroundColor: isChecked ? '#e6fffa' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleToggleExtra(zutat)} style={{ width: '16px', height: '16px' }} />
                      <span style={{ fontWeight: 500 }}>{zutat.name}</span>
                    </div>
                    {/* zutat.extraPrice statt zutat.aufpreis */}
                    <span style={{ color: '#4a5568', fontSize: '14px' }}>+ {Number(zutat.extraPrice).toFixed(2).replace('.', ',')} €</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#a0aec0', fontSize: '13px' }}>Füge für dieses Produkt in pgAdmin Verknüpfungen in <i>ingredient</i> hinzu, um Extras zu sehen.</p>
          )}

          {/* SEKTION 3: TEXTANMERKUNG */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Anmerkung für die Küche:</h3>
            <textarea
              value={anmerkung}
              onChange={(e) => setAnmerkung(e.target.value)}
              placeholder="z.B. Bitte geschnitten, extra knusprig..."
              style={{ width: '100%', minHeight: '60px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical', fontSize: '14px', fontFamily: 'inherit' }}
            />
          </div>

        </div>

        <div className="pml-cart-footer" style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
          <div className="pml-price-summary-row pml-total-row" style={{ marginBottom: '15px' }}>
            <span>Preis gesamt:</span>
            <span className="pml-total-price-badge">{currentTotalPrice.toFixed(2).replace('.', ',')} €</span>
          </div>
          <button 
            className="pml-btn-address-submit" 
            onClick={() => { 
              onConfirm({ id: product.id, name: product.name, preis: basePrice }, selectedExtras, removedZutaten, anmerkung); 
              onClose(); 
            }} 
            style={{ width: '100%' }}
          >
            In den Warenkorb
          </button>
        </div>

      </div>
    </div>
  );
};