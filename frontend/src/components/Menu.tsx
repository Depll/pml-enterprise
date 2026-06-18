import React, { useEffect, useState } from 'react';
import { fetchMenu, type Kategorie } from '../services/api';
import { useCart } from '../context/CartContext';

export const Menu: React.FC = () => {
  const [kategorien, setKategorien] = useState<Kategorie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchMenu().then((data) => {
      setKategorien(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'sans-serif' }}>Lade leckere Pizzen... 🍕</div>;
  }

  return (
    // Die pml-menu-section gibt den hellgrauen Hintergrund und das korrekte Padding
    <main className="pml-menu-section">
      <div className="pml-menu-container">
        <h1 className="pml-menu-main-title">Unsere Speisekarte</h1>

        {kategorien
          .filter(kat => kat.produkte && kat.produkte.length > 0)
          .map((kat) => (
            <div key={kat.id} className="pml-menu-category-group">
              {/* Der dunkle Kategorie-Banner */}
              <h2 className="pml-category-banner">
                {kat.label}
              </h2>
              
              {/* Das CSS-Grid für die Karten */}
              <div className="pml-products-grid">
                {kat.produkte.map((prod) => (
                  <div key={prod.id} className="pml-product-card">
                    <div>
                      <h3 className="pml-product-title">
                        {prod.id} - {prod.name}
                      </h3>
                      {prod.beschreibung && (
                        <p className="pml-product-description">
                          {prod.beschreibung}
                        </p>
                      )}
                    </div>
                    
                    <div className="pml-product-bottom">
                      <span className="pml-product-price">
                       ab {Number(prod.preis).toFixed(2).replace('.', ',')} €
                      </span>
                      <button 
                        className="pml-btn-add-cart"
                        onClick={() => addToCart(prod)}
                      >
                        In den Warenkorb <span>+</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </main>
  );
};