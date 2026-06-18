import React from 'react';

// Props für das Öffnen von Impressum und Datenschutz Modals
interface FooterProps {
  onOpenImpressum: () => void;
  onOpenDatenschutz: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenImpressum, onOpenDatenschutz }) => {
  return (
    <footer className="pml-milano-footer">
      <div className="pml-footer-inner">
        
        {/* Top Branding Bereich */}
        <div className="pml-footer-top-brand">
          <div className="pml-milano-logo-badge">
            <span className="pml-logo-main">Milano</span>
            <div className="pml-logo-sub">Pizzeria</div>
          </div>
          <p className="pml-footer-intro">
            Erleben Sie authentische italienische Küche mit unseren handgefertigten Pizzen und traditionellen Rezepten, frisch zu Ihnen nach Hause geliefert.
          </p>
        </div>

        {/* Vier-Spalten Grid-System */}
        <div className="pml-footer-columns-grid">
          
          {/* Spalte 1: Kontakt */}
          <div className="pml-footer-col">
            <h4>Kontakt</h4>
            <ul className="pml-contact-list">
              <li>
                <span className="pml-contact-icon">📞</span>
                <div>
                  <strong>Telefon:</strong><br />
                  0214 / 1234567
                </div>
              </li>
              <li>
                <span className="pml-contact-icon">📍</span>
                <div>
                  <strong>Adresse:</strong><br />
                  Musterstraße 42,<br />
                  51373 Leverkusen
                </div>
              </li>
            </ul>
          </div>

          {/* Spalte 2: Öffnungszeiten */}
          <div className="pml-footer-col">
            <h4>Öffnungszeiten</h4>
            <table className="pml-hours-table">
              <tbody>
                <tr>
                  <td>Mo - Fr:</td>
                  <td>11:30 - 22:00 Uhr</td>
                </tr>
                <tr>
                  <td>Sa:</td>
                  <td>13:00 - 23:00 Uhr</td>
                </tr>
                <tr>
                  <td>So & Feiertage:</td>
                  <td>12:00 - 22:00 Uhr</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Spalte 3: Social Media */}
          <div className="pml-footer-col">
            <h4>Social Media</h4>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="pml-fb-button">
              <span>🌐</span> Facebook Seite
            </a>
          </div>

          {/* Spalte 4: Rechtliches */}
          <div className="pml-footer-col">
            <h4>Rechtliches</h4>
            <ul className="pml-links-list">
              <li>
                <a 
                  href="#impressum" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    onOpenImpressum(); 
                  }}
                >
                  Impressum
                </a>
              </li>
              <li>
                <a 
                  href="#datenschutz" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    onOpenDatenschutz(); 
                  }}
                >
                  Datenschutz
                </a>
              </li>
            </ul>
          </div>

        </div>

        <hr className="pml-footer-divider" />
        <p className="pml-footer-copyright">
          © {new Date().getFullYear()} Pizza Milano Leverkusen. Alle Rechte vorbehalten.
        </p>
      </div>
    </footer>
  );
};