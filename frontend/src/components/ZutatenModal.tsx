import React, { useState, useEffect } from 'react';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface Zutat {
  id: number;
  name: string;
  extraPrice: string | number;
}

interface ProductSize {
  name: string;
  price: number;
  extraIngredientPrice?: number; // Liest den dynamischen Zutaten-Aufpreis aus deinem DB-JSON
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: string | number;
  ingredients: Zutat[];
  sizes: ProductSize[] | null;  // jsonb aus der DB
  options: string[] | null;     // jsonb aus der DB
}

interface ZutatenModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (
    product: { id: number; name: string; preis: number }, 
    selectedExtras: Zutat[], 
    removedZutaten: Array<{ id: number; name: string }>,
    anmerkung: string,
    selectedSize: string | null,
    selectedOption: string | null
  ) => void;
}

export const ZutatenModal: React.FC<ZutatenModalProps> = ({ isOpen, product, onClose, onConfirm }) => {
  // State-Management für die Benutzerauswahl
  const [selectedExtras, setSelectedExtras] = useState<Zutat[]>([]);
  const [removedZutaten, setRemovedZutaten] = useState<Array<{ id: number; name: string }>>([]);
  const [anmerkung, setAnmerkung] = useState<string>('');
  
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Zurücksetzen und Initialisieren bei jedem Öffnen eines Produkts
  useEffect(() => {
    if (isOpen && product) {
      setSelectedExtras([]);
      setRemovedZutaten([]);
      setAnmerkung('');
      
      // Falls Größen im JSON existieren (z. B. Pizza), wähle die erste ("Normal") standardmäßig aus
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      } else {
        setSelectedSize(null);
      }

      // Falls Optionen im JSON existieren (z. B. Nudeln), wähle die erste Option standardmäßig aus
      if (product.options && product.options.length > 0) {
        setSelectedOption(product.options[0]);
      } else {
        setSelectedOption(null);
      }
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // ==========================================
  // DYNAMISCHE PREISKALKULATION
  // ==========================================
  
  // 1. Basispreis: Entweder der Preis der gewählten Größe oder der Standard-Produktpreis
  const activeBasePrice = selectedSize ? Number(selectedSize.price) : Number(product.price);

  // 2. Extras-Aufpreis: Wenn die ausgewählte Größe einen eigenen "extraIngredientPrice" vorgibt, nimm diesen.
  const extrasPrice = selectedExtras.reduce((sum, zutat) => {
    if (selectedSize && typeof selectedSize.extraIngredientPrice === 'number') {
      return sum + selectedSize.extraIngredientPrice;
    }
    return sum + Number(zutat.extraPrice);
  }, 0);

  // 3. Gesamtsumme
  const currentTotalPrice = activeBasePrice + extrasPrice;

  // Extrahiert Standard-Zutaten aus der Beschreibung
  const getStandardZutaten = () => {
    if (!product.description || product.description.trim() === '') return [];
    const saubererText = product.description.replace(/^[mM]it\s+/, '').replace(/^[fF]rische\s+/, '');
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
      <div className="pml-cart-drawer" onClick={(e) => e.stopPropagation()} style={{ height: 'auto', maxHeight: '95vh', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
        
        {/* MODAL HEADER */}
        <div className="pml-cart-header">
          <div>
            <h2 style={{ margin: 0 }}>{product.name} anpassen</h2>
            <p style={{ fontSize: '14px', color: '#718096', margin: '4px 0 0 0' }}>{product.description}</p>
          </div>
          <span className="pml-close-cart-btn" onClick={onClose}>&times;</span>
        </div>

        {/* MODAL BODY */}
        <div className="pml-cart-body" style={{ padding: '20px', overflowY: 'auto', maxHeight: '60vh' }}>
          
          {/* Sektion A: GRÖSSEN-RADIOBUTTONS (Rendert nur, falls im DB-JSON vorhanden) */}
          {product.sizes && product.sizes.length > 0 && (
            <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '10px', color: '#3182ce' }}>Größe wählen:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {product.sizes.map((size, idx) => (
                  <label key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedSize?.name === size.name ? '#ebf8ff' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="radio" 
                        name="product-size" 
                        checked={selectedSize?.name === size.name} 
                        onChange={() => setSelectedSize(size)} 
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontWeight: 600 }}>{size.name}</span>
                    </div>
                    <span style={{ color: '#2b6cb0', fontWeight: 'bold' }}>{Number(size.price).toFixed(2).replace('.', ',')} €</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Sektion B: OPTIONEN-DROPDOWN (Rendert nur, falls im DB-JSON vorhanden, z.B. bei Nudeln) */}
          {product.options && product.options.length > 0 && (
            <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '10px', color: '#dd6b20' }}>Variante / Nudelsorte wählen:</h3>
              <select
                value={selectedOption || ''}
                onChange={(e) => setSelectedOption(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#fff', color: '#2d3748' }}
              >
                {product.options.map((opt, idx) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sektion C: STANDARD-ZUTATEN ABWÄHLEN */}
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

          {/* Sektion D: EXTRAS HINZUFÜGEN */}
          <h3 style={{ fontSize: '15px', marginBottom: '10px', color: '#319795' }}>Extra Zutaten hinzufügen:</h3>
          {product.ingredients && product.ingredients.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {product.ingredients.map((zutat) => {
                const isChecked = selectedExtras.some((z) => z.id === zutat.id);
                
                // Ermittle den anzuzeigenden Preis dynamisch anhand des extraIngredientPrice der Größe
                const currentExtraPrice = selectedSize && typeof selectedSize.extraIngredientPrice === 'number'
                  ? selectedSize.extraIngredientPrice
                  : Number(zutat.extraPrice);

                return (
                  <label key={zutat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', backgroundColor: isChecked ? '#e6fffa' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleToggleExtra(zutat)} style={{ width: '16px', height: '16px' }} />
                      <span style={{ fontWeight: 500 }}>{zutat.name}</span>
                    </div>
                    <span style={{ color: '#4a5568', fontSize: '14px' }}>+ {currentExtraPrice.toFixed(2).replace('.', ',')} €</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#a0aec0', fontSize: '13px' }}>Keine Extras für dieses Produkt verfügbar.</p>
          )}

          {/* Sektion E: KÜCHENANMERKUNG */}
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

        {/* MODAL FOOTER */}
        <div className="pml-cart-footer" style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
          <div className="pml-price-summary-row pml-total-row" style={{ marginBottom: '15px' }}>
            <span>Preis gesamt:</span>
            <span className="pml-total-price-badge">{currentTotalPrice.toFixed(2).replace('.', ',')} €</span>
          </div>
          <button 
            className="pml-btn-address-submit" 
            onClick={() => { 
              // Übergibt die Konfiguration (inklusive gewählter Größe & Option) an das Haupt-Widget
              onConfirm(
                { id: product.id, name: product.name, preis: activeBasePrice }, 
                selectedExtras, 
                removedZutaten, 
                anmerkung,
                selectedSize ? selectedSize.name : null,
                selectedOption
              ); 
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