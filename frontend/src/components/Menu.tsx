import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { ZutatenModal } from './ZutatenModal';

interface MenuProps {
  activeCategory: string;
  searchTerm: string;
}

// 1. Interface auf englische Backend-Namen angepasst
interface Zutat {
  id: number;
  name: string;
  extraPrice: string | number; // von 'aufpreis' zu 'extraPrice'
}

// 2. Interface auf englische Backend-Namen angepasst
interface Product {
  id: number;
  name: string;
  description: string; // von 'beschreibung' zu 'description'
  price: string | number; // von 'preis' zu 'price'
  isActive: boolean; // von 'aktiv' zu 'isActive'
  ingredients: Zutat[]; // von 'zutaten' zu 'ingredients'
}

// 3. Interface auf englische Backend-Namen angepasst
interface KategorieData {
  id: number;
  name: string;
  label: string;
  products: Product[]; // von 'produkte' zu 'products'
}

export const Menu: React.FC<MenuProps> = ({ activeCategory, searchTerm }) => {
  const { addToCart } = useCart();
  
  const [categoriesData, setCategoriesData] = useState<KategorieData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true);
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

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleConfirmExtras = (
    baseProduct: { id: number; name: string; preis: number }, 
    selectedExtras: Zutat[],
    removedZutaten: Array<{ id: number; name: string }>,
    anmerkung: string
  ) => {
    const formattedExtras = selectedExtras.map(z => ({
      id: z.id,
      name: z.name,
      preis: Number(z.extraPrice) // von z.aufpreis zu z.extraPrice geändert
    }));
    
    addToCart(baseProduct, formattedExtras, removedZutaten, anmerkung);
  };

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
          if (activeCategory !== 'alle' && cat.name.toLowerCase() !== activeCategory.toLowerCase()) {
            return null;
          }

          // Auf cat.products geändert statt cat.produkte & p.isActive statt p.aktiv
          let filteredProducts = (cat.products || []).filter(p => p.isActive !== false);

          if (searchTerm.trim() !== '') {
            filteredProducts = filteredProducts.filter(p => 
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) // p.description statt p.beschreibung
            );
          }

          if (filteredProducts.length === 0) return null;

          return (
            <div key={cat.id} className="pml-menu-category-group">
              <div className="pml-category-banner">
                {(cat.label || cat.name).toUpperCase()}
              </div>

              <div className="pml-products-grid">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="pml-product-card">
                    <div>
                      <h3 className="pml-product-title">{product.name}</h3>
                      {/* p.description statt p.beschreibung */}
                      <p className="pml-product-description">{product.description}</p> 
                    </div>
                    
                    <div className="pml-product-bottom">
                      <span className="pml-product-price">
                        {/* product.price statt product.preis */}
                        {Number(product.price).toFixed(2).replace('.', ',')} €
                      </span>
                      <button 
                        className="pml-btn-add-cart"
                        onClick={() => handleOpenModal(product)}
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

      <ZutatenModal 
        isOpen={isModalOpen}
        product={selectedProduct}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmExtras}
      />
    </section>
  );
};