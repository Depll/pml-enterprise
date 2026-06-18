import React, { useState } from 'react';

// Wir definieren Props, um die echten Kategorien aus der App zu übergeben
interface SearchMenuProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onSearchChange: (searchTerm: string) => void;
}

export const SearchMenu: React.FC<SearchMenuProps> = ({ 
  categories, 
  activeCategory, 
  onCategoryChange,
  onSearchChange 
}) => {
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

        {/* Dynamische Kategorieliste aus deinen echten Daten */}
        <div className="pml-categories-scroll-wrapper">
          <div className="pml-categories-list">
            <span 
              className={`pml-category-item ${activeCategory === 'alle' ? 'pml-active' : ''}`}
              onClick={() => onCategoryChange('alle')}
            >
              🍽️ Alles anzeigen
            </span>
            
            {categories.map((cat) => (
              <span 
                key={cat}
                className={`pml-category-item ${activeCategory === cat ? 'pml-active' : ''}`}
                onClick={() => onCategoryChange(cat)}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};