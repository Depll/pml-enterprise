import React from 'react';
import { useCart } from '../context/CartContext';

interface HeroProps {
  onOpenCart: () => void;
  onOpenPlz: () => void;
  currentPlz: string;
}

export const Hero: React.FC<HeroProps> = ({ onOpenCart, onOpenPlz, currentPlz }) => {
  const context = useCart();
  const cart = context?.cart || [];

  const totalItems = cart.reduce((sum: number, item: any) => {
    const qty = item.anzahl || item.quantity || 1;
    return sum + qty;
  }, 0);

  return (
    <>
      {/* NAVBAR */}
      <nav className="pml-navbar-milano">
        <div className="pml-nav-container">
          <div className="pml-logo-box">
            <span className="pml-logo-top">Milano</span>
            <span className="pml-logo-bottom">PIZZERIA</span>
          </div>

          <button className="pml-delivery-area" onClick={onOpenPlz}>
            <span className="material-symbols-outlined pml-pin-icon">location_on</span>
            <span className="pml-delivery-text">
              Liefergebiet: <strong>{currentPlz}</strong>
              <span className="pml-change-link">Ändern</span>
            </span>
          </button>

          <button className="pml-cart-box" onClick={onOpenCart}>
            <span className="pml-cart-icon">🛒</span>
            <span className={`pml-cart-badge ${totalItems === 0 ? 'pml-hidden' : ''}`}>
              ({totalItems})
            </span>
          </button>
        </div>
      </nav>

      {/* HERO BANNER - Jetzt mit Inline-Background-Verknüpfung */}
      <section 
        className="pml-hero-section" 
        style={{ backgroundImage: `linear-gradient(rgba(20, 24, 33, 0.85), rgba(20, 24, 33, 0.85)), url('/hero-bg.jpg')` }}
      >
        <div className="pml-hero-container">
          <div className="pml-hero-badge">
            <span className="pml-badge-dot"></span>
            Jetzt Pizza bestellen in Leverkusen
          </div>

          <h1 className="pml-hero-title">
            Authentische <br />
            <span className="pml-highlight-red">Italienische & Indische</span> <br />
            Spezialitäten
          </h1>

          <p className="pml-hero-description">
            Erleben Sie authentische Aromen aus zwei kulinarischen Welten – frisch gebackene italienische Pizza und 
            original indische Gerichte. Seit über 20 Jahren steht unser Familienbetrieb für Qualität, Tradition und Geschmack.
          </p>
          
          <div className="pml-hero-bottom-row">
            <button 
              className="pml-btn-order" 
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={() => document.getElementById('speisekarte')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Jetzt bestellen
            </button>
            
            <div className="pml-hero-features">
              <div className="pml-feature-item">
                <span className="pml-feature-icon">✅</span>
                <div className="pml-feature-text">
                  <strong>Kostenlose Lieferung</strong>
                  <span>ohne Mindestbestellwert</span>
                </div>
              </div>
              
              <div className="pml-feature-item">
                <span className="pml-feature-icon">🎁</span>
                <div className="pml-feature-text">
                  <strong>10% Rabatt</strong>
                  <span>Bei Bestellung über unsere Webseite</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};