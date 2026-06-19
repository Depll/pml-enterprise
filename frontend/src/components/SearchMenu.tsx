import React, { useState, useEffect } from 'react';

// Interface angepasst: categories wurde hier heraugelöscht
interface SearchMenuProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onSearchChange: (searchTerm: string) => void;
}

interface BackendKategorie {
  id: number;
  name: string; // z.B. "pizza"
  label: string; // z.B. "Pizza"
}

export const SearchMenu: React.FC<SearchMenuProps> = ({ 
  activeCategory, 
  onCategoryChange,
  onSearchChange 
}) => {
  const [dynamicCategories, setDynamicCategories] = useState<BackendKategorie[]>([]);

  // Hol die echten Kategorien live aus deinem NestJS-Backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:3000/menu'); 
        if (response.ok) {
          const data = await response.json();
          // Wir holen uns ID, Name und Label aus den geladenen Kategorien
          const kats = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            label: item.label,
          }));
          setDynamicCategories(kats);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Filter-Kategorien:', err);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section className="pml-search-section">
      <div className="pml-search-container">
        <h2 className="pml-search-title">Worauf hast du heute Lust?</h2>
        
        {/* Suchfeld mit Event-Trigger */}
        <div className="pml-search-box-wrapper">
          <span className="material-symbols-outlined pml-search-field-icon">search</span>
          <input 
            type="text" 
            placeholder="Nach Pizza, Pasta oder Salaten suchen..." 
            className="pml-search-input"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Dynamische Kategorieliste direkt aus den Backend-Daten */}
        <div className="pml-categories-scroll-wrapper">
          <div className="pml-categories-list">
            <span 
              className={`pml-category-item ${activeCategory === 'alle' ? 'pml-active' : ''}`}
              onClick={() => onCategoryChange('alle')}
            >
              🍽️ Alles anzeigen
            </span>
            
            {dynamicCategories.map((cat) => (
              <span 
                key={cat.id}
                className={`pml-category-item ${activeCategory.toLowerCase() === cat.name.toLowerCase() ? 'pml-active' : ''}`}
                onClick={() => onCategoryChange(cat.name)}
              >
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};