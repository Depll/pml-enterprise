import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { IngredientsModal } from './IngredientsModal';

interface MenuProps {
  activeCategory: string;
  searchTerm: string;
  menuData: any[];    // <-- NEU: Hier kommen die zentralen Daten rein
  isLoading: boolean; // <-- NEU: Hier kommt der zentrale Ladezustand rein
}

interface Ingredient {
  id: number;
  name: string;
  extraPrice: string | number; 
}

interface ProductSize {
  name: string;
  price: number;
  extraIngredientPrice?: number;
}

interface Product {
  id: number;
  name: string;
  description: string; 
  price: string | number; 
  isActive: boolean; 
  ingredients: Ingredient[]; 
  sizes: ProductSize[] | null;  
  options: string[] | null;
}

export const Menu: React.FC<MenuProps> = ({ activeCategory, searchTerm, menuData, isLoading }) => {
  const { addToCart } = useCart();
  
  // Der categoriesData State und der gesamte useEffect fliegen komplett raus!
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleConfirmExtras = (
    baseProduct: { id: number; name: string; price: number }, 
    selectedExtras: Array<{ id: number; name: string; price: number }>,
    removedIngredients: Array<{ id: number; name: string }>,
    comment: string,
    selectedSize: string | null,
    selectedOption: string | null
  ) => {
    const formattedExtras = selectedExtras.map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      price: Number(ingredient.price || (ingredient as any).extraPrice || 0)
    }));

    addToCart(baseProduct, formattedExtras, removedIngredients, comment, selectedSize, selectedOption);
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

  return (
    <section className="pml-menu-section" id="speisekarte">
      <div className="pml-menu-container">
        <h2 className="pml-menu-main-title">Unsere Speisekarte</h2>

        {/* Wir mappen nun direkt über die übergebenen menuData */}
        {(menuData || []).map((cat: any) => {
          if (activeCategory !== 'alle' && cat.name.toLowerCase() !== activeCategory.toLowerCase()) {
            return null;
          }

          let filteredProducts = (cat.products || []).filter((p: any) => p.isActive !== false);

          if (searchTerm.trim() !== '') {
            filteredProducts = filteredProducts.filter((p: any) => 
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
          }

          if (filteredProducts.length === 0) return null;

          return (
            <div key={cat.id} className="pml-menu-category-group">
              <div className="pml-category-banner">
                {(cat.label || cat.name).toUpperCase()}
              </div>

              <div className="pml-products-grid">
                {filteredProducts.map((product: any) => (
                  <div key={product.id} className="pml-product-card">
                    <div>
                      <h3 className="pml-product-title">{product.name}</h3>
                      <p className="pml-product-description">{product.description}</p> 
                    </div>
                    
                    <div className="pml-product-bottom">
                      <span className="pml-product-price">
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

      <IngredientsModal 
        isOpen={isModalOpen}
        product={selectedProduct}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmExtras}
      />
    </section>
  );
};