import React, { useState } from 'react';

interface PlzModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (neuePlz: string) => void;
  currentPlz: string;
}

export const PlzModal: React.FC<PlzModalProps> = ({ isOpen, onClose, onSave, currentPlz }) => {
  const [inputValue, setInputValue] = useState<string>(currentPlz);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Wenn das Modal laut State geschlossen sein soll, rendern wir gar nichts
  if (!isOpen) return null;

  const handleSave = () => {
    // Einfache Validierung: Gültige Leverkusener PLZ prüfen (Beispiel)
    if (inputValue.trim().length !== 5) {
      setErrorMsg('Bitte gib eine gültige 5-stellige Postleitzahl ein.');
      return;
    }
    
    setErrorMsg('');
    onSave(inputValue);
    onClose(); // Schließt das Modal nach dem Speichern
  };

  return (
    <div className="pml-modal-overlay">
      <div className="pml-modal-content-card">
        
        {/* Logo im Modal */}
        <div className="pml-modal-logo-area">
          <span className="pml-logo-main">Milano</span>
          <span className="pml-logo-sub">PIZZERIA</span>
        </div>

        <h2 className="pml-modal-main-title">Lieferadresse prüfen</h2>
        <p className="pml-modal-sub-text">
          Gib deine Postleitzahl ein, um zu prüfen, ob wir deine Bestellung zu dir nach Hause liefern können.
        </p>

        {/* Fehleranzeige */}
        <p className={`pml-plz-error-msg ${errorMsg ? '' : 'pml-hidden'}`}>
          {errorMsg}
        </p>

        <div className="pml-modal-input-container">
          <input 
            type="text" 
            id="plz-input" 
            placeholder="Deine PLZ (z.B. 51373)" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            maxLength={5}
          />
        </div>

        <button className="pml-btn-modal-save" onClick={handleSave}>
          Speichern & Weiter
        </button>

      </div>
    </div>
  );
};