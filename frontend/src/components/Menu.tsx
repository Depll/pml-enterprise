import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

interface MenuProps {
  activeCategory: string;
  searchTerm: string;
}

// Interfaces exakt angepasst an deine NestJS-Struktur ("getSpeisekarte")
interface Zutat {
  id: number;
  name: string;
  aufpreis: string | number;
}

interface Product {
  id: number;
  name: string;
  beschreibung: string;
  preis: string | number;
  aktiv: boolean;
  zutaten: Zutat[];
}

interface KategorieData {
  id: number;
  name: string; // z.B. "pizza"
  label: string; // z.B. "Pizza"
  produkte: Product[];
}

export const Menu: React.FC<MenuProps> = ({ activeCategory, searchTerm }) => {
  const { addToCart } = useCart();
  
  const [categoriesData, setCategoriesData] = useState<KategorieData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true);
        // Prüfe hier, ob dein MenuController auf '/menu' oder '/api/menu' hört!
        const response = await fetch('http://localhost:3000/menu'); 
        
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Speisekarte');
        }
        
        const data = await response.json();
        setCategoriesData(data);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError('Die Speisekarte konnte nicht geladen werden.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []);

  if (isLoading) {
    return (
      <section className="pml-menu-section">
        <p style={{ textAlign: 'center', color: '#718096', padding: '40px' }}>
          Speisekarte wird geladen... 🍕
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="pml-menu-section">
        <p style={{ textAlign: 'center', color: '#e53e3e', padding: '40px' }}>
          {error}
        </p>
      </section>
    );
  }

  return (
    <section className="pml-menu-section" id="speisekarte">
      <div className="pml-menu-container">
        <h2 className="pml-menu-main-title">Unsere Speisekarte</h2>

        {categoriesData.map((cat) => {
          // 1. Filter nach aktiver Kategorie im Frontend-Tab
          if (activeCategory !== 'alle' && cat.name.toLowerCase() !== activeCategory.toLowerCase()) {
            return null;
          }

          // 2. Filter nach Suchbegriff innerhalb der Produkte dieser Kategorie
          let filteredProducts = cat.produkte || [];
          if (searchTerm.trim() !== '') {
            filteredProducts = filteredProducts.filter(p => 
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (p.beschreibung && p.beschreibung.toLowerCase().includes(searchTerm.toLowerCase()))
            );
          }

          // Wenn durch die Suche keine Produkte in dieser Kategorie übrig bleiben, blenden wir sie aus
          if (filteredProducts.length === 0) return null;

          return (
            <div key={cat.id} className="pml-menu-category-group">
              {/* Nutzen das 'label' für die schöne Anzeige (z.B. "PIZZA") */}
              <div className="pml-category-banner">
                {(cat.label || cat.name).toUpperCase()}
              </div>

              <div className="pml-products-grid">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="pml-product-card">
                    <div>
                      <h3 className="pml-product-title">{product.name}</h3>
                      <p className="pml-product-description">{product.beschreibung}</p>
                    </div>
                    
                    <div className="pml-product-bottom">
                      <span className="pml-product-price">
                        {Number(product.preis).toFixed(2).replace('.', ',')} €
                      </span>
                      <button 
                        className="pml-btn-add-cart"
                        onClick={() => addToCart({
                          id: product.id,
                          name: product.name,
                          preis: Number(product.preis)
                        })}
                      >
                        <span>+</span> In den Warenkorb
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};