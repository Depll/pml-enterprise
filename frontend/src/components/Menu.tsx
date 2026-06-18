import React from 'react';
import { useCart } from '../context/CartContext';

// Hier definieren wir, dass das Menü die Filter-Werte empfängt
interface MenuProps {
  activeCategory: string;
  searchTerm: string;
}

export const Menu: React.FC<MenuProps> = ({ activeCategory, searchTerm }) => {
  const context = useCart();
  const addToCart = context?.addToCart;

  // Deine echten Produkte aus der Speisekarte (Beispiel-Struktur, passe die Daten gerne an!)
  const allProducts = [
    { id: 1, name: 'Pizza Margherita', kategorie: 'Pizza', preis: '7.50', description: 'Mit fruchtiger Tomatensauce und feinstem Mozzarella.' },
    { id: 2, name: 'Pizza Salami', kategorie: 'Pizza', preis: '8.50', description: 'Mit herzhafter Salami und Mozzarella.' },
    { id: 3, name: 'Pasta Bologna', kategorie: 'Pasta', preis: '9.00', description: 'Mit klassischer Hackfleischsauce vom Rind.' },
    { id: 4, name: 'Insalata Mista', kategorie: 'Salate', preis: '6.50', description: 'Gemischter Salat mit hauseigenem Dressing.' },
    { id: 5, name: 'Chicken Tikka Masala', kategorie: 'Indisch', preis: '14.50', description: 'Zartes Hähnchenbrustfilet in traditioneller Gewürzsauce.' },
    { id: 6, name: 'Coca-Cola 1,0l', kategorie: 'Getränke', preis: '3.50', description: 'Erfrischend und eiskalt.' }
  ];

  // 1. Filter nach Kategorie
  let filteredProducts = allProducts;
  if (activeCategory !== 'alle') {
    filteredProducts = filteredProducts.filter(p => p.kategorie === activeCategory);
  }

  // 2. Filter nach Suchbegriff
  if (searchTerm.trim() !== '') {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Gruppierung nach Kategorien für die Banner-Anzeige (.pml-category-banner)
  const uniqueCategoriesInFiltered = Array.from(new Set(filteredProducts.map(p => p.kategorie)));

  return (
    <section className="pml-menu-section" id="speisekarte">
      <div className="pml-menu-container">
        <h2 className="pml-menu-main-title">Unsere Speisekarte</h2>

        {uniqueCategoriesInFiltered.map(cat => {
          const productsInCat = filteredProducts.filter(p => p.kategorie === cat);

          return (
            <div key={cat} className="pml-menu-category-group">
              {/* Das dunkle Kategorienschild aus deinem CSS */}
              <div className="pml-category-banner">
                {cat.toUpperCase()}
              </div>

              {/* Die Produkt-Grid-Matrix */}
              <div className="pml-products-grid">
                {productsInCat.map(product => (
                  <div key={product.id} className="pml-product-card">
                    <div>
                      <h3 className="pml-product-title">{product.name}</h3>
                      <p className="pml-product-description">{product.description}</p>
                    </div>
                    
                    <div className="pml-product-bottom">
                      <span className="pml-product-price">
                        {Number(product.preis).toFixed(2).replace('.', ',')} €
                      </span>
                      <button 
                        className="pml-btn-add-cart"
                        onClick={() => addToCart && (addToCart as any)({
                        id: product.id,
                        name: product.name,
                        preis: product.preis,
                        quantity: 1
                        })}
                      >
                        <span>+</span> Hinzufügen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <p style={{ textAlign: 'center', color: '#718096', marginTop: '20px' }}>
            Keine Gerichte für deine Auswahl gefunden. 🔍
          </p>
        )}
      </div>
    </section>
  );
};