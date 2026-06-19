import React, { useState } from 'react';

interface PlzModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (neuePlz: string) => void;
  currentPlz: string;
  errorMessage?: string; // Definiert in den Props
}

// 1. HIER errorMessage aus den Props mit herausziehen:
export const PlzModal: React.FC<PlzModalProps> = ({ isOpen, onClose, onSave, currentPlz, errorMessage }) => {
  const [inputValue, setInputValue] = useState<string>(currentPlz);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = () => {
    // Einfache Vorab-Validierung im Frontend
    if (inputValue.trim().length !== 5) {
      setErrorMsg('Bitte gib eine gültige 5-stellige Postleitzahl ein.');
      return;
    }
    
    setErrorMsg('');
    onSave(inputValue); // Schickt die PLZ an App.tsx für den Backend-Check
    // HINWEIS: onClose() wurde hier entfernt, da App.tsx das Modal schließt, wenn die DB ihr "OK" gibt!
  };

  // Wir nutzen die Frontend-Fehlermeldung ODER die Backend-Fehlermeldung, falls vorhanden
  const anzuzeigenderFehler = errorMsg || errorMessage;

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

        {/* 2. HIER GENAU wird der Fehler dynamisch eingeblendet */}
        <p className={`pml-plz-error-msg ${anzuzeigenderFehler ? '' : 'pml-hidden'}`}>
          {anzuzeigenderFehler}
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