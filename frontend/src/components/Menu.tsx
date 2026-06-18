import React, { useEffect, useState } from 'react';
import { fetchMenu, type Kategorie } from '../services/api';

export const Menu: React.FC = () => {
  const [kategorien, setKategorien] = useState<Kategorie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMenu().then((data) => {
      setKategorien(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-center p-10">Lade leckere Pizzen... 🍕</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px', backgroundColor: '#09090b', color: '#fff', fontFamily: 'sans-serif', minHeight: 'screen' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '48px', color: '#ef4444' }}>
        Unsere Speisekarte 🍕
      </h1>
      
      {kategorien
        .filter(kat => kat.produkte && kat.produkte.length > 0)
        .map((kat) => (
          <div key={kat.id} style={{ marginBottom: '48px' }}>
            {/* Kategorie-Titel linksbündig mit gelber Linie */}
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '2px solid #eab308', paddingBottom: '8px', marginBottom: '24px', color: '#eab308', textAlign: 'left' }}>
              {kat.label}
            </h2>
            
            {/* Flexbox/Grid-Ersatz für die Produkte */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
              {kat.produkte.map((prod) => (
                <div 
                  key={prod.id} 
                  style={{ backgroundColor: '#18181b', padding: '20px', borderRadius: '12px', border: '1px solid #27272a', flex: '1 1 calc(50% - 24px)', minWidth: '280px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'between' }}
                >
                  <div>
                    {/* Name und Preis in einer Zeile, links- und rechtsbündig aufgeteilt */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left' }}>
                      <span style={{ color: '#f4f4f5' }}>{prod.name}</span>
                      <span style={{ color: '#4ade80', whiteSpace: 'nowrap' }}>
                        {Number(prod.preis).toFixed(2)} €
                      </span>
                    </div>
                    {/* Beschreibung darunter */}
                    {prod.beschreibung && (
                      <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginTop: '8px', fontStyle: 'italic', fontWeight: '300', textAlign: 'left', lineHeight: '1.5' }}>
                        {prod.beschreibung}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};