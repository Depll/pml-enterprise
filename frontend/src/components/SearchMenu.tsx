import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api'; // Pfad anpassen, falls nötig

interface SearchMenuProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onSearchChange: (searchTerm: string) => void;
}

interface BackendCategory {
  id: number;
  name: string;
  label: string;
}

export const SearchMenu: React.FC<SearchMenuProps> = ({ 
  activeCategory, 
  onCategoryChange,
  onSearchChange 
}) => {
  const [dynamicCategories, setDynamicCategories] = useState<BackendCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      // 1. Nutze die zentrale fetchMenu-Funktion aus der api.ts
      const data = await apiService.fetchMenu();
      
      // 2. Deine Mapping-Logik für die Filter-Labels bleibt genau gleich
      const categories = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        label: item.label || item.name, 
      }));
      setDynamicCategories(categories);
    };

    fetchCategories();
  }, []);

  return (
    <section className="pml-search-section">
      <div className="pml-search-container">
        <h2 className="pml-search-title">Worauf hast du heute Lust?</h2>
        
        {/* Search field */}
        <div className="pml-search-box-wrapper">
          <span className="material-symbols-outlined pml-search-field-icon">search</span>
          <input 
            type="text" 
            placeholder="Nach Pizza, Pasta oder Salaten suchen..." 
            className="pml-search-input"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Dynamic category list from backend data */}
        <div className="pml-categories-scroll-wrapper">
          <div className="pml-categories-list">
            <span 
              className={`pml-category-item ${activeCategory === 'alle' ? 'pml-active' : ''}`}
              onClick={() => onCategoryChange('alle')}
            >
              🍽️ Alles anzeigen
            </span>
            
            {dynamicCategories.map((category) => (
              <span 
                key={category.id}
                className={`pml-category-item ${activeCategory.toLowerCase() === category.name.toLowerCase() ? 'pml-active' : ''}`}
                onClick={() => onCategoryChange(category.name)}
              >
                {category.label.charAt(0).toUpperCase() + category.label.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
