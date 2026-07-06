import React from 'react';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="pml-modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="pml-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="pml-modal-header">
          <h2 className="pml-modal-title">Impressum</h2>
          <button className="pml-modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="pml-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', color: '#cbd5e1', lineHeight: '1.6' }}>
          <h3 style={{ color: '#fff', marginTop: '0' }}>Angaben gemäß § 5 TMG</h3>
          <p>
            Pizzeria Milano<br />
            Musterstraße 123<br />
            51373 Leverkusen
          </p>

          <h3 style={{ color: '#fff' }}>Kontakt</h3>
          <p>
            Telefon: 0214 / 1234567<br />
            E-Mail: info@pizzeria-milano-leverkusen.de
          </p>

          <h3 style={{ color: '#fff' }}>Vertreten durch</h3>
          <p>Max Mustermann</p>

          <h3 style={{ color: '#fff' }}>Umsatzsteuer-ID</h3>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
            DE 123 456 789
          </p>

          <h3 style={{ color: '#fff' }}>EU-Streitschlichtung</h3>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#ef4444' }}>
              https://ec.europa.eu/consumers/odr
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};